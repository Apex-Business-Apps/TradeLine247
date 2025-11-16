// Twilio API client with automatic retry on 429/5xx
// Handles rate limits gracefully with exponential backoff

function getAuthz(): string {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const auth = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!sid || !auth) {
    throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be configured");
  }
  return "Basic " + btoa(`${sid}:${auth}`);
}

const DEFAULT_MAX_TRIES = 4;

export class TwilioResponseError extends Error {
  constructor(public readonly response: Response, message?: string) {
    super(message ?? `Twilio API error ${response.status}`);
    this.name = "TwilioResponseError";
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoff(attempt: number): number {
  const base = 250 * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 150);
  return Math.min(base + jitter, 5000);
}

export async function twilioFormPOST(
  path: string,
  form: URLSearchParams,
  tries = DEFAULT_MAX_TRIES,
  init?: RequestInit,
): Promise<Response> {
  let attempt = 0;
  while (attempt <= tries) {
    const res = await fetch(`https://api.twilio.com/2010-04-01${path}`, {
      method: "POST",
      headers: {
        Authorization: getAuthz(),
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "tradeline247-queue-worker/2025-11-03",
      },
      body: form,
      ...init,
    });

    if (res.status === 429 || res.status >= 500) {
      if (attempt === tries) {
        throw new TwilioResponseError(res, `Twilio throttled after ${attempt + 1} attempts`);
      }
      await sleep(computeBackoff(attempt));
      attempt += 1;
      continue;
    }

    if (!res.ok) {
      throw new TwilioResponseError(res);
    }

    return res;
  }

  throw new Error("Unexpected retry loop termination");
}

