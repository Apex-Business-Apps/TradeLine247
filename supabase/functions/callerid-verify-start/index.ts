// Removed unnecessary edge-runtime import that caused OpenAI dependency conflict
import { corsHeaders, preflight } from "../_shared/cors.ts";
import { withJSON } from "../_shared/secure_headers.ts";
import { twilioFormPOST } from "../_shared/twilio.ts";

// Env lookups moved inside handler to avoid import-time errors during local builds

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

    const SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const CALLBACK = Deno.env.get("TWILIO_STATUS_CALLBACK_URL");
    if (!SID || !CALLBACK) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: withJSON(corsHeaders),
      });
    }
    if (!CALLBACK.toLowerCase().startsWith("https://")) {
      return new Response(JSON.stringify({ error: "TWILIO_STATUS_CALLBACK_URL must be HTTPS" }), {
        status: 500,
        headers: withJSON(corsHeaders),
      });
    }

    const form = new URLSearchParams();
    form.set("PhoneNumber", phone_number_e164);
    if (friendly_name) form.set("FriendlyName", friendly_name);
    form.set("StatusCallback", CALLBACK);

    const res = await twilioFormPOST(
      `/Accounts/${SID}/OutgoingCallerIds.json`,
      form,
      4,
      { headers: { "Idempotency-Key": phone_number_e164 } },
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
