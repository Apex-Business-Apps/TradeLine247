// supabase/functions/_shared/stream_token.ts
// HMAC-based short-lived token for voice stream authentication
// Allows Twilio WebSocket connections without requiring Authorization headers

const encoder = new TextEncoder();

export function nowMs(): number {
  return Date.now();
}

/**
 * Sign a payload using HMAC-SHA256
 */
export async function signStreamPayload(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  return sig;
}

/**
 * Create a short-lived stream token for Twilio WebSocket authentication
 * @param secret - HMAC secret key
 * @param callSid - Twilio call SID to bind token to
 * @param ttlMs - Token time-to-live in milliseconds (default 3 minutes)
 * @returns URL-safe encoded token
 */
export async function createStreamToken(
  secret: string,
  callSid: string,
  ttlMs = 3 * 60 * 1000
): Promise<string> {
  const expiresAt = nowMs() + ttlMs;
  const payload = `${callSid}|${expiresAt}`;
  const sig = await signStreamPayload(secret, payload);
  // Encode payload+sig as single token (URI-safe)
  const token = encodeURIComponent(`${payload}|${sig}`);
  return token;
}

/**
 * Verify a stream token
 * @param secret - HMAC secret key
 * @param token - Token to verify
 * @returns Verification result with callSid if valid
 */
export async function verifyStreamToken(
  secret: string,
  token: string
): Promise<{ ok: true; callSid: string } | { ok: false; reason: string }> {
  try {
    const decoded = decodeURIComponent(token);
    const parts = decoded.split("|");

    if (parts.length < 3) {
      return { ok: false, reason: "invalid_format" };
    }

    const callSid = parts[0];
    const expiresAt = Number(parts[1]);
    const sig = parts.slice(2).join("|"); // Handle signatures with | characters

    if (!callSid || callSid.length === 0) {
      return { ok: false, reason: "missing_call_sid" };
    }

    if (Number.isNaN(expiresAt)) {
      return { ok: false, reason: "invalid_expiry" };
    }

    if (Date.now() > expiresAt) {
      return { ok: false, reason: "expired" };
    }

    const payload = `${callSid}|${expiresAt}`;
    const expectedSig = await signStreamPayload(secret, payload);

    // Constant-time compare (basic implementation)
    if (expectedSig.length !== sig.length) {
      return { ok: false, reason: "bad_signature" };
    }

    let mismatch = 0;
    for (let i = 0; i < expectedSig.length; i++) {
      mismatch |= expectedSig.charCodeAt(i) ^ sig.charCodeAt(i);
    }

    if (mismatch !== 0) {
      return { ok: false, reason: "bad_signature" };
    }

    return { ok: true, callSid };
  } catch (err) {
    console.error("Stream token verification error:", err);
    return { ok: false, reason: "exception" };
  }
}
