import { corsHeaders, preflight } from "../_shared/cors.ts";
import { withJSON } from "../_shared/secure_headers.ts";

function assertHttps(label: string, value?: string) {
  if (!value) return;
  if (!value.toLowerCase().startsWith("https://")) {
    throw new Error(`${label} must be HTTPS`);
  }
}

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  try {
    const { phoneNumber, voiceUrl, voiceStatusCallback, smsUrl } = await req.json();
    if (!phoneNumber || !voiceUrl) {
      return new Response(JSON.stringify({ error: "phoneNumber and voiceUrl are required" }), {
        status: 400,
        headers: withJSON(corsHeaders),
      });
    }

    assertHttps("voiceUrl", voiceUrl);
    assertHttps("voiceStatusCallback", voiceStatusCallback);
    assertHttps("smsUrl", smsUrl);

    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      throw new Error('Missing Twilio credentials');
    }

    const authHeader = 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const listResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(phoneNumber)}`,
      { headers: { Authorization: authHeader } },
    );

    if (!listResponse.ok) {
      return new Response(JSON.stringify({ error: `Lookup failed: ${listResponse.status}` }), {
        status: listResponse.status,
        headers: withJSON(corsHeaders),
      });
    }

    const listData = await listResponse.json();
    const phoneSid = listData.incoming_phone_numbers?.[0]?.sid;
    if (!phoneSid) {
      return new Response(JSON.stringify({ error: 'Phone number not found' }), {
        status: 404,
        headers: withJSON(corsHeaders),
      });
    }

    const updateResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers/${phoneSid}.json`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          VoiceUrl: voiceUrl,
          VoiceStatusCallback: voiceStatusCallback ?? '',
          SmsUrl: smsUrl ?? '',
        }),
      },
    );

    if (!updateResponse.ok) {
      const text = await updateResponse.text();
      return new Response(JSON.stringify({ error: text || 'Failed to update webhooks' }), {
        status: updateResponse.status,
        headers: withJSON(corsHeaders),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: withJSON(corsHeaders),
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message ?? String(error) }), {
      status: 500,
      headers: withJSON(corsHeaders),
    });
  }
});
