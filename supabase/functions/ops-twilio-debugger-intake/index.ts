import { preflight, corsHeaders } from "../_shared/cors.ts";
import { withJSON } from "../_shared/secure_headers.ts";

export default async (req: Request) => {
  const pf = preflight(req);
  if (pf) return pf;

  const body = await req.text();
  console.error("TwilioDebuggerEvent", body, new Date().toISOString());

  return new Response(JSON.stringify({ ok: true }), {
    headers: withJSON(corsHeaders),
  });
};
