import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, preflight } from "../_shared/cors.ts";
import { withJSON } from "../_shared/secure_headers.ts";
import { twilioFormPOST } from "../_shared/twilio.ts";

const SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const AUTH = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const CALLBACK = Deno.env.get("TWILIO_STATUS_CALLBACK_URL")!;

if (!CALLBACK.toLowerCase().startsWith("https://")) {
  throw new Error('TWILIO_STATUS_CALLBACK_URL must be HTTPS');
}

export default async (req: Request) => {
  const pf = preflight(req);
  if (pf) return pf;

  try {
    const { phone_number_e164, friendly_name } = await req.json();
    if (!phone_number_e164) {
      return new Response(
        JSON.stringify({ error: "phone_number_e164 required" }),
        { status: 400, headers: withJSON(corsHeaders) },
      );
    }

    const form = new URLSearchParams();
    form.set("PhoneNumber", phone_number_e164);
    if (friendly_name) form.set("FriendlyName", friendly_name);
    form.set("StatusCallback", CALLBACK);

    const res = await twilioFormPOST(
      `/Accounts/${SID}/OutgoingCallerIds.json`,
      form,
      4,
      { auth: { accountSid: SID, authToken: AUTH }, headers: { "Idempotency-Key": phone_number_e164 } },
    );
    const payload = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: payload }), {
        status: res.status,
        headers: withJSON(corsHeaders),
      });
    }

    return new Response(JSON.stringify({ ok: true, data: payload }), {
      headers: withJSON(corsHeaders),
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: withJSON(corsHeaders),
    });
  }
};
