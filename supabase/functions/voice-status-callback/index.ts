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

    // Extract parameters (already parsed above)
    const CallSid = params['CallSid'];
    const CallStatus = params['CallStatus'];
    const CallDuration = params['CallDuration'];
    const From = params['From'];
    const To = params['To'];
    const RecordingUrl = params['RecordingUrl'];
    // PHASE 1B: Extract statusCallbackEvent (Twilio sends this to indicate which event triggered the callback)
    const StatusCallbackEvent = params['StatusCallbackEvent'];

    // Input validation
    if (!CallSid || !CallStatus) {
      console.error('Missing required Twilio parameters');
      return new Response(JSON.stringify({ error: 'Bad Request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PHASE 1B: Only accept statusCallbackEvent values: initiated, ringing, answered, completed
    // Twilio maps these to CallStatus as: queued (initiated), ringing, in-progress (answered), completed
    // We accept the CallStatus values that correspond to our configured events
    const validStatuses = ['queued', 'ringing', 'in-progress', 'completed'];
    if (!validStatuses.includes(CallStatus)) {
      console.warn(`Ignoring status callback with CallStatus=${CallStatus} (not in configured events)`);
      // Return 200 OK to prevent Twilio retries, but don't process
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Call status update:', { CallSid, CallStatus, CallDuration, StatusCallbackEvent });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    // PHASE 1B: Create idempotency key for status updates (by CallSid + CallStatus + timestamp to second)
    const idempotencyKey = `${CallSid}-${CallStatus}-${now.slice(0, 19)}`;

    // PHASE 3: Log status_event timeline (idempotent by unique constraint)
    const { error: statusError } = await supabase.from('call_timeline').insert({
      call_sid: CallSid,
      event: 'status_event',
      timestamp: now,
      metadata: {
        status: CallStatus,
        status_callback_event: StatusCallbackEvent,
        duration: CallDuration,
        idempotency_key: idempotencyKey
      }
    });
    // Ignore duplicate key errors (idempotency)
    if (statusError && !String(statusError.message || statusError).includes('duplicate key')) {
      console.error('Failed to log status_event timeline:', statusError);
    }

    // PHASE 3: Add status_completed marker when call completes
    if (CallStatus === 'completed') {
      const { error: completedError } = await supabase.from('call_timeline').insert({
        call_sid: CallSid,
        event: 'status_completed',
        timestamp: now,
        metadata: {
          duration: CallDuration,
          idempotency_key: idempotencyKey
        }
      });
      if (completedError && !String(completedError.message || completedError).includes('duplicate key')) {
        console.error('Failed to log status_completed timeline:', completedError);
      }
    }

    // Sanitize duration (must be a valid number)
    const durationRaw = Number.parseInt(CallDuration ?? "0", 10);
    const duration = Number.isFinite(durationRaw) && durationRaw >= 0 ? durationRaw : 0;

    // PHASE 1B: Store in call_lifecycle table for tracking (idempotent by call_sid)
    const { error: upsertError } = await supabase
      .from('call_lifecycle')
      .upsert({
        call_sid: CallSid,
        status: CallStatus,
        direction: 'inbound',
        talk_seconds: duration,
        meta: {
          recording_url: RecordingUrl,
          idempotency_key: idempotencyKey,
          status_callback_event: StatusCallbackEvent,
          updated_at: now
        },
        updated_at: now
      }, {
        onConflict: 'call_sid'
      });

    if (upsertError) {
      console.error('Error upserting call lifecycle:', upsertError);
    }

    // Log event for analytics
    await supabase.from('analytics_events').insert({
      event_type: 'twilio_call_status',
      event_data: {
        call_sid: CallSid,
        status: CallStatus,
        duration: CallDuration,
        from: From,
        to: To,
        recording_url: RecordingUrl,
        idempotency_key: idempotencyKey,
        timestamp: new Date().toISOString()
      },
      severity: 'info'
    });

    // Return 200 OK for idempotency
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing call status:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});