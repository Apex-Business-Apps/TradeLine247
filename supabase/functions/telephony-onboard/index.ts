/* eslint-disable @typescript-eslint/no-explicit-any */
// Idempotent one-click: ensure subaccount, pick/buy number, bind webhooks, persist.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { functionsBaseFromSupabaseUrl, ensureSubaccount, findLocalNumber, buyNumberAndBindWebhooks } from "../_shared/twilio.ts";

type Body = { org_id: string; business_name: string; area_code?: string; country?: "CA" | "US" };

Deno.serve(async (req) => {
  try {
    const { org_id, business_name, area_code, country = "CA" } = (await req.json()) as Body;

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return new Response(JSON.stringify({ error: "Missing Twilio credentials" }), { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    // 1) Ensure subaccount (cache in DB)
    const friendlyName = `TL247_${org_id}`;
    const { data: subRow } = await supabase.from("telephony_subaccounts").select("*").eq("org_id", org_id).maybeSingle();

    const { sid: subSid } = subRow?.subaccount_sid
      ? { sid: subRow.subaccount_sid }
      : await ensureSubaccount({ accountSid: TWILIO_ACCOUNT_SID, authToken: TWILIO_AUTH_TOKEN }, friendlyName);

    if (!subRow) {
      await supabase.from("telephony_subaccounts").insert({ org_id, business_name, subaccount_sid: subSid }).throwOnError();
    }

    // 2) Ensure number
    const { data: numRow } = await supabase.from("telephony_numbers").select("*").eq("org_id", org_id).maybeSingle();

    const fnBase = functionsBaseFromSupabaseUrl(SUPABASE_URL);
    const voiceUrl = `${fnBase}/voice-frontdoor`;
    const smsUrl = `${fnBase}/webcomms-sms-reply`;

    let purchasedNumber = numRow?.e164_number as string | undefined;
    if (!purchasedNumber) {
      const candidate = await findLocalNumber({ accountSid: TWILIO_ACCOUNT_SID, authToken: TWILIO_AUTH_TOKEN }, subSid, country);
      const bought = await buyNumberAndBindWebhooks(
        { accountSid: TWILIO_ACCOUNT_SID, authToken: TWILIO_AUTH_TOKEN },
        subSid,
        candidate,
        voiceUrl,
        smsUrl
      );
      purchasedNumber = bought.phone_number;
      await supabase.from("telephony_numbers").insert({
        org_id,
        subaccount_sid: subSid,
        e164_number: purchasedNumber,
        country,
      }).throwOnError();
    }

    return new Response(JSON.stringify({ subaccount_sid: subSid, phone_number: purchasedNumber, voice_url: voiceUrl, sms_url: smsUrl }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as any)?.message || e) }), { status: 500 });
  }
});
