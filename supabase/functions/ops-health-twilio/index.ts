/* eslint-disable @typescript-eslint/no-explicit-any */
import { corsHeaders, preflight } from "../_shared/cors.ts";
import { withJSON } from "../_shared/secure_headers.ts";

export default async (req: Request) => {
  const pf = preflight(req);
  if (pf) return pf;

  const sid = Boolean(Deno.env.get("TWILIO_ACCOUNT_SID"));
  const tok = Boolean(Deno.env.get("TWILIO_AUTH_TOKEN"));
  const ok = sid && tok;

  return new Response(JSON.stringify({ ok, sid, tok }), {
    status: ok ? 200 : 503,
    headers: withJSON(corsHeaders),
  });
};
