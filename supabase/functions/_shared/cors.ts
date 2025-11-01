// Production-safe CORS configuration
const ALLOWED_ORIGINS = [
  'https://tradeline247ai.com',
  'https://www.tradeline247ai.com',
  'https://api.tradeline247ai.com',
  'http://localhost:5173', // Development
  'http://localhost:4173', // Preview
  'capacitor://localhost', // Capacitor iOS
  'http://localhost', // Capacitor Android
];

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "authorization,content-type,apikey,x-client-info",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Backward compatibility: Export with wildcard for OPTIONS (less critical)
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,content-type,apikey,x-client-info",
};

export function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    // Use restricted CORS even for OPTIONS
    const origin = req.headers.get('origin');
    return new Response("ok", { headers: getCorsHeaders(origin) });
  }
  return null;
}
