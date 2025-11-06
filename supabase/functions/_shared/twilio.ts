import { corsHeaders } from "./cors.ts";
import { secureHeaders } from "./secure_headers.ts";

export type TwilioAuth = { accountSid: string; authToken: string };

const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";
const ENV_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID") ?? "";
const ENV_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN") ?? "";

function basic(auth: TwilioAuth) {
  return `Basic ${btoa(`${auth.accountSid}:${auth.authToken}`)}`;
}

function defaultAuthHeader() {
  if (!ENV_ACCOUNT_SID || !ENV_AUTH_TOKEN) return "";
  return basic({ accountSid: ENV_ACCOUNT_SID, authToken: ENV_AUTH_TOKEN });
}

type TwilioPostOptions = {
  auth?: TwilioAuth;
  authHeader?: string;
  headers?: Record<string, string>;
};

export async function twilioFormPOST(
  path: string,
  form: URLSearchParams,
  maxRetries = 4,
  opts: TwilioPostOptions = {},
) {
  let wait = 300;
  const authHeader = opts.authHeader ?? (opts.auth ? basic(opts.auth) : defaultAuthHeader());
  if (!authHeader) {
    throw new Error("Twilio credentials not configured");
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(`${TWILIO_API_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
        ...opts.headers,
      },
      body: form,
    });

    if (res.status === 429 || res.status >= 500) {
      if (attempt === maxRetries) {
        return res;
      }
      await new Promise((resolve) => setTimeout(resolve, wait + Math.floor(Math.random() * 150)));
      wait = Math.min(wait * 2, 5000);
      continue;
    }

    return res;
  }

  throw new Error("twilioFormPOST exhausted retries");
}

export const okHeaders = { ...corsHeaders, ...secureHeaders, "Content-Type": "application/json" };

// Extract <ref> from SUPABASE_URL and build functions domain
export function functionsBaseFromSupabaseUrl(supabaseUrl: string) {
  // https://<ref>.supabase.co -> https://<ref>.functions.supabase.co
  const m = supabaseUrl.match(/^https:\/\/([a-zA-Z0-9-]+)\.supabase\.co/);
  if (!m) throw new Error("Invalid SUPABASE_URL");
  return `https://${m[1]}.functions.supabase.co`;
}

export async function ensureSubaccount(auth: TwilioAuth, friendlyName: string) {
  const authHeader = basic(auth);
  const listUrl = `${TWILIO_API_BASE}/Accounts.json?PageSize=50`;
  const list = await fetch(listUrl, { headers: { Authorization: authHeader } });
  if (!list.ok) throw new Error(`Twilio list accounts failed: ${list.status}`);
  const data = await list.json();
  const found = (data?.accounts ?? []).find((a: any) => a.friendly_name === friendlyName);
  if (found) return { sid: found.sid };

  const body = new URLSearchParams({ FriendlyName: friendlyName });
  const res = await twilioFormPOST(`/Accounts.json`, body, 4, { auth });
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
  smsUrl: string,
) {
  const body = new URLSearchParams({
    PhoneNumber: phoneNumber,
    VoiceUrl: voiceUrl,
    SmsUrl: smsUrl,
  });
  const res = await twilioFormPOST(`/Accounts/${subSid}/IncomingPhoneNumbers.json`, body, 4, { auth });
  if (!res.ok) throw new Error(`Buy/bind number failed: ${res.status}`);
  return await res.json();
}
