const ALLOW_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-request-id",
  "x-twilio-signature",
].join(", ");

/**
 * Check if running in production Deno deployment
 */
function isProduction(): boolean {
  try {
    // Deno runtime check - only available in edge functions
    return typeof Deno !== "undefined" && !!Deno.env.get("DENO_DEPLOYMENT_ID");
  } catch {
    // Node.js environment (tests) - treat as development
    return false;
  }
}

/**
 * Allowed origins for CORS - production domains only
 * SECURITY: Do not use "*" - allows CSRF attacks from any website
 */
const ALLOWED_ORIGINS = [
  "https://tradeline247.com",
  "https://www.tradeline247.com",
  "https://app.tradeline247.com",
  // Supabase studio for development
  "https://supabase.com",
  // Localhost for development (removed in production via env check)
  ...(isProduction() ? [] : [
    "http://localhost:8080",
    "http://localhost:4176",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:4176",
  ]),
];

/**
 * Validate and return appropriate CORS origin
 */
function getValidOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) return ALLOWED_ORIGINS[0]; // Default to main domain

  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Check for preview/staging deployments (lovable.app, vercel, netlify)
  const previewPatterns = [
    /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
    /^https:\/\/[a-z0-9-]+--tradeline247\.netlify\.app$/,
    /^https:\/\/tradeline247-[a-z0-9]+\.vercel\.app$/,
  ];

  if (previewPatterns.some(pattern => pattern.test(requestOrigin))) {
    return requestOrigin;
  }

  // Reject unknown origins - return primary domain
  console.warn(`[CORS] Rejected unknown origin: ${requestOrigin}`);
  return ALLOWED_ORIGINS[0];
}

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0], // Default, override per-request
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": ALLOW_HEADERS,
  "Access-Control-Max-Age": "86400",
  "Access-Control-Allow-Credentials": "true",
  Vary: "Origin",
};

/**
 * Get CORS headers for a specific request origin
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const validOrigin = getValidOrigin(origin);

  return {
    ...corsHeaders,
    "Access-Control-Allow-Origin": validOrigin,
  };
}

export function preflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;

  return new Response(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(req),
      "Content-Length": "0",
    },
  });
}

export function jsonResponse(data: unknown, status = 200, req?: Request): Response {
  const headers = req ? getCorsHeaders(req) : corsHeaders;
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  });
}

export function unexpectedErrorResponse(error: unknown, req?: Request): Response {
  console.error("Unexpected error:", error);
  return jsonResponse(
    { error: error instanceof Error ? error.message : "Unexpected error" },
    500,
    req
  );
}

export function withCors(headers: Record<string, string>, req?: Request): Record<string, string> {
  const baseHeaders = req ? getCorsHeaders(req) : corsHeaders;
  return {
    ...baseHeaders,
    ...headers,
  };
}

export function mergeHeaders(...headerSets: Record<string, string>[]): Record<string, string> {
  return Object.assign({}, ...headerSets);
}

export function handleCors(req: Request): Response | null {
  return preflight(req);
}
