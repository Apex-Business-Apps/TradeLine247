 
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
    const publicApiBase = Deno.env.get('PUBLIC_API_BASE_URL');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate Twilio signature
    const url = new URL(req.url);
    const paramsValidated = await validateTwilioRequest(req, url.toString());

    const formData = await req.formData();
    const params: Record<string, string> = { ...paramsValidated };
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    const CallSid = params['CallSid'];
    const Digits = params['Digits'] || '';
    const From = params['From'] || '';
    const To = params['To'] || '';

    console.log('Consent response:', { CallSid, Digits });

    // Strict opt-in: only "1" = consent; silence/other => no record
    const consentGiven = Digits === '1';
    const recordingMode = consentGiven ? 'full' : 'no_record';

    // Persist consent decision (idempotent update; insert if missing)
    await supabase.from('call_logs')
      .upsert({
        call_sid: CallSid,
        from_e164: From || null,
        to_e164: To || null,
        consent_recording: consentGiven,
        recording_mode: recordingMode,
        status: 'in-progress'
      }, { onConflict: 'call_sid' });

    const baseUrl = publicApiBase || `${url.protocol}//${url.host}`;
    const redirectTarget = `${baseUrl}/functions/v1/voice-answer?recording_enabled=${consentGiven ? 'true' : 'false'}&callSid=${CallSid}`;

    let twiml: string;

    // Redirect back to main answer flow with explicit recording flag
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${redirectTarget}</Redirect>
</Response>`;

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error handling consent:', error);
    
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're sorry, but we're experiencing technical difficulties.</Say>
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
