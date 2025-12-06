/**
 * Resolve Escalation
 *
 * Handles escalation status updates and resolution tracking
 * for admin intervention in AI receptionist conversations.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ResolveEscalationRequest {
  escalationId: string;
  status: 'in_progress' | 'resolved' | 'escalated';
  notes: string;
}

interface EscalationResponse {
  success: boolean;
  escalationId: string;
  status: string;
  resolvedAt: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const requestData: ResolveEscalationRequest = await req.json();

    // Validate required fields
    if (!requestData.escalationId || !requestData.status || !requestData.notes) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get user from auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get user information
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Check if user is admin
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData) {
      return new Response(
        JSON.stringify({ error: "User not in organization" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Verify admin role
    if (memberData.role !== 'admin' && memberData.role !== 'owner') {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get escalation to verify it belongs to user's organization
    const { data: escalation, error: escalationError } = await supabase
      .from('escalation_logs')
      .select('*')
      .eq('id', requestData.escalationId)
      .eq('organization_id', memberData.org_id)
      .single();

    if (escalationError || !escalation) {
      return new Response(
        JSON.stringify({ error: "Escalation not found or access denied" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Update escalation
    const updateData: any = {
      status: requestData.status,
      resolution_notes: requestData.notes,
      updated_at: new Date().toISOString(),
    };

    // Set resolved timestamp if marking as resolved or escalated
    if (requestData.status === 'resolved' || requestData.status === 'escalated') {
      updateData.resolved_by = user.id;
      updateData.resolved_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('escalation_logs')
      .update(updateData)
      .eq('id', requestData.escalationId);

    if (updateError) {
      console.error("Escalation update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update escalation", details: updateError.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Log admin action
    await supabase
      .from('admin_action_logs')
      .insert({
        organization_id: memberData.org_id,
        user_id: user.id,
        action: 'escalation_resolved',
        resource_type: 'escalation',
        resource_id: requestData.escalationId,
        details: {
          previous_status: escalation.status,
          new_status: requestData.status,
          notes: requestData.notes
        }
      });

    // Send notification email if escalation is critical and being resolved
    if (escalation.severity_level === 'critical' && requestData.status === 'resolved') {
      try {
        // Get organization contact info
        const { data: org } = await supabase
          .from('organizations')
          .select('name, contact_email')
          .eq('id', memberData.org_id)
          .single();

        if (org?.contact_email) {
          // This would trigger an email notification (placeholder)
          console.log(`Critical escalation resolved for ${org.name}: ${requestData.escalationId}`);
        }
      } catch (emailError) {
        console.error("Notification email error:", emailError);
        // Don't fail the resolution for email issues
      }
    }

    const response: EscalationResponse = {
      success: true,
      escalationId: requestData.escalationId,
      status: requestData.status,
      resolvedAt: updateData.resolved_at || new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    console.error("Resolve escalation error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});