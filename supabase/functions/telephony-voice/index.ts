// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SRV = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function markVerified(toE164: string) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/forwarding_checks`);
  url.searchParams.set("twilio_number_e164", `eq.${toE164}`);
  url.searchParams.set("status", "eq.pending");
  url.searchParams.set("order", "created_at.desc");
  url.searchParams.set("limit", "1");
  const r = await fetch(url, { headers: { apikey: ANON, Authorization: `Bearer ${SRV}` } });
  const rows = (await r.json()) as any[];
  const row = rows?.[0];
  if (!row) return;
  await fetch(`${SUPABASE_URL}/rest/v1/forwarding_checks?id=eq.${row.id}`, {
    method: "PATCH",
    headers: { apikey: ANON, Authorization: `Bearer ${SRV}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "verified",
      verified_at: new Date().toISOString(),
      notes: "inbound detected",
    }),
  });
}

export default async (req: Request) => {
  const body = await req.text();
  const p = new URLSearchParams(body);
  const to = p.get("To") || "";
  markVerified(to).catch(() => null);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Welcome to TradeLine. Your forwarding is active.</Say>
</Response>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml" } });
};
