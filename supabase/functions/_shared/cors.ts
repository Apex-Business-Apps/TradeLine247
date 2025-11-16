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

export function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

export function unexpectedErrorResponse(error: unknown): Response {
  console.error("Unexpected error:", error);
  return jsonResponse(
    { error: error instanceof Error ? error.message : "Unexpected error" },
    500
  );
}

export function withCors(headers: Record<string, string>): Record<string, string> {
  return {
    ...corsHeaders,
    ...headers,
  };
}
