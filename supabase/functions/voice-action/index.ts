 
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
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const FORWARD_TARGET_E164 = Deno.env.get('BUSINESS_TARGET_E164');

    if (!FORWARD_TARGET_E164) {
      console.error('Missing BUSINESS_TARGET_E164 environment variable');
      throw new Error('Configuration error: Missing fallback number');
    }

    // SECURITY: Validate Twilio signature to prevent webhook spoofing
    const params = await validateTwilioRequest(req, url.toString());

    const CallSid = params['CallSid'];
    const Digits = params['Digits'];
    const To = params['To'];

    console.log('DTMF action received (signature validated):', { CallSid, Digits });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let twiml: string;

    if (Digits === '0') {
      // User pressed 0 - bridge to human
      console.log('DTMF-0 detected: Bridging to human at', FORWARD_TARGET_E164);
      
      await supabase
        .from('call_logs')
        .update({ 
          handoff: true,
          handoff_reason: 'dtmf_0_user_request',
          mode: 'bridge'
        })
        .eq('call_sid', CallSid);

      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Connecting you now.</Say>
  <Dial callerId="${To}" record="record-from-answer" recordingStatusCallback="https://${supabaseUrl.replace('https://', '')}/functions/v1/voice-status">
    <Number>${FORWARD_TARGET_E164}</Number>
  </Dial>
</Response>`;
    } else {
      // Continue with LLM stream
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://${supabaseUrl.replace('https://', '')}/functions/v1/voice-stream?callSid=${CallSid}" />
  </Connect>
</Response>`;
    }

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error handling DTMF action:', error);
    
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

