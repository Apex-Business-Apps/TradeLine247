/**
 * Owner Notification Function
 *
 * Sends email notifications to business owners for important events:
 * - Warranty risk detected (Vision Anchor)
 * - High-value lead captured
 * - Compliance event requiring review
 * - Escalation triggered
 *
 * Uses Resend (existing provider) for email delivery.
 *
 * @module functions/notify-owner
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Notification types
type NotificationType =
  | 'warranty_risk'
  | 'high_value_lead'
  | 'compliance_review'
  | 'escalation'
  | 'opt_out'
  | 'vision_anchor';

interface NotificationPayload {
  type: NotificationType;
  callSid?: string;
  leadId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

// Email templates by notification type
function getEmailContent(payload: NotificationPayload, orgName: string): { subject: string; html: string } {
  const priorityEmoji = {
    low: 'ℹ️',
    medium: '📋',
    high: '⚠️',
    urgent: '🚨',
  };

  const emoji = priorityEmoji[payload.priority];
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Edmonton',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const baseHtml = `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">${emoji} ${payload.title}</h1>
        <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">${orgName} • ${timestamp}</p>
      </div>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 16px; color: #333; font-size: 15px;">${payload.summary}</p>
        ${payload.callSid ? `<p style="margin: 8px 0; color: #666; font-size: 13px;"><strong>Call ID:</strong> ${payload.callSid.slice(-8)}</p>` : ''}
        ${payload.leadId ? `<p style="margin: 8px 0; color: #666; font-size: 13px;"><strong>Lead ID:</strong> ${payload.leadId.slice(0, 8)}...</p>` : ''}
        ${payload.metadata ? `
          <div style="margin-top: 16px; padding: 12px; background: white; border-radius: 4px; border: 1px solid #e0e0e0;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #888; text-transform: uppercase;">Details</p>
            <pre style="margin: 0; font-size: 12px; color: #555; white-space: pre-wrap; overflow-x: auto;">${JSON.stringify(payload.metadata, null, 2)}</pre>
          </div>
        ` : ''}
        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
          <a href="https://www.tradeline247ai.com/admin/calls" style="display: inline-block; background: #16213e; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 14px;">
            View in Dashboard →
          </a>
        </div>
      </div>
      <p style="margin: 16px 0 0; font-size: 11px; color: #999; text-align: center;">
        TradeLine 24/7 • AI Receptionist Platform<br>
        This is an automated notification. Do not reply to this email.
      </p>
    </div>
  `;

  return {
    subject: `${emoji} [${payload.priority.toUpperCase()}] ${payload.title}`,
    html: baseHtml,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const OWNER_EMAIL = Deno.env.get('OWNER_NOTIFICATION_EMAIL') || 'jrmendozaceo@apexbusiness-systems.com';

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const payload: NotificationPayload = await req.json();

    if (!payload.type || !payload.title || !payload.summary) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type, title, summary' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(RESEND_API_KEY);

    // Get organization name
    let orgName = 'TradeLine 24/7';
    if (payload.callSid) {
      const { data: callLog } = await supabase
        .from('call_logs')
        .select('organization:organizations(name)')
        .eq('call_sid', payload.callSid)
        .single();
      if (callLog?.organization?.name) {
        orgName = callLog.organization.name;
      }
    }

    // Generate email content
    const { subject, html } = getEmailContent(payload, orgName);

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: `${orgName} Alerts <alerts@resend.dev>`,
      to: [OWNER_EMAIL],
      subject,
      html,
    });

    if (emailError) {
      throw emailError;
    }

    // Log compliance event
    await supabase.from('compliance_events').insert({
      call_sid: payload.callSid || null,
      event_type: 'owner_notified',
      metadata: {
        notification_type: payload.type,
        priority: payload.priority,
        title: payload.title,
        sent_to: OWNER_EMAIL.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
      },
    });

    console.log(`✅ Owner notification sent: ${payload.type} (${payload.priority})`);

    return new Response(
      JSON.stringify({ success: true, type: payload.type }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending owner notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
