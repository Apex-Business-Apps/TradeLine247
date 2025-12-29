import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateTwilioRequest } from "../_shared/twilioValidator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // PHASE 2: Validate Twilio signature using shared validator (handles proxy URL reconstruction)
    const url = new URL(req.url);
    const params = await validateTwilioRequest(req, url.toString());

    console.log('✅ Twilio signature validated successfully');

    // Extract recording callback parameters
    const CallSid = params['CallSid'];
    const RecordingSid = params['RecordingSid'];
    const RecordingUrl = params['RecordingUrl'];
    const RecordingStatus = params['RecordingStatus'];
    const RecordingDuration = params['RecordingDuration'];
    const RecordingChannels = params['RecordingChannels'];
    const RecordingSource = params['RecordingSource'];

    // Input validation
    if (!CallSid || !RecordingSid || !RecordingStatus) {
      console.error('Missing required Twilio recording parameters');
      return new Response(JSON.stringify({ error: 'Bad Request - Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PHASE 1C: Only accept recordingStatusCallbackEvent values: in-progress, completed, absent (default completed)
    // DO NOT implement "failed" as a recording event per Twilio requirements
    const validStatuses = ['in-progress', 'completed', 'absent'];
    if (!validStatuses.includes(RecordingStatus)) {
      console.warn(`Ignoring recording callback with RecordingStatus=${RecordingStatus} (not in configured events)`);
      // Return 200 OK to prevent Twilio retries, but don't process
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🎵 Recording status update:', {
      CallSid,
      RecordingSid,
      RecordingStatus,
      RecordingUrl: RecordingUrl ? '[REDACTED_URL]' : null,
      RecordingDuration
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    // PHASE 1C: Create idempotency key for recording updates (by CallSid + RecordingSid + RecordingStatus)
    const idempotencyKey = `${CallSid}-${RecordingSid}-${RecordingStatus}`;

    // PHASE 1C: Store recording status in call_lifecycle table (idempotent by call_sid)
    const { error: upsertError } = await supabase
      .from('call_lifecycle')
      .upsert({
        call_sid: CallSid,
        status: 'recording_' + RecordingStatus,
        meta: {
          recording_sid: RecordingSid,
          recording_url: RecordingUrl,
          recording_duration: RecordingDuration,
          recording_channels: RecordingChannels,
          recording_source: RecordingSource,
          idempotency_key: idempotencyKey,
          updated_at: now
        },
        updated_at: now
      }, {
        onConflict: 'call_sid'
      });

    if (upsertError) {
      console.error('Error upserting recording lifecycle:', upsertError);
    }

    // PHASE 3: Log recording status timeline events (idempotent by unique constraint)
    const { error: timelineError } = await supabase.from('call_timeline').insert({
      call_sid: CallSid,
      event: 'recording_' + RecordingStatus,
      timestamp: now,
      metadata: {
        recording_sid: RecordingSid,
        recording_url: RecordingUrl ? '[REDACTED_URL]' : null,
        recording_duration: RecordingDuration,
        idempotency_key: idempotencyKey
      }
    });
    // Ignore duplicate key errors (idempotency)
    if (timelineError && !String(timelineError.message || timelineError).includes('duplicate key')) {
      console.error('Failed to log recording timeline:', timelineError);
    }

    // If recording is completed, trigger transcription pipeline
    if (RecordingStatus === 'completed' && RecordingUrl) {
      console.log('🎯 Recording completed, triggering transcription pipeline for CallSid:', CallSid);

      // PHASE 3: Add recording_completed timeline marker
      const { error: completedError } = await supabase.from('call_timeline').insert({
        call_sid: CallSid,
        event: 'recording_completed',
        timestamp: now,
        metadata: {
          recording_sid: RecordingSid,
          recording_url: RecordingUrl,
          recording_duration: RecordingDuration,
          idempotency_key: idempotencyKey
        }
      });
      if (completedError && !String(completedError.message || completedError).includes('duplicate key')) {
        console.error('Failed to log recording_completed timeline:', completedError);
      }

      try {
        // Update call_logs with recording data
        const { error: updateError } = await supabase
          .from('call_logs')
          .update({
            recording_url: RecordingUrl,
            recording_duration: parseInt(RecordingDuration || '0'),
            recording_status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('call_sid', CallSid);

          if (updateError) {
            console.error('Error updating call_logs with recording:', updateError);
          } else {
            // Enqueue transcription task
            // PHASE 1C: Enqueue transcription task (idempotent by call_sid + operation)
            const { error: queueError } = await supabase.from('call_processing_queue').insert({
              call_sid: CallSid,
              operation: 'transcribe_recording',
              status: 'pending',
              priority: 'normal',
              metadata: {
                recording_url: RecordingUrl,
                recording_sid: RecordingSid,
                duration: RecordingDuration,
                idempotency_key: idempotencyKey
              },
              created_at: now
            });
            // Ignore duplicate key errors (idempotency)
            if (queueError && !String(queueError.message || queueError).includes('duplicate key')) {
              console.error('Failed to enqueue transcription task:', queueError);
            }

            console.log('✅ Recording queued for transcription processing');
          }
      } catch (error) {
        console.error('Error processing completed recording:', error);
      }
    }

    // Log recording event for analytics
    await supabase.from('analytics_events').insert({
      event_type: 'twilio_recording_status',
      event_data: {
        call_sid: CallSid,
        recording_sid: RecordingSid,
        recording_status: RecordingStatus,
        recording_duration: RecordingDuration,
        recording_channels: RecordingChannels,
        recording_source: RecordingSource,
        has_recording_url: !!RecordingUrl,
        idempotency_key: idempotencyKey,
        timestamp: new Date().toISOString()
      },
      severity: 'info'
    });

    // Return 200 OK for idempotency
    return new Response(JSON.stringify({
      success: true,
      status: RecordingStatus,
      call_sid: CallSid,
      recording_sid: RecordingSid,
      idempotency_key: idempotencyKey
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing recording status:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});