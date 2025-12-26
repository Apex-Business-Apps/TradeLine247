
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateTwilioRequest } from "../_shared/twilioValidator.ts";
import { TWIML_TEMPLATES, TEMPLATE_CONFIG } from "../_shared/responseTemplates.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting (Edge-compatible)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  record.count++;
  return true;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    
    // Validate Twilio signature and get params
    const params = await validateTwilioRequest(req, url.toString());
    
    const from = params.From || 'unknown';
    const callSid = params.CallSid || 'unknown';
    
    // Rate limiting by caller number and IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    
    if (!checkRateLimit(from) || !checkRateLimit(clientIp)) {
      console.warn(`Rate limit exceeded: From=${from}, IP=${clientIp}`);

      const twiml = TWIML_TEMPLATES.FRONTDOOR_RATE_LIMIT_RESPONSE(TEMPLATE_CONFIG.default_voice);

      return new Response(twiml, {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
        status: 429,
      });
    }
    
    console.log('Front door: CallSid=%s From=%s', callSid, from);

    const skipConsent = url.searchParams.get('skip_consent') === 'true';

    // Get business name from voice config (with fallback)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: config } = await supabase.from('voice_config').select('business_name').single();
    const businessName = config?.business_name || TEMPLATE_CONFIG.default_business_name;

    let twiml: string;

    if (skipConsent) {
      // Skip to menu directly (for menu repeat)
      twiml = TWIML_TEMPLATES.FRONTDOOR_MENU_ONLY(supabaseUrl, TEMPLATE_CONFIG.default_voice);
    } else {
      // Canadian consent disclosure + menu with configurable business name
      twiml = TWIML_TEMPLATES.FRONTDOOR_CONSENT_MENU(businessName, supabaseUrl, TEMPLATE_CONFIG.default_voice);
    }

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Front door error:', error);

    // Generic error TwiML
    const errorTwiml = TWIML_TEMPLATES.ERROR_RESPONSE(TEMPLATE_CONFIG.default_voice);

    return new Response(errorTwiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      status: 500,
    });
  }
});

