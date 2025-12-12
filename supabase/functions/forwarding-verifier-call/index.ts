 
// Removed unnecessary edge-runtime import that caused OpenAI dependency conflict
export default async () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>TradeLine automated forwarding test. You can hang up now.</Say>
  <Pause length="2"/>
</Response>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml" } });
};
