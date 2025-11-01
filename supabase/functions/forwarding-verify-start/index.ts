// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const FROM_E164 = Deno.env.get("TWILIO_VOICE_NUMBER_E164")!;
const FUNCTIONS_BASE = Deno.env.get("FUNCTIONS_BASE")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SRV = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const auth = "Basic " + btoa(`${TWILIO_SID}:${TWILIO_AUTH}`);
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { org_id, old_number_e164 } = await req.json();
    if (!org_id || !old_number_e164) {
      return new Response(
        JSON.stringify({ error: "org_id and old_number_e164 required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const up = await fetch(`${SUPABASE_URL}/rest/v1/forwarding_checks`, {
      method: "POST",
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${SRV}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        org_id,
        old_number_e164,
        twilio_number_e164: FROM_E164,
        status: "pending",
        notes: "auto-verify-started",
      }),
    });
    if (!up.ok) {
      const fail = await up.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: fail }), { status: up.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const [row] = await up.json();

    const form = new URLSearchParams({
      From: FROM_E164,
      To: old_number_e164,
      Url: `${FUNCTIONS_BASE}/forwarding-verifier-call`,
      Method: "POST",
      Timeout: "15",
    });
    const call = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Calls.json`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const payload = await call.json();
    if (!call.ok) {
      await fetch(`${SUPABASE_URL}/rest/v1/forwarding_checks?id=eq.${row.id}`, {
        method: "PATCH",
        headers: { apikey: ANON, Authorization: `Bearer ${SRV}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "failed", notes: `twilio call error: ${payload?.message ?? "unknown"}` }),
      });
      return new Response(JSON.stringify({ error: payload }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(
      JSON.stringify({ check_id: row.id, call_sid: payload.sid, status: "pending" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
};
