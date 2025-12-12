 
import { preflight, corsHeaders } from "../_shared/cors.ts";
import { secureHeaders, mergeHeaders } from "../_shared/secure_headers.ts";
import { validateTwilioSignature } from "../_shared/twilio_sig.ts";
import { ensureRequestId } from "../_shared/requestId.ts";

const FEATURE_RCS_ENABLED = Deno.env.get("FEATURE_RCS") === "1";

function json(headers: HeadersInit, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: mergeHeaders(corsHeaders, secureHeaders, {
      "Content-Type": "application/json",
      ...Object.fromEntries(new Headers(headers)),
    }),
  });
}

Deno.serve(async (req: Request) => {
  const pf = preflight(req);
  if (pf) return pf;

  const requestId = ensureRequestId(req.headers);

  if (!FEATURE_RCS_ENABLED) {
    return json(
      new Headers({ "X-Request-Id": requestId }),
      501,
      {
        message: "RCS inbound handling disabled",
        requestId,
      },
    );
  }

  if (req.method !== "POST") {
    return json(
      new Headers({ "X-Request-Id": requestId }),
      405,
      { message: "Method Not Allowed", requestId },
    );
  }

  if (!(await validateTwilioSignature(req.clone()))) {
    return json(
      new Headers({ "X-Request-Id": requestId }),
      403,
      { message: "Invalid Twilio signature", requestId },
    );
  }

  const text = await req.text();
  const params = new URLSearchParams(text);
  const payload = Object.fromEntries(params.entries());

  console.log("rcs-inbound", requestId, payload);

  return json(
    new Headers({ "X-Request-Id": requestId }),
    200,
    {
      status: "ok",
      receivedAt: new Date().toISOString(),
      requestId,
    },
  );
});
