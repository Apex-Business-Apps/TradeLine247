const ALLOW_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-request-id",
  "x-twilio-signature",
].join(", ");

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": ALLOW_HEADERS,
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

export function preflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;

  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      "Content-Length": "0",
    },
  });
}
