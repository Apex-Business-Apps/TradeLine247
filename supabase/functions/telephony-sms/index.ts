/* eslint-disable @typescript-eslint/no-explicit-any */

Deno.serve((_req) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thanks for texting. Your AI receptionist is live.</Message></Response>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
});
