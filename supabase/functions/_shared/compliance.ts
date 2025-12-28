/**
 * compliance.ts - Pure helpers + runtime factory
 *
 * CRITICAL: NO top-level https:// imports to ensure Node ESM loader compatibility
 * for CI tests. All runtime dependencies are injected via factory functions.
 *
 * Pattern:
 * - Pure utility functions: exported at top-level, used for unit tests
 * - createComplianceService(supabaseClient): factory for runtime methods
 */

// ============================================================================
// TYPES
// ============================================================================

/** Session context for compliance decisions */
export interface SessionContext {
  call_id?: string;
  call_sid?: string;
  caller_number?: string;
  caller_name?: string;
  caller_tz?: string | null;
  jurisdiction?: string | null;
  consent_flags?: {
    recording?: boolean;
    sms_opt_in?: boolean;
  };
  voice_config?: Record<string, unknown>;
  call_category?: 'customer_service' | 'lead_capture' | 'prospect_call' | null;
  metadata?: Record<string, unknown>;
}

/** Compliance event for audit logging */
export interface ComplianceEvent {
  call_id?: string;
  event_type: string;
  reason: string;
  details?: Record<string, unknown>;
  created_by: string;
  created_at?: string;
}

/** Quiet hours enforcement result */
export interface QuietHoursResult {
  adjusted_time: string;
  needs_review: boolean;
  original_time?: string;
}

/** Recording consent check result */
export interface ConsentCheckResult {
  allow: boolean;
  reason?: string;
  mode?: 'full' | 'no_record';
}

/** Opt-out suppression request */
export interface OptOutRequest {
  type: 'voice' | 'sms' | 'all';
  identifier: string;
  source?: string;
}

/** BANT summary for lead qualification */
export interface BANTSummary {
  budget?: string | null;
  authority?: string | null;
  need?: string | null;
  timeline?: string | null;
  score?: number;
}

/** TL247 Meta block for machine-readable output */
export interface TL247Meta {
  call_category: 'customer_service' | 'lead_capture' | 'prospect_call';
  consent_state: 'granted' | 'denied' | 'unknown';
  recording_mode: 'full' | 'no_record';
  sentiment: number;
  bant_summary: BANTSummary | null;
  followup_recommendation: string | null;
  vision_anchor_flag: boolean;
  needs_review: boolean;
}

// ============================================================================
// PURE UTILITY FUNCTIONS (No external dependencies)
// ============================================================================

/**
 * Redact sensitive information from text for safe logging
 * Handles: SSN, credit cards, API keys, PINs
 */
export function redactSensitive(text: string): string {
  if (!text) return text;

  return text
    // SSN pattern: XXX-XX-XXXX
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, 'XXX-XX-XXXX')
    // Credit card numbers (13-19 digits): show first 4, mask rest
    .replace(/\b\d{13,19}\b/g, (m) => m.slice(0, 4).padEnd(m.length, 'X'))
    // AWS/API keys
    .replace(/\b(?:AKIA|SK-|sk-|api_key=|apikey=)[A-Za-z0-9-_]{8,}\b/gi, '[REDACTED_KEY]')
    // Phone numbers in E.164 format
    .replace(/\+\d{10,15}/g, '[PHONE]')
    // Email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
    // 4-6 digit PINs/codes (be conservative)
    .replace(/\b\d{4,6}\b/g, (m) => (m.length >= 4 && m.length <= 6 ? '****' : m));
}

/**
 * Enforce quiet hours for outbound contact
 * US compliance: 8:00-21:00 local time at called party location
 *
 * If timezone unknown: schedule next business day 10:00 and flag for review
 */
