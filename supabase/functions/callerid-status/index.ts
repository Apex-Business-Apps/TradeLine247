// Removed unnecessary edge-runtime import that caused OpenAI dependency conflict
export default async (req: Request) => {
  const body = await req.text();
  const p = new URLSearchParams(body);
  console.log("CallerID status:", p.get("VerificationStatus"), p.get("To"), new Date().toISOString());
  return new Response("ok");
};
