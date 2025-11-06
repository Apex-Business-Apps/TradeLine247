import "jsr:@supabase/functions-js/edge-runtime.d.ts";
export default async (req: Request) => {
  const body = await req.text();
  const p = new URLSearchParams(body);
  console.log("CallerID status:", p.get("VerificationStatus"), p.get("To"), new Date().toISOString());
  return new Response("ok");
};