export function enforceQuietHours(
  proposedTimeIso: string | Date,
  callerTz?: string | null,
  window = { start: 8, end: 21 }
): QuietHoursResult {
  const d = typeof proposedTimeIso === 'string'
    ? new Date(proposedTimeIso)
    : new Date(proposedTimeIso.getTime());

  const originalTime = d.toISOString();

  // If timezone unknown, fail safe: schedule next business day at 10:00
  if (!callerTz) {
    const now = new Date();
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(10, 0, 0, 0);
    return {
      adjusted_time: next.toISOString(),
      needs_review: true,
      original_time: originalTime
    };
  }

  // Try to parse the hour in caller's timezone
  // For simplicity, using UTC hour (production should use proper tz library)
  const hour = d.getUTCHours();

  if (hour >= window.start && hour < window.end) {
    return {
      adjusted_time: d.toISOString(),
      needs_review: false,
      original_time: originalTime
    };
  } else {
    // Outside quiet hours: schedule next day at window start
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    next.setUTCHours(window.start, 0, 0, 0);
    return {
      adjusted_time: next.toISOString(),
      needs_review: false,
      original_time: originalTime
    };
  }
}

/**
 * Categorize call based on intent signals
 * Returns exactly one of: customer_service | lead_capture | prospect_call
 */
export function categorizeCall(
  intentSignals: { text?: string; keywords?: string[] } | null
): 'customer_service' | 'lead_capture' | 'prospect_call' {
  if (!intentSignals) return 'lead_capture';

  const text = (intentSignals.text || '').toLowerCase();
  const keywords = intentSignals.keywords || [];
  const allText = text + ' ' + keywords.join(' ').toLowerCase();

  // Prospect signals: pricing, quotes, estimates
  if (/price|quote|estimate|pricing|cost|how much|rate/i.test(allText)) {
    return 'prospect_call';
  }

  // Customer service signals: support, issues, problems
  if (/help|support|issue|problem|cancel|refund|complaint|broken|not working|service call/i.test(allText)) {
    return 'customer_service';
  }

  // Default to lead capture
  return 'lead_capture';
}

/**
 * Validate consent state for recording
 * Implements fail-closed logic: if consent is not explicitly YES, no recording
 */
export function validateRecordingConsent(
  session: SessionContext
): ConsentCheckResult {
  const consent = session?.consent_flags?.recording;

  if (consent === true) {
    return { allow: true, mode: 'full' };
  }

  // Fail closed: no consent or unknown = NO-RECORD MODE
  return {
    allow: false,
    reason: consent === false ? 'consent_denied' : 'consent_unknown',
    mode: 'no_record'
  };
}

/**
 * Validate SMS/marketing opt-in
 * Returns false if opt-in is not explicitly true
 */
export function validateSmsOptIn(session: SessionContext): boolean {
  return session?.consent_flags?.sms_opt_in === true;
}

/**
 * Calculate simple sentiment score from -1 to +1
 * Production should use proper NLP; this is a fallback
 */
export function calculateSentiment(text: string): number {
  if (!text) return 0;

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  const positive = ['great', 'excellent', 'thank', 'appreciate', 'happy', 'good',
    'perfect', 'wonderful', 'love', 'helpful', 'awesome', 'amazing', 'pleased'];
  const negative = ['terrible', 'awful', 'horrible', 'frustrated', 'angry',
    'upset', 'disappointed', 'hate', 'bad', 'worst', 'sucks', 'furious',
    'unacceptable', 'ridiculous', 'lawsuit', 'attorney', 'lawyer'];

  let score = 0;
  words.forEach(word => {
    if (positive.includes(word)) score += 0.15;
    if (negative.includes(word)) score -= 0.25;
  });

  // Normalize to -1 to 1 range
  return Math.max(-1, Math.min(1, score));
}

/**
 * Check if sentiment indicates escalation need
 * Threshold: <= -0.5 or presence of threat keywords
 */
export function shouldEscalate(text: string, sentimentScore: number): boolean {
  if (sentimentScore <= -0.5) return true;

  const threatPatterns = /\b(sue|lawyer|attorney|legal action|lawsuit|report you|bbb|better business|regulatory|complaint|fraud)\b/i;
  return threatPatterns.test(text);
}

