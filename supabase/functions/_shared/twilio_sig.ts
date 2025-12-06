const encoder = new TextEncoder();

function getTwilioToken(): string | null {
  return Deno.env.get("TWILIO_AUTH_TOKEN") ?? null;
}

async function signWithToken(token: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(token),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;

  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

export async function validateTwilioSignature(req: Request): Promise<boolean> {
  const token = getTwilioToken();
  if (!token) return false;

  const sig = req.headers.get("X-Twilio-Signature") || req.headers.get("x-twilio-signature");
  if (!sig) return false;

  const url = new URL(req.url);
  let data = url.origin + url.pathname;
  if (url.search) {
    data += url.search;
  }

  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const bodyText = await req.text();
      const params = new URLSearchParams(bodyText);
      const sorted = [...params.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      for (const [key, value] of sorted) {
        data += key + value;
      }
    }
  }

  const computed = await signWithToken(token, data);
  return timingSafeEqual(computed, sig);
}
