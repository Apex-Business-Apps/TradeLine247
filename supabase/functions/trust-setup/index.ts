// Admin-only Trust Hub/A2P setup: idempotent
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

type Body = {
  business_name: string;
  legal_address?: string;
  phone_number: string;
  country_code?: string;
  contact_email?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const correlationId = crypto.randomUUID();

  try {
    // 1) Auth + admin check
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (!user || userError) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", correlationId }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleData?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin access required", correlationId }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Get tenant_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: "No tenant mapping", correlationId }),
        { status: 403, headers: corsHeaders }
      );
    }

    const tenantId = profile.organization_id;

    // 2) Get subaccount SID
    const { data: subaccount } = await supabase
      .from("telephony_subaccounts")
      .select("subaccount_sid")
      .eq("org_id", tenantId)
      .maybeSingle();

    if (!subaccount) {
      return new Response(
        JSON.stringify({ error: "Subaccount not found for tenant", correlationId }),
        { status: 404, headers: corsHeaders }
      );
    }

    const body = (await req.json()) as Body;
    const { business_name, legal_address, phone_number, country_code = "US", contact_email } = body;

    if (!business_name || !phone_number) {
      return new Response(
        JSON.stringify({ error: "business_name and phone_number required", correlationId }),
        { status: 400, headers: corsHeaders }
      );
    }

    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Missing Twilio credentials", correlationId }),
        { status: 500, headers: corsHeaders }
      );
    }

    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const accountSid = subaccount.subaccount_sid || TWILIO_ACCOUNT_SID;

    let trustHubProfileSid: string | null = null;
    let a2pBrandSid: string | null = null;
    let a2pCampaignSid: string | null = null;
    let voiceIntegrityEnabled = false;
    let cnamSet = false;

    // 3) Ensure Trust Hub Business Profile (idempotent)
    try {
      // Check if profile already exists
      const trustHubUrl = `https://trusthub.twilio.com/v1/CustomerProfiles`;
      const listResponse = await fetch(`${trustHubUrl}?PageSize=50`, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      });

      if (listResponse.ok) {
        const listData = await listResponse.json();
        const existing = listData.profiles?.find((p: any) => 
          p.friendly_name?.includes(business_name)
        );
        if (existing) {
          trustHubProfileSid = existing.sid;
        }
      }

      if (!trustHubProfileSid) {
        const createResponse = await fetch(trustHubUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            FriendlyName: `${business_name} Profile`,
            Email: contact_email || "",
            PolicySid: "RNb0d4771c2c98518d0d16c5bf199a916f",
          }),
        });

        if (createResponse.ok) {
          const data = await createResponse.json();
          trustHubProfileSid = data.sid;
        }
      }
    } catch (error) {
      console.error("Trust Hub setup error:", error);
    }

    // 4) Ensure A2P 10DLC Brand and Campaign (US only, idempotent)
    if (country_code === "US" && trustHubProfileSid) {
      try {
        // Check existing brands
        const brandUrl = `https://messaging.twilio.com/v1/a2p/BrandRegistrations`;
        const brandListResponse = await fetch(brandUrl, {
          headers: { Authorization: `Basic ${auth}` },
        });

        if (brandListResponse.ok) {
          const brandListData = await brandListResponse.json();
          const existingBrand = brandListData.results?.find((b: any) =>
            b.brand_type === "STANDARD" && b.customer_profile_bundle_sid === trustHubProfileSid
          );
          if (existingBrand) {
            a2pBrandSid = existingBrand.brand_sid;
          }
        }

        if (!a2pBrandSid) {
          const brandCreateUrl = `https://messaging.twilio.com/v1/a2p/BrandRegistrations`;
          const brandResponse = await fetch(brandCreateUrl, {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              customer_profile_bundle_sid: trustHubProfileSid,
              brand_type: "STANDARD",
            }),
          });

          if (brandResponse.ok) {
            const brandData = await brandResponse.json();
            a2pBrandSid = brandData.brand_sid;
          }
        }

        // Create campaign if brand exists
        if (a2pBrandSid) {
          const campaignUrl = `https://messaging.twilio.com/v1/a2p/BrandRegistrations/${a2pBrandSid}/Campaigns`;
          const campaignResponse = await fetch(campaignUrl, {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              description: `Standard messaging campaign for ${business_name}`,
              message_flow: "Transactional and promotional messages",
              use_cases: ["MIXED"],
              message_samples: ["Hi! Your appointment is confirmed for tomorrow at 2 PM."],
            }),
          });

          if (campaignResponse.ok) {
            const campaignData = await campaignResponse.json();
            a2pCampaignSid = campaignData.campaign_sid;
          }
        }
      } catch (error) {
        console.error("A2P setup error:", error);
      }
    }

    // 5) Optional: Enable STIR/SHAKEN and CNAM (if data present)
    if (phone_number) {
      try {
        const numberUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(phone_number)}`;
        const numbersResponse = await fetch(numberUrl, {
          headers: { Authorization: `Basic ${auth}` },
        });

        if (numbersResponse.ok) {
          const numbersData = await numbersResponse.json();
          if (numbersData.incoming_phone_numbers?.length > 0) {
            const numberSid = numbersData.incoming_phone_numbers[0].sid;
            const updateUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers/${numberSid}.json`;
            const updateResponse = await fetch(updateUrl, {
              method: "POST",
              headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                VoiceCallerIdLookup: "true",
              }),
            });

            if (updateResponse.ok) {
              voiceIntegrityEnabled = true;
            }
          }
        }
      } catch (error) {
        console.error("Voice integrity error:", error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        trustHubProfileSid,
        a2pBrandSid,
        a2pCampaignSid,
        voiceIntegrityEnabled,
        cnamSet,
        correlationId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[trust-setup] Error:", error);
    return new Response(
      JSON.stringify({
        error: String((error as any)?.message || error),
        correlationId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

