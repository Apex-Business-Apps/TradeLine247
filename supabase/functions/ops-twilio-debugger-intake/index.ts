import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, corsHeaders } from "../_shared/cors.ts";
import { secureHeaders, mergeHeaders } from "../_shared/secure_headers.ts";

serve(async (req: Request) => {
  const pf = preflight(req);
  if (pf) return pf;

  const body = await req.text(); // Twilio posts application/x-www-form-urlencoded
  console.error("TwilioDebuggerEvent", body, new Date().toISOString());

  return new Response("ok", {
    headers: mergeHeaders(corsHeaders, secureHeaders),
  });
});

