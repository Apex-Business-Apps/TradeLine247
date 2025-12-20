/**
 * notify_owner.ts - Owner Email Notifications
 *
 * CRITICAL: NO top-level https:// imports for Node ESM compatibility.
 * Uses factory pattern for runtime dependencies.
 *
 * Features:
 * - Non-blocking email notifications to business owners
 * - Idempotent (won't spam same event)
 * - Configurable via env flags
 * - Supports multiple notification types
 */

// ============================================================================
// TYPES
// ============================================================================

/** Notification event types */
export type NotificationEventType =
  | 'warranty_risk_detected'
  | 'escalation_required'
  | 'high_value_lead'
  | 'negative_sentiment'
  | 'opt_out_received'
  | 'compliance_event'
  | 'call_summary';

/** Notification payload */
export interface OwnerNotificationPayload {
  event_type: NotificationEventType;
  call_id?: string;
  call_sid?: string;
  category?: 'customer_service' | 'lead_capture' | 'prospect_call';
  consent_state?: 'granted' | 'denied' | 'unknown';
  scheduled_followup_time?: string;
  needs_review: boolean;
  redacted_summary?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, unknown>;
}

/** Email send result */
export interface EmailSendResult {
  sent: boolean;
  message_id?: string;
  error?: string;
}

/** Notification log entry */
export interface NotificationLogEntry {
  id?: string;
  event_type: NotificationEventType;
  recipient_email: string;
  call_id?: string;
  sent_at?: string;
  status: 'sent' | 'failed' | 'skipped';
  error_message?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default sender email */
export const DEFAULT_FROM_EMAIL = 'notifications@tradeline247ai.com';

/** Default sender name */
export const DEFAULT_FROM_NAME = 'TradeLine 24/7';

/** Notification cooldown in seconds (prevent spam) */
export const NOTIFICATION_COOLDOWN_SECONDS = 300; // 5 minutes

// ============================================================================
// PURE UTILITY FUNCTIONS
// ============================================================================

/**
 * Format notification subject line based on event type
 */
export function formatSubject(
  eventType: NotificationEventType,
  priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
): string {
  const priorityPrefix = priority === 'urgent' ? '🚨 URGENT: '
    : priority === 'high' ? '⚠️ '
    : '';

  const subjects: Record<NotificationEventType, string> = {
    warranty_risk_detected: 'Warranty Risk Detected',
    escalation_required: 'Escalation Required - Customer Needs Attention',
    high_value_lead: 'New High-Value Lead Captured',
    negative_sentiment: 'Negative Sentiment Alert',
    opt_out_received: 'Contact Opt-Out Received',
    compliance_event: 'Compliance Event Logged',
    call_summary: 'Call Summary'
  };

  return `${priorityPrefix}[TradeLine 24/7] ${subjects[eventType]}`;
}

/**
 * Format notification body as HTML
 */
export function formatEmailBody(payload: OwnerNotificationPayload): string {
  const sections: string[] = [];

  // Header
  sections.push(`
    <div style="background: linear-gradient(135deg, #FF6B35, #CC4A1F); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">TradeLine 24/7</h1>
      <p style="margin: 5px 0 0; opacity: 0.9;">Owner Notification</p>
    </div>
  `);

  // Event type badge
  const badgeColors: Record<NotificationEventType, string> = {
    warranty_risk_detected: '#f59e0b',
    escalation_required: '#ef4444',
    high_value_lead: '#10b981',
    negative_sentiment: '#f97316',
    opt_out_received: '#6b7280',
    compliance_event: '#3b82f6',
    call_summary: '#8b5cf6'
  };

  sections.push(`
    <div style="padding: 20px; background: #f9f9f9;">
      <span style="background: ${badgeColors[payload.event_type]}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">
        ${payload.event_type.replace(/_/g, ' ')}
      </span>
      ${payload.priority === 'urgent' || payload.priority === 'high'
        ? `<span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; margin-left: 8px;">
            ${payload.priority.toUpperCase()}
          </span>`
        : ''
      }
    </div>
  `);

  // Details
  const details: string[] = [];

  if (payload.call_id) {
    details.push(`<li><strong>Call ID:</strong> ${payload.call_id}</li>`);
  }

  if (payload.category) {
    details.push(`<li><strong>Category:</strong> ${payload.category.replace(/_/g, ' ')}</li>`);
  }

  if (payload.consent_state) {
    const consentBadge = payload.consent_state === 'granted'
      ? '<span style="color: #10b981;">Granted</span>'
      : payload.consent_state === 'denied'
        ? '<span style="color: #ef4444;">Denied</span>'
        : '<span style="color: #6b7280;">Unknown</span>';
    details.push(`<li><strong>Recording Consent:</strong> ${consentBadge}</li>`);
  }

  if (payload.scheduled_followup_time) {
    details.push(`<li><strong>Scheduled Follow-up:</strong> ${new Date(payload.scheduled_followup_time).toLocaleString()}</li>`);
  }

  if (payload.needs_review) {
    details.push(`<li><strong>Needs Review:</strong> <span style="color: #f59e0b;">Yes</span></li>`);
  }

  if (details.length > 0) {
    sections.push(`
      <div style="padding: 20px; background: white; border-left: 4px solid #FF6B35;">
        <h3 style="margin: 0 0 10px; color: #333;">Details</h3>
        <ul style="margin: 0; padding-left: 20px; color: #555;">
          ${details.join('\n')}
        </ul>
      </div>
    `);
  }

  // Redacted summary
  if (payload.redacted_summary) {
    sections.push(`
      <div style="padding: 20px; background: #f3f4f6;">
        <h3 style="margin: 0 0 10px; color: #333;">Summary</h3>
        <p style="margin: 0; color: #555; font-style: italic;">${payload.redacted_summary}</p>
      </div>
    `);
  }

  // Footer
  sections.push(`
    <div style="padding: 20px; background: #1f2937; color: #9ca3af; font-size: 12px; border-radius: 0 0 8px 8px;">
      <p style="margin: 0;">This notification was sent automatically by TradeLine 24/7.</p>
      <p style="margin: 5px 0 0;">To adjust notification settings, visit your dashboard.</p>
    </div>
  `);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #e5e7eb;">
      <div style="max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        ${sections.join('\n')}
      </div>
    </body>
    </html>
  `;
}

/**
 * Format notification as plain text
 */
export function formatEmailBodyPlain(payload: OwnerNotificationPayload): string {
  const lines: string[] = [
    'TradeLine 24/7 - Owner Notification',
    '=' .repeat(40),
    '',
    `Event: ${payload.event_type.replace(/_/g, ' ').toUpperCase()}`,
    payload.priority ? `Priority: ${payload.priority.toUpperCase()}` : '',
    '',
    'Details:',
    '-'.repeat(20)
  ];

  if (payload.call_id) lines.push(`Call ID: ${payload.call_id}`);
  if (payload.category) lines.push(`Category: ${payload.category}`);
  if (payload.consent_state) lines.push(`Recording Consent: ${payload.consent_state}`);
  if (payload.scheduled_followup_time) lines.push(`Scheduled Follow-up: ${payload.scheduled_followup_time}`);
  if (payload.needs_review) lines.push('Needs Review: YES');

  if (payload.redacted_summary) {
    lines.push('', 'Summary:', payload.redacted_summary);
  }

  lines.push(
    '',
    '-'.repeat(40),
    'This notification was sent automatically by TradeLine 24/7.'
  );

  return lines.filter(l => l !== '').join('\n');
}

/**
 * Check if notification is enabled for this event type
 */
export function isNotificationEnabled(
  eventType: NotificationEventType,
  envFlags: Record<string, string | undefined>
): boolean {
  // Check global disable flag
  if (envFlags.OWNER_NOTIFY_DISABLED === 'true') {
    return false;
  }

  // Check event-specific flags
  const flagMap: Record<NotificationEventType, string> = {
    warranty_risk_detected: 'NOTIFY_WARRANTY_RISK',
    escalation_required: 'NOTIFY_ESCALATION',
    high_value_lead: 'NOTIFY_HIGH_VALUE_LEAD',
    negative_sentiment: 'NOTIFY_NEGATIVE_SENTIMENT',
    opt_out_received: 'NOTIFY_OPT_OUT',
    compliance_event: 'NOTIFY_COMPLIANCE',
    call_summary: 'NOTIFY_CALL_SUMMARY'
  };

  const flag = flagMap[eventType];
  if (!flag) return true; // Default to enabled

  // If flag is explicitly set to 'false', disable
  if (envFlags[flag] === 'false') {
    return false;
  }

  return true;
}

// ============================================================================
// RUNTIME SERVICE FACTORY
// ============================================================================

/**
 * Create owner notification service with runtime dependencies
 */
export function createNotifyOwnerService(
  supabaseClient: {
    from: (table: string) => {
      insert: (data: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
      select: (columns?: string) => {
        eq: (col: string, val: unknown) => {
          gte: (col: string, val: unknown) => Promise<{ data: unknown[]; error: unknown }>;
        };
      };
    };
  },
  emailProvider?: {
    send: (options: {
      from: string;
      to: string;
      subject: string;
      html: string;
      text: string;
    }) => Promise<{ data?: { id: string }; error?: unknown }>;
  }
) {
  if (!supabaseClient) {
    throw new Error('Supabase client is required for notify owner service');
  }

  // Get env flags (Deno runtime)
  const getEnv = (key: string): string | undefined => {
    if (typeof Deno !== 'undefined') {
      return Deno.env.get(key);
    }
    return undefined;
  };

  const ownerEmail = getEnv('OWNER_NOTIFY_EMAIL') || getEnv('BUSINESS_OWNER_EMAIL');
  const fromEmail = getEnv('NOTIFY_FROM_EMAIL') || DEFAULT_FROM_EMAIL;

  return {
    /**
     * Send notification to owner
     * Non-blocking, idempotent
     */
    async sendNotification(
      payload: OwnerNotificationPayload
    ): Promise<EmailSendResult> {
      try {
        // Check if notifications are enabled
        const envFlags: Record<string, string | undefined> = {
          OWNER_NOTIFY_DISABLED: getEnv('OWNER_NOTIFY_DISABLED'),
          NOTIFY_WARRANTY_RISK: getEnv('NOTIFY_WARRANTY_RISK'),
          NOTIFY_ESCALATION: getEnv('NOTIFY_ESCALATION'),
          NOTIFY_HIGH_VALUE_LEAD: getEnv('NOTIFY_HIGH_VALUE_LEAD'),
          NOTIFY_NEGATIVE_SENTIMENT: getEnv('NOTIFY_NEGATIVE_SENTIMENT'),
          NOTIFY_OPT_OUT: getEnv('NOTIFY_OPT_OUT'),
          NOTIFY_COMPLIANCE: getEnv('NOTIFY_COMPLIANCE'),
          NOTIFY_CALL_SUMMARY: getEnv('NOTIFY_CALL_SUMMARY')
        };

        if (!isNotificationEnabled(payload.event_type, envFlags)) {
          console.log(`Notification disabled for event type: ${payload.event_type}`);
          return { sent: false, error: 'notification_disabled' };
        }

        if (!ownerEmail) {
          console.log('No owner email configured (OWNER_NOTIFY_EMAIL)');
          return { sent: false, error: 'no_owner_email_configured' };
        }

        // Check cooldown (prevent spam)
        const cooldownTime = new Date(Date.now() - NOTIFICATION_COOLDOWN_SECONDS * 1000).toISOString();
        const { data: recentNotifications } = await supabaseClient
          .from('notification_logs')
          .select('id')
          .eq('event_type', payload.event_type)
          .eq('call_id', payload.call_id || '')
          .gte('sent_at', cooldownTime);

        if (recentNotifications && recentNotifications.length > 0) {
          console.log(`Notification cooldown active for ${payload.event_type}`);
          return { sent: false, error: 'cooldown_active' };
        }

        // Format email
        const subject = formatSubject(payload.event_type, payload.priority);
        const html = formatEmailBody(payload);
        const text = formatEmailBodyPlain(payload);

        // Send email
        if (emailProvider) {
          const result = await emailProvider.send({
            from: fromEmail,
            to: ownerEmail,
            subject,
            html,
            text
          });

          if (result.error) {
            // Log failure
            await this.logNotification({
              event_type: payload.event_type,
              recipient_email: ownerEmail,
              call_id: payload.call_id,
              status: 'failed',
              error_message: String(result.error)
            });

            return { sent: false, error: String(result.error) };
          }

          // Log success
          await this.logNotification({
            event_type: payload.event_type,
            recipient_email: ownerEmail,
            call_id: payload.call_id,
            status: 'sent'
          });

          return { sent: true, message_id: result.data?.id };
        } else {
          // No email provider - log but don't send
          console.log(`[NOTIFY] Would send to ${ownerEmail}: ${subject}`);
          console.log(`[NOTIFY] Payload:`, JSON.stringify(payload, null, 2));

          await this.logNotification({
            event_type: payload.event_type,
            recipient_email: ownerEmail,
            call_id: payload.call_id,
            status: 'skipped',
            error_message: 'no_email_provider'
          });

          return { sent: false, error: 'no_email_provider' };
        }
      } catch (err) {
        console.error('sendNotification error:', err);
        return { sent: false, error: String(err) };
      }
    },

    /**
     * Log notification attempt
     */
    async logNotification(entry: NotificationLogEntry): Promise<void> {
      try {
        await supabaseClient.from('notification_logs').insert({
          event_type: entry.event_type,
          recipient_email: entry.recipient_email,
          call_id: entry.call_id,
          sent_at: new Date().toISOString(),
          status: entry.status,
          error_message: entry.error_message
        });
      } catch (err) {
        console.error('Failed to log notification:', err);
      }
    },

    /**
     * Send warranty risk notification (convenience method)
     */
    async notifyWarrantyRisk(
      callId: string,
      summary: string,
      metadata?: Record<string, unknown>
    ): Promise<EmailSendResult> {
      return this.sendNotification({
        event_type: 'warranty_risk_detected',
        call_id: callId,
        needs_review: true,
        redacted_summary: summary,
        priority: 'high',
        metadata
      });
    },

    /**
     * Send escalation notification (convenience method)
     */
    async notifyEscalation(
      callId: string,
      reason: string,
      category?: 'customer_service' | 'lead_capture' | 'prospect_call'
    ): Promise<EmailSendResult> {
      return this.sendNotification({
        event_type: 'escalation_required',
        call_id: callId,
        category,
        needs_review: true,
        redacted_summary: reason,
        priority: 'urgent'
      });
    }
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Constants
  DEFAULT_FROM_EMAIL,
  DEFAULT_FROM_NAME,
  NOTIFICATION_COOLDOWN_SECONDS,
  // Pure utilities
  formatSubject,
  formatEmailBody,
  formatEmailBodyPlain,
  isNotificationEnabled,
  // Factory
  createNotifyOwnerService
};
