 
// deno-lint-ignore-file no-explicit-any
import { corsHeaders, preflight } from "../_shared/cors.ts";
import { mergeHeaders, secureHeaders, withJSON } from "../_shared/secure_headers.ts";
import { okHeaders, twilioFormPOST } from "../_shared/twilio.ts";

const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;

export default async (req: Request) => {
  const pf = preflight(req);
  if (pf) return pf;

  const { phone_sid, voice_url, voice_method = "POST" } = await req.json();
  if (!phone_sid || !voice_url) {
    return new Response(JSON.stringify({ error: "phone_sid and voice_url required" }), {
      status: 400,
      headers: withJSON(corsHeaders),
    });
  }

  if (!voice_url.toLowerCase().startsWith("https://")) {
    return new Response(JSON.stringify({ error: "voice_url must be HTTPS" }), {
      status: 400,
      headers: withJSON(corsHeaders),
    });
  }

  const form = new URLSearchParams({ VoiceUrl: voice_url, VoiceMethod: voice_method });
  const res = await twilioFormPOST(
    `/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers/${phone_sid}.json`,
    form,
    4,
    { auth: { accountSid: ACCOUNT_SID, authToken: AUTH_TOKEN } },
  );

  const payload = await res.text();
  const headers = res.ok
    ? mergeHeaders(okHeaders, secureHeaders)
    : mergeHeaders(corsHeaders, secureHeaders, { "Content-Type": "text/plain" });

  return new Response(payload, { status: res.status, headers });
};
