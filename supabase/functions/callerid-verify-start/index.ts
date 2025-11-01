import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { twilioFormPOST } from "../_shared/twilio.ts";

const SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const AUTH = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const CALLBACK = Deno.env.get("TWILIO_STATUS_CALLBACK_URL")!;

export default async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const { phone_number_e164, friendly_name } = await req.json();
    if (!phone_number_e164) {
      return new Response(
        JSON.stringify({ error: "phone_number_e164 required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, data: payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};
