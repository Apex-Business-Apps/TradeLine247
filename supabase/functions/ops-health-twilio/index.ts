import { corsHeaders, handleCors } from "../_shared/cors.ts";

export default async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  const sid = Boolean(Deno.env.get("TWILIO_ACCOUNT_SID"));
  const tok = Boolean(Deno.env.get("TWILIO_AUTH_TOKEN"));
  const ok = sid && tok;

  return new Response(JSON.stringify({ ok, sid, tok }), {
    status: ok ? 200 : 503,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};
