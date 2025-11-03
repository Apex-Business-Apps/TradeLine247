// Twilio API client with automatic retry on 429/5xx
// Handles rate limits gracefully with exponential backoff

const SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const AUTH = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const AUTHZ = "Basic " + btoa(`${SID}:${AUTH}`);

export async function twilioFormPOST(
  path: string,
  form: URLSearchParams,
  tries = 4
): Promise<Response> {
  let wait = 300;
  for (let i = 0; i <= tries; i++) {
    const res = await fetch(`https://api.twilio.com/2010-04-01${path}`, {
      method: "POST",
      headers: {
        Authorization: AUTHZ,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    });
    if (res.status === 429 || res.status >= 500) {
      if (i === tries) return res;
      await new Promise((r) =>
        setTimeout(r, wait + Math.floor(Math.random() * 150))
      );
      wait = Math.min(wait * 2, 5000);
      continue;
    }
    return res;
  }
  throw new Error("unreachable");
}

