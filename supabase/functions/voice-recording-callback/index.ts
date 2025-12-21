import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!TWILIO_AUTH_TOKEN) {
      throw new Error('Missing TWILIO_AUTH_TOKEN');
    }

    // Validate Twilio signature for security
    const twilioSignature = req.headers.get('x-twilio-signature');
    if (!twilioSignature) {
      console.warn('Missing Twilio signature - rejecting request');
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse form data first (needed for signature validation)
    const url = new URL(req.url);

    const formData = await req.formData();
    const params: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    // Build signature validation string
    let signatureString = url.origin + url.pathname;
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
      signatureString += key + params[key];
    }

    // Compute expected signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(TWILIO_AUTH_TOKEN);
    const messageData = encoder.encode(signatureString);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    // Compare signatures (constant-time comparison)
    if (expectedSignature !== twilioSignature) {
      console.error('Invalid Twilio signature - potential spoofing attempt');
      return new Response(JSON.stringify({ error: 'Forbidden - Invalid Signature' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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

    // Validate recording status
    const validStatuses = ['in-progress', 'completed', 'absent', 'failed'];
    if (!validStatuses.includes(RecordingStatus)) {
      console.error('Invalid recording status:', RecordingStatus);
      return new Response(JSON.stringify({ error: 'Invalid recording status' }), {
        status: 400,
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

    // Create idempotency key for recording updates
    const idempotencyKey = `${CallSid}-${RecordingSid}-${RecordingStatus}`;

    // Store recording status in call_lifecycle table (idempotent)
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
          updated_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'call_sid'
      });

    if (upsertError) {
      console.error('Error upserting recording lifecycle:', upsertError);
    }

    // If recording is completed, trigger transcription pipeline
    if (RecordingStatus === 'completed' && RecordingUrl) {
      console.log('🎯 Recording completed, triggering transcription pipeline for CallSid:', CallSid);

      // Log recording_completed timeline event
      await supabase.from('call_timeline').insert({
        call_sid: CallSid,
        event: 'recording_completed',
        timestamp: new Date().toISOString(),
        metadata: {
          recording_sid: RecordingSid,
          recording_url: RecordingUrl,
          recording_duration: RecordingDuration,
          idempotency_key: idempotencyKey
        }
      });

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
            await supabase.from('call_processing_queue').insert({
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
              created_at: new Date().toISOString()
            });

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