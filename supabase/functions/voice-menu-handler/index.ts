
// DTMF Menu Handler - Routes calls based on user selection
// Press 1: Sales, Press 2: Support, Press 9: Voicemail
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateTwilioRequest } from "../_shared/twilioValidator.ts";
import { TWIML_TEMPLATES, TEMPLATE_CONFIG } from "../_shared/responseTemplates.ts";

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
    const SALES_NUMBER = Deno.env.get('SALES_TARGET_E164') || Deno.env.get('BUSINESS_TARGET_E164') || '+15877428885';
    const SUPPORT_NUMBER = Deno.env.get('SUPPORT_TARGET_E164') || Deno.env.get('BUSINESS_TARGET_E164') || '+15877428885';

    // Validate Twilio signature
    const params = await validateTwilioRequest(req, url.toString());

    const CallSid = params['CallSid'];
    const Digits = params['Digits'];
    const From = params['From'];
    const To = params['To'];
    const retryCount = parseInt(url.searchParams.get('retry') || '0');

    console.log('Menu handler: CallSid=%s Digits=%s Retry=%d', CallSid, Digits, retryCount);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let twiml: string;

    // Route based on digit pressed
    if (Digits === '1') {
      // Sales
      const { error: logError } = await supabase.from('call_logs').insert({
        call_sid: CallSid,
        from_e164: From,
        to_e164: To,
        mode: 'sales',
        status: 'routing',
        consent_given: true
    });
    
    if (logError) {
      console.error('Log error:', logError);
    }

      twiml = TWIML_TEMPLATES.MENU_ROUTE_SALES(SALES_NUMBER, supabaseUrl, TEMPLATE_CONFIG.default_voice);

    } else if (Digits === '2') {
      // Support
      const { error: supportLogError } = await supabase.from('call_logs').insert({
        call_sid: CallSid,
        from_e164: From,
        to_e164: To,
        mode: 'support',
        status: 'routing',
        consent_given: true
      });
      
      if (supportLogError) {
        console.error('Log error:', supportLogError);
      }

      twiml = TWIML_TEMPLATES.MENU_ROUTE_SUPPORT(SUPPORT_NUMBER, supabaseUrl, TEMPLATE_CONFIG.default_voice);

    } else if (Digits === '9') {
      // Voicemail
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${supabaseUrl}/functions/v1/voice-voicemail?reason=user_request</Redirect>
</Response>`;

    } else if (Digits === '*') {
      // Repeat menu
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect method="POST">${supabaseUrl}/functions/v1/voice-frontdoor?skip_consent=true</Redirect>
</Response>`;

    } else {
      // Invalid input or timeout
      if (retryCount >= 1) {
        // Second failure - go to voicemail
        twiml = TWIML_TEMPLATES.MENU_TIMEOUT_VOICEMAIL(TEMPLATE_CONFIG.default_voice);
      } else {
        // First failure - retry
        twiml = TWIML_TEMPLATES.MENU_INVALID_RETRY(supabaseUrl, 1, TEMPLATE_CONFIG.default_voice);
      }
    }

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('Menu handler error:', error);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const errorTwiml = TWIML_TEMPLATES.MENU_ERROR_RESPONSE(supabaseUrl, TEMPLATE_CONFIG.default_voice);

    return new Response(errorTwiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      status: 500,
    });
  }
});
