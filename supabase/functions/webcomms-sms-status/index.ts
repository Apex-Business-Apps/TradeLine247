// PROMPT D: SMS status callback - canonical path
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, preflight } from "../_shared/cors.ts";
import { validateTwilioSignature } from "../_shared/twilio_sig.ts";
import { withJSON } from "../_shared/secure_headers.ts";

serve(async (req) => {
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
      return new Response("Forbidden", { status: 403, headers: withJSON(corsHeaders) });
    }

    const formData = await req.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      params[key] = value.toString();
    }

    const messageSid = params.MessageSid;
    const messageStatus = params.MessageStatus;
    const errorCode = params.ErrorCode;
    const errorMessage = params.ErrorMessage;

    console.log("SMS status update:", { messageSid, messageStatus, errorCode });

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from("sms_status_logs")
      .upsert({
        message_sid: messageSid,
        status: messageStatus,
        error_code: errorCode || null,
        error_message: errorMessage || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "message_sid",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("Error updating SMS status:", error);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: withJSON(corsHeaders),
    });
  } catch (error) {
    console.error("Error in webcomms-sms-status:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: withJSON(corsHeaders),
    });
  }
});
