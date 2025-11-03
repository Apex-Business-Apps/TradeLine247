export async function validateTwilioSignature(req: Request): Promise<boolean> {
  const url = new URL(req.url);
  const token = Deno.env.get("TWILIO_AUTH_TOKEN")!;
  const sig = req.headers.get("X-Twilio-Signature") || req.headers.get("x-twilio-signature");
  if (!sig) return false;

  const bodyText = await req.text();
  const params = new URLSearchParams(bodyText);
  const sorted = [...params.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  let data = url.origin + url.pathname;
  for (const [key, value] of sorted) {
    data += key + value;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(token),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const computed = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return computed === sig;
}
