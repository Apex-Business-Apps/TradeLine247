// deno-lint-ignore-file no-explicit-any
import { handleCors } from "../_shared/cors.ts";
import { okHeaders, twilioFormPOST } from "../_shared/twilio.ts";

const ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;

export default async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const { phone_sid, voice_url, voice_method = "POST" } = await req.json();

  const form = new URLSearchParams({ VoiceUrl: voice_url, VoiceMethod: voice_method });
  const res = await twilioFormPOST(
    `/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers/${phone_sid}.json`,
    form,
    4,
    { auth: { accountSid: ACCOUNT_SID, authToken: AUTH_TOKEN } },
  );

  const payload = await res.text();
  return new Response(payload, { status: res.status, headers: okHeaders });
};
