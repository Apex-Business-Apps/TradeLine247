import { validateTwilioRequest } from "../_shared/twilioValidator.ts";
import { buildInternalNumberSet, isInternalCaller } from "../_shared/antiLoop.ts";

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

    // Validate Twilio signature
    const url = new URL(req.url);
    const params = await validateTwilioRequest(req, url.toString());

    const from = params['From'] || 'unknown';
    const to = params['To'] || 'unknown';

    const internalNumbers = buildInternalNumberSet(Deno.env as Record<string, string | undefined>);
    const internalCaller = isInternalCaller(from, internalNumbers);

    let twiml: string;

    if (internalCaller) {
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Admin call detected. No forwarding. Goodbye.</Say>
  <Hangup/>
</Response>`;
    } else {
      const recordAction = `${supabaseUrl}/functions/v1/voice-fallback-end`;
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We could not connect your call. Please leave a message after the beep.</Say>
  <Record action="${recordAction}" method="POST" maxLength="120" playBeep="true" />
  <Say voice="Polly.Joanna">Thank you. Goodbye.</Say>
  <Hangup/>
</Response>`;
    }

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Fallback error:', error);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We are unable to process your call at this time.</Say>
  <Hangup/>
</Response>`;

    return new Response(errorTwiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      status: 500,
    });
  }
});

