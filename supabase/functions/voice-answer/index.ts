 
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateTwilioRequest } from "../_shared/twilioValidator.ts";
import { buildInternalNumberSet, isInternalCaller, safeDialTarget } from "../_shared/antiLoop.ts";
import { createStreamToken } from "../_shared/stream_token.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FORWARD_TARGET_E164 = Deno.env.get('BUSINESS_TARGET_E164');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Hotline configuration - assistant-first mode
    const HOTLINE_DID = Deno.env.get('HOTLINE_DID') || '+15877428885';
    const HOTLINE_ASSISTANT_ONLY = (Deno.env.get('HOTLINE_ASSISTANT_ONLY') || 'false') === 'true';
    const VOICE_STREAM_SECRET = Deno.env.get('VOICE_STREAM_SECRET') || supabaseServiceKey;
    const HOTLINE_ALERT_WEBHOOK = Deno.env.get('HOTLINE_ALERT_WEBHOOK');

    if (!FORWARD_TARGET_E164) {
      throw new Error('Missing required environment variables');
    }

    if (!VOICE_STREAM_SECRET) {
      throw new Error('VOICE_STREAM_SECRET must be set for secure stream authentication');
    }

    // CRITICAL: Enforce E.164 format for bridge target
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(FORWARD_TARGET_E164)) {
      console.error('CRITICAL: BUSINESS_TARGET_E164 is not in valid E.164 format:', FORWARD_TARGET_E164);
      throw new Error('Invalid bridge target configuration - must be E.164 format');
    }

    // Validate Twilio signature using shared validator (handles proxy URL reconstruction)
    const url = new URL(req.url);
    const params = await validateTwilioRequest(req, url.toString());

    const recordingParam = url.searchParams.get('recording_enabled');
    const hasRecordingParam = recordingParam !== null;
    const recordingEnabled = recordingParam === 'true';

    // Check for fallback and hotline flags
    const isFallback = url.searchParams.get('fallback') === 'true';
    const isHotlineFallback = url.searchParams.get('hotline') === 'true';

    console.log('✅ Twilio signature validated successfully');

    // HOTLINE FALLBACK HANDLER: When stream handshake fails, don't dial - notify ops instead
    if (isFallback && isHotlineFallback) {
      const CallSid = params['CallSid'] || 'unknown';
      const From = params['From'] || 'unknown';

      console.error('Hotline stream fallback triggered:', { CallSid, From });

      // Create supabase client for logging
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Log the fallback event
      await supabase.from('call_timeline').insert({
        call_sid: CallSid,
        event: 'hotline_fallback',
        timestamp: new Date().toISOString(),
        metadata: {
          from: From,
          reason: 'stream_handshake_failed'
        }
      }).catch(e => console.error('Failed to log fallback:', e));

      // Insert alert for ops
      await supabase.from('hotline_alerts').insert({
        call_sid: CallSid,
        reason: 'stream_handshake_failed',
        from_e164: From,
        created_at: new Date().toISOString()
      }).catch(e => console.error('Failed to insert hotline alert:', e));

      // Optionally fire webhook to ops
      if (HOTLINE_ALERT_WEBHOOK) {
        fetch(HOTLINE_ALERT_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callSid: CallSid,
            from: From,
            reason: 'stream_handshake_failed',
            timestamp: new Date().toISOString()
          })
        }).catch(e => console.error('Failed to send alert webhook:', e));
      }

      // Return friendly message - NO DIAL for hotline
      const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry. We're temporarily unable to connect the assistant. Our team has been notified. Please try calling again in a few minutes, or leave a message after the tone.</Say>
  <Record maxLength="120" transcribe="true" playBeep="true" />
  <Say voice="Polly.Joanna">Thank you for your message. Goodbye.</Say>
  <Hangup/>
