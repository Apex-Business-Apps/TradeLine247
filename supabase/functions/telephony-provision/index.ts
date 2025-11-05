// One-click number onboarding: server-derived tenant, Twilio subaccount, idempotent
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { functionsBaseFromSupabaseUrl, ensureSubaccount, findLocalNumber, buyNumberAndBindWebhooks } from "../_shared/twilio.ts";

type Body = {
  business_name: string;
  legal_address?: string;
  contact_email?: string;
  area_code?: string;
  country?: "CA" | "US";
  fallback_e164?: string;
  existing_numbers?: string;
};

serve(async (req) => {
  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();
  
  try {
    // 1) Auth + tenant derivation from JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    
    // Get user from JWT
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (!user || userError) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", correlationId }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Load profile to get tenant_id (organization_id)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: "No tenant mapping", correlationId }),
        { status: 403, headers: corsHeaders }
      );
    }

    const tenantId = profile.organization_id;

    // Parse body
    const body = (await req.json()) as Body;
    const { business_name, area_code, country = "CA", fallback_e164, existing_numbers } = body;

    if (!business_name) {
      return new Response(
        JSON.stringify({ error: "business_name required", correlationId }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 2) Ensure Twilio subaccount for tenant
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Missing Twilio credentials", correlationId }),
        { status: 500, headers: corsHeaders }
      );
    }

    const friendlyName = `TL247_${tenantId}`;
    const { data: subRow } = await supabase
      .from("telephony_subaccounts")
      .select("*")
      .eq("org_id", tenantId)
      .maybeSingle();

    let subSid: string;
    if (subRow?.subaccount_sid) {
      subSid = subRow.subaccount_sid;
    } else {
      const { sid } = await ensureSubaccount(
        { accountSid: TWILIO_ACCOUNT_SID, authToken: TWILIO_AUTH_TOKEN },
        friendlyName
      );
      subSid = sid;
      await supabase
        .from("telephony_subaccounts")
        .insert({ org_id: tenantId, business_name, subaccount_sid: subSid })
        .throwOnError();
    }

    // 3) Buy/attach number under subaccount
    const fnBase = functionsBaseFromSupabaseUrl(SUPABASE_URL);
    const voiceUrl = `${fnBase}/voice-frontdoor`;
    const smsUrl = `${fnBase}/webcomms-sms-reply`;

    let purchasedNumber: string | undefined;
    let phoneSid: string | undefined;

    // If existing_numbers provided, use first; otherwise buy new
    if (existing_numbers) {
      const numbers = existing_numbers.split(",").map(n => n.trim()).filter(n => n);
      if (numbers.length > 0) {
        purchasedNumber = numbers[0];
        // For existing numbers, we'd need to fetch the phone_sid from Twilio
        // For now, we'll purchase a new number if fallback is provided
      }
    }

    if (!purchasedNumber) {
      // Purchase new number
      const normalizedFallback = fallback_e164?.replace(/[^0-9]/g, "");
      const areaCodeFromFallback = normalizedFallback && normalizedFallback.length >= 10
        ? normalizedFallback.slice(-10, -7)
        : area_code;

      const candidate = await findLocalNumber(
        { accountSid: TWILIO_ACCOUNT_SID, authToken: TWILIO_AUTH_TOKEN },
        subSid,
        country,
        areaCodeFromFallback
      );

      const bought = await buyNumberAndBindWebhooks(
        { accountSid: TWILIO_ACCOUNT_SID, authToken: TWILIO_AUTH_TOKEN },
        subSid,
        candidate,
        voiceUrl,
        smsUrl
      );

      purchasedNumber = bought.phone_number;
      phoneSid = bought.sid;
    } else {
      // For existing numbers, we need to configure webhooks
      // This is simplified - in production, you'd fetch the number SID from Twilio
      phoneSid = `PN${Date.now()}`; // Placeholder - should fetch from Twilio
    }

    // 4) Upsert into public.numbers (idempotent - use tenant_id + e164 as conflict target)
    const { data: numRow, error: numError } = await supabase
      .from("numbers")
      .upsert(
        {
          tenant_id: tenantId,
          phone_sid: phoneSid!,
          e164: purchasedNumber!,
          status: "active",
          subaccount_sid: subSid,
        },
        { onConflict: "tenant_id,e164" }
      )
      .select()
      .single();

    if (numError) {
      console.error("Numbers insert error:", numError);
      return new Response(
        JSON.stringify({ error: "Failed to persist number", correlationId, details: numError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 5) If admin, trigger trust-setup and billing-map (fire-and-forget)
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const isAdmin = roleData?.role === "admin";

    if (isAdmin) {
      // Fire-and-forget: don't await
      const trustUrl = `${fnBase}/trust-setup`;
      const billingUrl = `${fnBase}/billing-map`;

      fetch(trustUrl, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name,
          legal_address: body.legal_address,
          contact_email: body.contact_email,
          phone_number: purchasedNumber,
          country_code: country === "US" ? "US" : "CA",
        }),
      }).catch(err => console.error("Trust setup trigger failed:", err));

      fetch(billingUrl, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: purchasedNumber,
          phone_sid: phoneSid,
        }),
      }).catch(err => console.error("Billing map trigger failed:", err));
    }

    return new Response(
      JSON.stringify({
        subaccount_sid: subSid,
        phone_number: purchasedNumber,
        phone_sid: phoneSid,
        voice_url: voiceUrl,
        sms_url: smsUrl,
        correlationId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: isAdmin ? 202 : 200, // 202 Accepted for admin (async jobs triggered)
      }
    );
  } catch (e) {
    console.error(`[telephony-provision] Error:`, e);
    return new Response(
      JSON.stringify({
        error: String((e as any)?.message || e),
        correlationId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