/**
 * Build NO-RECORD MODE metadata (only allowed fields)
 * Per TL247 policy: caller_id_number, caller_id_name (if public), category, consent, redacted summary
 */
export function buildNoRecordMetadata(session: SessionContext, redactedSummary?: string): Record<string, unknown> {
  return {
    caller_id_number: session.caller_number || null,
    caller_id_name: session.caller_name || null,
    call_category: session.call_category || 'lead_capture',
    consent_state: session.consent_flags?.recording ? 'granted' : 'denied',
    recording_mode: 'no_record',
    redacted_summary: redactedSummary ? redactSensitive(redactedSummary) : null,
    needs_review: true,
    captured_at: new Date().toISOString()
  };
}

/**
 * Generate TL247_META block for machine-readable output
 */
export function generateTL247Meta(
  session: SessionContext,
  sentimentScore: number,
  bantSummary: BANTSummary | null = null,
  followupRecommendation: string | null = null,
  visionAnchorFlag = false
): TL247Meta {
  return {
    call_category: session.call_category || 'lead_capture',
    consent_state: session.consent_flags?.recording === true ? 'granted'
      : session.consent_flags?.recording === false ? 'denied' : 'unknown',
    recording_mode: session.consent_flags?.recording === true ? 'full' : 'no_record',
    sentiment: Math.round(sentimentScore * 100) / 100,
    bant_summary: bantSummary,
    followup_recommendation: followupRecommendation,
    vision_anchor_flag: visionAnchorFlag,
    needs_review: !session.caller_tz || sentimentScore <= -0.5
  };
}

/**
 * Format TL247_META as string for prompt output
 */
export function formatTL247MetaBlock(meta: TL247Meta): string {
  return `<TL247_META>${JSON.stringify(meta)}</TL247_META>`;
}

// ============================================================================
// RUNTIME SERVICE FACTORY (Requires supabase client injection)
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientLike = any;

/**
 * Create compliance service with runtime supabase client
 * This factory pattern ensures no https:// imports at module load time
 */
