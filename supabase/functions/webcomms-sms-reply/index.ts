/* eslint-disable @typescript-eslint/no-explicit-any */
// PROMPT D: SMS reply webhook - canonical path
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, preflight } from "../_shared/cors.ts";
import { validateTwilioSignature } from "../_shared/twilio_sig.ts";
import { mergeHeaders, secureHeaders } from "../_shared/secure_headers.ts";

const twimlHeaders = mergeHeaders(corsHeaders, secureHeaders, { "Content-Type": "text/xml" });

Deno.serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  try {
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!twilioAuthToken) {
      throw new Error("TWILIO_AUTH_TOKEN not configured");
    }

    const isValid = await validateTwilioSignature(req.clone());
    if (!isValid) {
      console.error("Invalid Twilio signature");
      return new Response("forbidden", { status: 403, headers: mergeHeaders(corsHeaders, secureHeaders) });
    }

    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    const messageSid = params.MessageSid || params.SmsSid;
    const from = params.From;
    const to = params.To;
    const body = params.Body?.trim() || "";

    console.log("SMS received:", { messageSid, from, to, body: body?.substring(0, 50) });

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: logError } = await supabase
      .from("sms_reply_logs")
      .upsert({
        message_sid: messageSid,
        from_e164: from,
        to_e164: to,
        body: body,
        source: "twilio",
        external_id: messageSid,
      }, {
        onConflict: "source,external_id",
        ignoreDuplicates: false,
      });

    if (logError) {
      console.error("Error logging SMS reply:", logError);
    }

    const bodyUpper = body.toUpperCase();
    if (["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"].includes(bodyUpper)) {
      await supabase.from("consent_logs").insert({
        e164: from,
        status: "revoked",
        channel: "sms",
        source: "keyword_stop",
      });
    } else if (["START", "UNSTOP", "YES"].includes(bodyUpper)) {
      await supabase.from("consent_logs").insert({
        e164: from,
        status: "active",
        channel: "sms",
        source: "keyword_start",
      });
    }

    return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", {
      headers: twimlHeaders,
    });
  } catch (error) {
    console.error("Error in webcomms-sms-reply:", error);
    return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", {
      status: 200,
      headers: twimlHeaders,
    });
  }
});
