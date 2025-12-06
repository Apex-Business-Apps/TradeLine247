import { preflight, corsHeaders } from "../_shared/cors.ts";
import { secureHeaders, mergeHeaders } from "../_shared/secure_headers.ts";
import { validateTwilioSignature } from "../_shared/twilio_sig.ts";
import { ensureRequestId } from "../_shared/requestId.ts";

Deno.serve(async (req: Request) => {
  const pf = preflight(req);
  if (pf) return pf;

  const requestId = ensureRequestId(req.headers);

  if (!(await validateTwilioSignature(req.clone()))) {
    console.warn("twilio-debugger-signature-invalid", requestId);
    return new Response("forbidden", {
      status: 403,
      headers: mergeHeaders(corsHeaders, secureHeaders, {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
      }),
    });
  }

  const body = await req.text();
  console.error("TwilioDebuggerEvent", requestId, body, new Date().toISOString());

  return new Response("ok", {
    headers: mergeHeaders(corsHeaders, secureHeaders, {
      "X-Request-Id": requestId,
    }),
  });
});

