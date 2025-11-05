import { mergeHeaders, secureHeaders } from "./secure_headers.ts";

const ALLOW_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-csrf-token",
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
    status: 200,
    headers: corsHeaders,
  });
}

export function withCors(
  ...sets: Array<Record<string, string> | undefined>
): Record<string, string> {
  return mergeHeaders(corsHeaders, ...sets);
}

export function jsonResponse(
  data: unknown,
  init?: ResponseInit & {
    headers?: Record<string, string>;
    includeSecureHeaders?: boolean;
  },
): Response {
  const { headers, includeSecureHeaders = true, ...rest } = init ?? {};
  const secureSet = includeSecureHeaders !== false ? secureHeaders : undefined;
  return new Response(JSON.stringify(data), {
    ...rest,
    headers: withCors(secureSet, headers, { "Content-Type": "application/json" }),
  });
}

export function unexpectedErrorResponse(
  error: unknown,
  context: string,
  options?: {
    status?: number;
    headers?: Record<string, string>;
    includeSecureHeaders?: boolean;
  },
): Response {
  const correlationId = crypto.randomUUID();
  console.error(`[${context}] unexpected error`, {
    correlationId,
    error,
  });

  return jsonResponse(
    { error: "Unexpected error", correlationId },
    {
      status: options?.status ?? 500,
      headers: options?.headers,
      includeSecureHeaders: options?.includeSecureHeaders,
    },
  );
}
