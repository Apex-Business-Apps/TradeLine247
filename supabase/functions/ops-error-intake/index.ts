import { corsHeaders, handleCors } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export default async (req: Request) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    const { org_id, error_id, error_type, payload, user_agent } = await req.json();

    const response = await fetch(`${SUPABASE_URL}/rest/v1/error_reports`, {
      method: "POST",
      headers: {
        apikey: ANON,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ org_id, error_id, error_type, payload, user_agent }),
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(text, {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};