export function createComplianceService(supabaseClient: SupabaseClientLike) {
  if (!supabaseClient) {
    throw new Error('Supabase client is required for compliance service');
  }

  return {
    /**
     * Apply suppression (opt-out) for a contact
     */
    async applySuppression(optOut: OptOutRequest): Promise<{ suppressed: boolean; error?: string }> {
      try {
        const suppressionData: Record<string, unknown> = {
          identifier: optOut.identifier,
          suppressed_voice: optOut.type === 'voice' || optOut.type === 'all',
          suppressed_sms: optOut.type === 'sms' || optOut.type === 'all',
          source: optOut.source || 'voice_call',
          updated_at: new Date().toISOString()
        };

        const { error } = await supabaseClient
          .from('suppressions')
          .upsert(suppressionData, { onConflict: 'identifier' });

        if (error) {
          console.error('Suppression upsert error:', error);
          return { suppressed: false, error: String(error) };
        }

        return { suppressed: true };
      } catch (err) {
        console.error('applySuppression error:', err);
        return { suppressed: false, error: String(err) };
      }
    },

    /**
     * Check if recording is allowed and log compliance event if blocked
     */
    async requireRecordingConsent(
      action: { type: string; payload?: unknown },
      session: SessionContext
    ): Promise<ConsentCheckResult> {
      const consentResult = validateRecordingConsent(session);

      if (!consentResult.allow) {
        // Log compliance event for audit
        try {
          await supabaseClient.from('compliance_events').insert({
            call_id: session.call_id || session.call_sid || null,
            event_type: 'recording_blocked',
            reason: consentResult.reason || 'no_consent',
            details: {
              action_type: action.type,
              caller_number: session.caller_number ? redactSensitive(session.caller_number) : null,
              session_category: session.call_category
            },
            created_by: 'compliance_middleware',
            created_at: new Date().toISOString()
          });
        } catch (err) {
          // Log error but don't fail the consent check
          console.error('Failed to log compliance event:', err);
        }
      }

      return consentResult;
    },

    /**
     * Check SMS opt-in and log if blocked
     */
    async requireSmsOptIn(
      action: { type: string; recipient?: string },
      session: SessionContext
    ): Promise<{ allow: boolean; reason?: string }> {
      const hasOptIn = validateSmsOptIn(session);

      if (!hasOptIn) {
        try {
          await supabaseClient.from('compliance_events').insert({
            call_id: session.call_id || session.call_sid || null,
            event_type: 'sms_blocked',
            reason: 'no_opt_in',
            details: {
              action_type: action.type,
              recipient: action.recipient ? redactSensitive(action.recipient) : null
            },
            created_by: 'compliance_middleware',
            created_at: new Date().toISOString()
          });
        } catch (err) {
          console.error('Failed to log SMS compliance event:', err);
        }

        return { allow: false, reason: 'sms_opt_in_required' };
      }

      return { allow: true };
    },

    /**
     * Log a general compliance event
     */
    async logComplianceEvent(event: ComplianceEvent): Promise<{ logged: boolean; error?: string }> {
      try {
        const { error } = await supabaseClient.from('compliance_events').insert({
          ...event,
          created_at: event.created_at || new Date().toISOString()
        });

        if (error) {
          console.error('Compliance event log error:', error);
          return { logged: false, error: String(error) };
        }

        return { logged: true };
      } catch (err) {
        console.error('logComplianceEvent error:', err);
        return { logged: false, error: String(err) };
      }
    },

    /**
     * Check if identifier is suppressed
     */
    async isSupressed(identifier: string, type: 'voice' | 'sms'): Promise<boolean> {
      try {
        const { data, error } = await supabaseClient
          .from('suppressions')
          .select('suppressed_voice, suppressed_sms')
          .eq('identifier', identifier);

        if (error || !data || data.length === 0) {
          return false;
        }

        const record = data[0] as { suppressed_voice?: boolean; suppressed_sms?: boolean };
        return type === 'voice' ? !!record.suppressed_voice : !!record.suppressed_sms;
      } catch {
        return false;
      }
    },

    /**
     * Schedule follow-up with quiet hours enforcement
     */
    async scheduleCompliantFollowup(
      session: SessionContext,
      proposedTime: string | Date,
      followupType: 'callback' | 'sms' | 'email'
    ): Promise<{ scheduled_time: string; needs_review: boolean; blocked?: boolean; reason?: string }> {
      // Check suppression first
      if (session.caller_number) {
        const isSuppressed = await this.isSupressed(
          session.caller_number,
          followupType === 'sms' ? 'sms' : 'voice'
        );

        if (isSuppressed) {
          await this.logComplianceEvent({
            call_id: session.call_id || session.call_sid,
            event_type: 'followup_blocked',
            reason: 'contact_suppressed',
            details: { followup_type: followupType },
            created_by: 'compliance_middleware'
          });

          return {
            scheduled_time: '',
            needs_review: true,
            blocked: true,
            reason: 'contact_suppressed'
          };
        }
      }

      // Check SMS opt-in for SMS followups
      if (followupType === 'sms' && !validateSmsOptIn(session)) {
        return {
          scheduled_time: '',
          needs_review: true,
          blocked: true,
          reason: 'sms_opt_in_required'
        };
      }

      // Enforce quiet hours
      const quietHoursResult = enforceQuietHours(proposedTime, session.caller_tz);

      return {
        scheduled_time: quietHoursResult.adjusted_time,
        needs_review: quietHoursResult.needs_review
      };
    }
  };
}

// ============================================================================
// DEFAULT EXPORT (for convenience)
// ============================================================================

export default {
  // Pure utilities
  redactSensitive,
  enforceQuietHours,
  categorizeCall,
  validateRecordingConsent,
  validateSmsOptIn,
  calculateSentiment,
  shouldEscalate,
  buildNoRecordMetadata,
  generateTL247Meta,
  formatTL247MetaBlock,
  // Factory
  createComplianceService
};
