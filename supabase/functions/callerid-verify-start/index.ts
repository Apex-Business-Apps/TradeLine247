import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const AUTH = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const CALLBACK = Deno.env.get("TWILIO_STATUS_CALLBACK_URL")!;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
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
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/OutgoingCallerIds.json`, {
      method: "POST",
      headers: { Authorization: "Basic " + btoa(`${SID}:${AUTH}`), "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const payload = await res.json();
    if (!res.ok) return new Response(JSON.stringify({ error: payload }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ ok: true, data: payload }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};
