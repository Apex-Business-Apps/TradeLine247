import { validateTwilioSignature as validateSignatureCore } from "./twilioValidator.ts";

export async function validateTwilioSignature(req: Request) {
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!token) return false;

  const signature = req.headers.get("X-Twilio-Signature") ?? req.headers.get("x-twilio-signature");
  if (!signature) return false;

  const cloned = req.clone();
  const text = await cloned.text();
  const params = new URLSearchParams(text);
  const payload: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    payload[key] = value;
  }

  const url = new URL(req.url);
  return await validateSignatureCore(url.toString(), payload, signature, token);
}
