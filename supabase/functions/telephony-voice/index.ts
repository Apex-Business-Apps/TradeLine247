// Minimal TwiML for inbound calls (works Day 1; replace later with full IVR/receptionist)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve((_req) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Thanks for calling. Your AI receptionist is live.</Say></Response>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
});
