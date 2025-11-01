export type TwilioAuth = { accountSid: string; authToken: string };
const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

function basic(auth: TwilioAuth) {
  const token = btoa(`${auth.accountSid}:${auth.authToken}`);
  return `Basic ${token}`;
}

// Extract <ref> from SUPABASE_URL and build functions domain
export function functionsBaseFromSupabaseUrl(supabaseUrl: string) {
  // https://<ref>.supabase.co -> https://<ref>.functions.supabase.co
  const m = supabaseUrl.match(/^https:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);
  if (!m) throw new Error("Invalid SUPABASE_URL");
  return `https://${m[1]}.functions.supabase.co`;
}

export async function ensureSubaccount(auth: TwilioAuth, friendlyName: string) {
  // Twilio: create subaccount (idempotent by friendlyName in our layer)
  // Strategy: list accounts and match by friendlyName; if none, create
  const listUrl = `${TWILIO_API_BASE}/Accounts.json?PageSize=50`;
  const list = await fetch(listUrl, { headers: { Authorization: basic(auth) } });
  if (!list.ok) throw new Error(`Twilio list accounts failed: ${list.status}`);
  const data = await list.json();
  const found = (data?.accounts ?? []).find((a: any) => a.friendly_name === friendlyName);
  if (found) return { sid: found.sid };

  const createUrl = `${TWILIO_API_BASE}/Accounts.json`;
  const body = new URLSearchParams({ FriendlyName: friendlyName });
  const res = await fetch(createUrl, {
    method: "POST",
    headers: { Authorization: basic(auth), "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Twilio create subaccount failed: ${res.status}`);
  const created = await res.json();
  return { sid: created.sid };
}

export async function findLocalNumber(auth: TwilioAuth, subSid: string, country = "CA", areaCode?: string) {
  const qs = new URLSearchParams({ PageSize: "20" });
  if (areaCode) qs.set("AreaCode", areaCode);
  const url = `${TWILIO_API_BASE}/Accounts/${subSid}/AvailablePhoneNumbers/${country}/Local.json?${qs}`;
  const res = await fetch(url, { headers: { Authorization: basic(auth) } });
  if (!res.ok) throw new Error(`Twilio available numbers failed: ${res.status}`);
  const json = await res.json();
  const first = json?.available_phone_numbers?.[0];
  if (!first) throw new Error("No available numbers for requested criteria");
  return first.phone_number as string;
}

export async function buyNumberAndBindWebhooks(
  auth: TwilioAuth,
  subSid: string,
  phoneNumber: string,
  voiceUrl: string,
  smsUrl: string
) {
  const url = `${TWILIO_API_BASE}/Accounts/${subSid}/IncomingPhoneNumbers.json`;
  const body = new URLSearchParams({
    PhoneNumber: phoneNumber,
    VoiceUrl: voiceUrl,
    SmsUrl: smsUrl,
  });
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: basic(auth), "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Buy/bind number failed: ${res.status}`);
  return await res.json();
}