</Response>`;

      return new Response(fallbackTwiml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' }
      });
    }

    // Extract parameters
    const CallSid = params['CallSid'];
    const From = params['From'];
    const To = params['To'];
    const AnsweredBy = params['AnsweredBy']; // AMD result

    // Input validation
    if (!CallSid || !From || !To) {
      console.error('Missing required Twilio parameters');
      return new Response('Bad Request', { status: 400 });
    }

    // Sanitize phone numbers
    if (!e164Regex.test(From) || !e164Regex.test(To)) {
      console.error('Invalid phone number format');
      return new Response('Bad Request', { status: 400 });
    }

    // Early consent prompt (strict opt-in: default is no-record)
    if (!hasRecordingParam) {
      const consentUrl = `${supabaseUrl}/functions/v1/voice-consent`;
      const twimlConsent = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="${consentUrl}" method="POST" input="dtmf" numDigits="1" timeout="4">
    <Say voice="Polly.Joanna">Press 1 to consent to recording. Otherwise, we will continue without recording.</Say>
  </Gather>
  <Redirect method="POST">${consentUrl}</Redirect>
</Response>`;

      return new Response(twimlConsent, {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    // Anti-loop protections
    const internalNumbers = buildInternalNumberSet(Deno.env.toObject() as Record<string, string | undefined>);
    const internalCaller = isInternalCaller(From, internalNumbers);
    const dialTarget = safeDialTarget(FORWARD_TARGET_E164, From, To, internalNumbers);
    const canDial = !!dialTarget;

    // Hotline detection - assistant-first mode (never forward, always AI)
    const isHotline = (To === HOTLINE_DID) || HOTLINE_ASSISTANT_ONLY;

    // Helper to create secure stream URL with short-lived HMAC token
    async function makeStreamUrl(callSid: string): Promise<string> {
      const token = await createStreamToken(VOICE_STREAM_SECRET, callSid, 3 * 60 * 1000); // 3m TTL
      const base = supabaseUrl.replace('https://', '');
      return `wss://${base}/functions/v1/enhanced-voice-stream?callSid=${callSid}&streamToken=${token}`;
    }

    console.log('Incoming call:', { CallSid, From, To, AnsweredBy, isHotline });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // PHASE 3: Add timeline marker - inbound_received
    const now = new Date().toISOString();
    await supabase.from('call_timeline').insert({
      call_sid: CallSid,
      event: 'inbound_received',
      timestamp: now,
      metadata: {
        from: From,
        to: To,
        answered_by: AnsweredBy
      }
    });
    
    // Get voice config
    const { data: config } = await supabase
      .from('voice_config')
      .select('*')
      .single();

    // Create call log (idempotent by call_sid unique constraint)
    const { error: insertError } = await supabase.from('call_logs').insert({
      call_sid: CallSid,
      from_e164: From,
      to_e164: To,
      started_at: now,
      status: 'initiated',
      amd_detected: AnsweredBy === 'machine_start' || AnsweredBy === 'machine_end_beep',
    });
    // Ignore duplicate key errors (idempotency)
    if (insertError && !String(insertError.message || insertError).includes('duplicate key')) {
      console.error('Failed to create call log:', insertError);
    }

    // AMD Detection: If voicemail detected, use LLM path
    const isVoicemail = AnsweredBy === 'machine_start' || AnsweredBy === 'machine_end_beep';
    const pickupMode = config?.pickup_mode || 'immediate';
    const amdEnabled = config?.amd_enable !== false;
    const failOpen = config?.fail_open !== false;

    // Determine if we should use LLM or bridge
    const useLLM = isVoicemail && amdEnabled;
    
    let twiml: string;

    // Check concurrent stream limit (max 10 per org to prevent overload)
    const { count: activeStreams } = await supabase
      .from('voice_stream_logs')
      .select('*', { count: 'exact', head: true })
      .is('connected_at', null)
      .gte('started_at', new Date(Date.now() - 30000).toISOString()); // Last 30s
    
    const realtimeEnabled = config?.stream_enabled !== false;
    const withinConcurrencyLimit = (activeStreams || 0) < 10;

    // Build recording callback URL (PHASE 1A: Fix callback URL to voice-recording-callback)
    const recordingCallbackUrl = `${supabaseUrl}/functions/v1/voice-recording-callback`;
    const statusCallbackUrl = `${supabaseUrl}/functions/v1/voice-status-callback`;
    const dialRecordAttr = recordingEnabled ? "record-from-answer" : "do-not-record";

    // HOTLINE ASSISTANT-ONLY: never dial external numbers, always connect to AI
    if (isHotline) {
      const streamUrl = await makeStreamUrl(CallSid);
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Welcome to the TradeLine demo hotline. Connecting you to our AI receptionist now.</Say>
  <Connect action="https://${supabaseUrl.replace('https://', '')}/functions/v1/voice-answer?fallback=true&amp;hotline=true">
    <Stream url="${streamUrl}" />
  </Connect>
  <Say voice="Polly.Joanna">Thank you for calling. Goodbye.</Say>
</Response>`;
    } else if (internalCaller || !canDial) {
      // Safe path: never dial humans for internal callers or blocked targets
      const streamUrl = await makeStreamUrl(CallSid);
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Admin line active. Connecting you to the AI assistant.</Say>
  <Connect action="https://${supabaseUrl.replace('https://', '')}/functions/v1/voice-answer?fallback=true">
    <Stream url="${streamUrl}" />
  </Connect>
  <Say voice="Polly.Joanna">Goodbye.</Say>
</Response>`;
    } else if ((useLLM || pickupMode === 'immediate') && realtimeEnabled && withinConcurrencyLimit) {
      // Greeting + realtime stream with 3s watchdog fallback
      // PHASE 1A: Ensure recording doesn't loop - use record="record-from-answer" on Dial only (not on Connect/Stream)
      const streamUrl = await makeStreamUrl(CallSid);
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="https://${supabaseUrl.replace('https://', '')}/functions/v1/voice-action?recording_enabled=${recordingEnabled}" numDigits="1" timeout="1">
    <Say voice="Polly.Joanna">
      Hi, you've reached TradeLine 24/7 — Your 24/7 AI Receptionist! How can I help? Press 0 to speak with someone directly.
    </Say>
  </Gather>
  <Connect action="https://${supabaseUrl.replace('https://', '')}/functions/v1/voice-answer?fallback=true">
    <Stream url="${streamUrl}" />
  </Connect>
  <Say voice="Polly.Joanna">Connecting you to an agent now.</Say>
  <Dial callerId="${To}" record="${dialRecordAttr}" recordingStatusCallback="${recordingCallbackUrl}" statusCallback="${statusCallbackUrl}" statusCallbackEvent="initiated ringing answered completed">
    <Number>${dialTarget}</Number>
  </Dial>
</Response>`;
    } else {
      // Bridge directly to human
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">
    Hi, you've reached TradeLine 24/7 — Your 24/7 AI Receptionist! Connecting you now.
  </Say>
  <Dial callerId="${To}" record="${dialRecordAttr}" recordingStatusCallback="${recordingCallbackUrl}" statusCallback="${statusCallbackUrl}" statusCallbackEvent="initiated ringing answered completed">
    <Number>${dialTarget}</Number>
  </Dial>
</Response>`;
    }

    // PHASE 3: Add timeline marker - twiml_sent
    const { error: timelineError } = await supabase.from('call_timeline').insert({
      call_sid: CallSid,
      event: 'twiml_sent',
      timestamp: new Date().toISOString(),
      metadata: {
        mode: (useLLM || pickupMode === 'immediate') && realtimeEnabled && withinConcurrencyLimit ? 'llm' : 'bridge',
        pickup_mode: pickupMode
      }
    });
    if (timelineError) console.error('Failed to log twiml_sent timeline:', timelineError);

    // Update call log with mode
    await supabase.from('call_logs')
      .update({ 
        mode: (useLLM || pickupMode === 'immediate') && realtimeEnabled && withinConcurrencyLimit ? 'llm' : 'bridge',
        pickup_mode: pickupMode 
      })
      .eq('call_sid', CallSid);

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error handling call:', error);
    
    // Return error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, but we're experiencing technical difficulties. Please try again later.</Say>
  <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
    });
  }
});

