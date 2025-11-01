export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function preflight(req: Request): Response | null {
  return req.method === "OPTIONS"
    ? new Response("ok", { headers: corsHeaders })
    : null;
}
