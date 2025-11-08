import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve((_req) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thanks for texting. Your AI receptionist is live.</Message></Response>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
});
