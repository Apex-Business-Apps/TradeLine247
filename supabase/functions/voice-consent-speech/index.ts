 
import { validateTwilioRequest } from "../_shared/twilioValidator.ts";
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
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Validate Twilio signature and get params
    const params = await validateTwilioRequest(req, url.toString());
    
    const callSid = params.CallSid || 'unknown';
    const speechResult = params.SpeechResult?.toLowerCase() || '';
    const confidence = parseFloat(params.Confidence || '0');
    
    console.log('Consent speech: CallSid=%s Speech="%s" Confidence=%s', 
      callSid, speechResult, confidence);
    
    // Strict opt-in: only explicit opt-in enables recording
    const optInPhrases = ['consent', 'record', 'yes record', 'you can record', 'i agree to recording'];
    const userOptedIn = optInPhrases.some(phrase => speechResult.includes(phrase));
    const recordParam = userOptedIn ? 'true' : 'false';
    
    console.log('Consent decision: CallSid=%s OptIn=%s Record=%s', 
      callSid, userOptedIn, recordParam);
    
    // Persist consent decision
    await supabase
      .from('call_logs')
      .upsert({
        call_sid: callSid,
        consent_recording: userOptedIn,
        recording_mode: userOptedIn ? 'full' : 'no_record',
        status: 'in-progress'
      }, { onConflict: 'call_sid' });

    // Redirect to routing logic
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${supabaseUrl}/functions/v1/voice-route?record=${recordParam}&amp;callSid=${callSid}</Redirect>
</Response>`;

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Consent speech error:', error);

    // COMPLIANCE: On error, default to NO recording (fail-safe)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${supabaseUrl}/functions/v1/voice-route?record=false</Redirect>
</Response>`;

    return new Response(errorTwiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      status: 500,
    });
  }
});

