import { serve } from "std/http/server.ts";
import { createClient } from "supabase";
import { createHmac } from "std/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate Twilio signature
function validateTwilioSignature(authToken: string, signature: string, url: string, params: Record<string, string>): boolean {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  
  const hmac = createHmac('sha1', authToken);
  hmac.update(data);
  const expectedSignature = hmac.digest('base64');
  
  return signature === expectedSignature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    
    // Validate Twilio signature
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioSignature = req.headers.get('X-Twilio-Signature');
    
    if (!twilioAuthToken || !twilioSignature) {
      console.error('Missing Twilio auth token or signature');
      return new Response('Unauthorized', { status: 401 });
    }
    
    const url = new URL(req.url).toString();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value as string;
    }
    
    if (!validateTwilioSignature(twilioAuthToken, twilioSignature, url, params)) {
      console.error('Invalid Twilio signature');
      return new Response('Unauthorized', { status: 401 });
    }
    const messageSid = formData.get('MessageSid') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store SMS message
    await supabaseClient.from('sms_messages').insert({
      message_sid: messageSid,
      from_number: from,
      to_number: to,
      body,
      direction: 'inbound',
      status: 'received',
    });

    // Auto-reply (optional)
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thank you for contacting us. We'll respond shortly.</Message>
</Response>`;

    return new Response(twiml, {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('SMS webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});