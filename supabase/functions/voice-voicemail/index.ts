// Voicemail Handler - Records messages and notifies staff
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateTwilioRequest } from "../_shared/twilioValidator.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const reason = url.searchParams.get('reason') || 'unknown';

    // Validate Twilio signature
    const params = await validateTwilioRequest(req, url.toString());

    const CallSid = params['CallSid'];
    const From = params['From'];
    const To = params['To'];
    const RecordingUrl = params['RecordingUrl'];
    const RecordingDuration = params['RecordingDuration'];
    const TranscriptionText = params['TranscriptionText'];

    console.log('Voicemail: CallSid=%s From=%s Reason=%s', CallSid, From, reason);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If this is a recording callback, save it
    if (RecordingUrl) {
      await supabase.from('call_logs').update({
        recording_url: RecordingUrl,
        duration_sec: parseInt(RecordingDuration || '0'),
        transcript: TranscriptionText,
        status: 'voicemail_received'
      }).eq('call_sid', CallSid);

      await supabase.from('analytics_events').insert({
        event_type: 'voicemail_received',
        event_data: {
          call_sid: CallSid,
          from: From,
          duration: RecordingDuration,
          reason: reason
        },
        severity: 'info'
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Otherwise, prompt for voicemail
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Please leave a message after the tone. Press pound when finished.</Say>
  <Record action="${supabaseUrl}/functions/v1/voice-voicemail"
          maxLength="180"
          finishOnKey="#"
          transcribe="true"
          transcribeCallback="${supabaseUrl}/functions/v1/voice-voicemail"/>
  <Say voice="Polly.Joanna">Thank you. Your message has been recorded. Goodbye.</Say>
  <Hangup/>
</Response>`;

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('Voicemail error:', error);

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, but we couldn't record your message. Please call back later.</Say>
  <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      status: 500,
    });
  }
});
