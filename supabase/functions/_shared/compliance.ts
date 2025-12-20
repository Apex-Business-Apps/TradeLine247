/**
 * TL247 Compliance Middleware - Fail-Closed Enforcement Layer
 *
 * This module provides enforcement-grade, fail-closed compliance functions
 * for recording consent, SMS opt-in, quiet hours, suppression, and PII redaction.
 *
 * All functions are pure and unit-testable. Enforcement happens OUTSIDE the LLM.
 *
 * @module _shared/compliance
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SessionContext {
  callSid: string;
  callerE164?: string;
  callerTimezone?: string;
  consentState: 'pending' | 'granted' | 'denied' | 'unknown';
  smsOptIn: 'pending' | 'opted_in' | 'opted_out' | 'unknown';
  jurisdiction?: string;
  recordingMode: 'full' | 'no_record' | 'unknown';
}

export interface ComplianceResult {
  allow: boolean;
  reason?: string;
  action: 'allow' | 'block' | 'adjusted';
  metadata?: Record<string, unknown>;
}

export interface QuietHoursResult {
  adjusted_time: string;
  needs_review: boolean;
  original_time: string;
  reason?: string;
}

export interface SuppressionResult {
  suppressed: boolean;
  reason?: string;
  suppression_type?: 'voice' | 'sms' | 'all';
}

export type CallCategory = 'customer_service' | 'lead_capture' | 'prospect_call';

export interface TL247Meta {
  call_category: CallCategory;
  consent_state: SessionContext['consentState'];
  recording_mode: SessionContext['recordingMode'];
  sentiment: number;
  bant_summary?: string;
  followup_recommendation?: string;
  vision_anchor_flag: boolean;
  needs_review: boolean;
  earliest_followup?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Business quiet hours window (08:00-21:00 local time) */
export const QUIET_HOURS = { start: 8, end: 21 };

/** PII patterns for redaction */
const PII_PATTERNS = [
  // Phone numbers (E.164 and common formats)
  { pattern: /\+\d{10,15}/g, replacement: '[PHONE]' },
  { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, replacement: '[PHONE]' },
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  // Credit card numbers
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD]' },
  // SSN patterns
  { pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, replacement: '[SSN]' },
  // Canadian SIN
  { pattern: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g, replacement: '[SIN]' },
];

/** Keywords indicating lead/prospect intent */
const LEAD_SIGNALS = ['quote', 'estimate', 'pricing', 'cost', 'how much', 'available', 'schedule', 'book', 'appointment'];
const PROSPECT_SIGNALS = ['interested', 'learn more', 'tell me about', 'considering', 'looking for'];

// ============================================================================
// CORE COMPLIANCE FUNCTIONS
// ============================================================================

/**
 * Require explicit recording consent before allowing recording.
 * FAIL-CLOSED: If consent is not 'granted', recording is blocked.
 */
export function requireRecordingConsent(
  action: { type: 'record' },
  session: SessionContext
): ComplianceResult {
  // Fail-closed: only allow if consent is explicitly granted
  if (session.consentState !== 'granted') {
    return {
      allow: false,
      reason: `Recording blocked: consent_state=${session.consentState} (requires 'granted')`,
      action: 'block',
      metadata: {
        consent_state: session.consentState,
        enforcement: 'fail_closed',
      },
    };
  }

  // Consent granted - allow recording
  return {
    allow: true,
    action: 'allow',
    metadata: { consent_state: 'granted' },
  };
}

/**
 * Require explicit SMS opt-in for marketing messages.
 * Transactional messages are allowed without opt-in.
 * FAIL-CLOSED: Marketing SMS blocked unless opt_in is explicit.
 */
export function requireSmsOptIn(
  action: { type: 'sms'; purpose: 'marketing' | 'transactional' },
  session: SessionContext
): ComplianceResult {
  // Transactional SMS always allowed (service confirmations, etc.)
  if (action.purpose === 'transactional') {
    return {
      allow: true,
      action: 'allow',
      metadata: { purpose: 'transactional', opt_in_required: false },
    };
  }

  // Marketing requires explicit opt-in
  if (session.smsOptIn !== 'opted_in') {
    return {
      allow: false,
      reason: `Marketing SMS blocked: sms_opt_in=${session.smsOptIn} (requires 'opted_in')`,
      action: 'block',
      metadata: {
        sms_opt_in: session.smsOptIn,
        purpose: 'marketing',
        enforcement: 'fail_closed',
      },
    };
  }

  return {
    allow: true,
    action: 'allow',
    metadata: { purpose: 'marketing', opt_in: 'confirmed' },
  };
}

/**
 * Enforce US outbound quiet hours (08:00-21:00 local time).
 * If timezone unknown, schedules for next business day 10:00 in business TZ.
 */
export function enforceQuietHours(
  proposedTime: string | Date,
  callerTz?: string,
  window: { start: number; end: number } = QUIET_HOURS
): QuietHoursResult {
  const proposed = typeof proposedTime === 'string' ? new Date(proposedTime) : proposedTime;
  const originalTime = proposed.toISOString();

  // If timezone is unknown, schedule for next business day at 10:00 in business TZ
  if (!callerTz || callerTz === 'unknown') {
    const nextBusinessDay = getNextBusinessDay(proposed);
    nextBusinessDay.setHours(10, 0, 0, 0);

    return {
      adjusted_time: nextBusinessDay.toISOString(),
      needs_review: true,
      original_time: originalTime,
      reason: 'Timezone unknown - scheduled for next business day 10:00, requires review',
    };
  }

  // Get local hour in caller's timezone
  let localHour: number;
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: callerTz,
      hour: 'numeric',
      hour12: false,
    });
    localHour = parseInt(formatter.format(proposed), 10);
  } catch {
    // Invalid timezone - fall back to safe default
    const nextBusinessDay = getNextBusinessDay(proposed);
    nextBusinessDay.setHours(10, 0, 0, 0);

    return {
      adjusted_time: nextBusinessDay.toISOString(),
      needs_review: true,
      original_time: originalTime,
      reason: `Invalid timezone '${callerTz}' - scheduled for next business day 10:00`,
    };
  }

  // Check if within quiet hours window
  if (localHour >= window.start && localHour < window.end) {
    // Within allowed window
    return {
      adjusted_time: originalTime,
      needs_review: false,
      original_time: originalTime,
    };
  }

  // Outside quiet hours - adjust to next allowed time
  const adjusted = new Date(proposed);

  if (localHour < window.start) {
    // Before start - push to start of same day
    adjusted.setHours(window.start, 0, 0, 0);
  } else {
    // After end - push to start of next day
    adjusted.setDate(adjusted.getDate() + 1);
    adjusted.setHours(window.start, 0, 0, 0);
  }

  return {
    adjusted_time: adjusted.toISOString(),
    needs_review: false,
    original_time: originalTime,
    reason: `Adjusted from ${localHour}:00 to ${window.start}:00 (quiet hours enforcement)`,
  };
}

/**
 * Apply suppression (DNC) rules for voice or SMS.
 * Returns suppressed=true if the identifier is on the suppression list.
 */
export async function applySuppression(
  optOut: { type: 'voice' | 'sms'; identifier: string },
  dncStatus?: { suppressed: boolean; type?: 'voice' | 'sms' | 'all' }
): Promise<SuppressionResult> {
  // If DNC status provided, use it directly
  if (dncStatus?.suppressed) {
    return {
      suppressed: true,
      reason: `Identifier on suppression list (type: ${dncStatus.type || 'unknown'})`,
      suppression_type: dncStatus.type,
    };
  }

  // No suppression found
  return {
    suppressed: false,
  };
}

/**
 * Redact sensitive PII from text for safe logging/storage.
 * This is a synchronous, pure function.
 */
export function redactSensitive(text: string): string {
  if (!text) return text;

  let redacted = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }

  return redacted;
}

/**
 * Categorize call based on intent signals.
 * Returns one of: 'customer_service' | 'lead_capture' | 'prospect_call'
 */
export function categorizeCall(
  intentSignals: { transcript?: string; keywords?: string[]; isExistingCustomer?: boolean }
): CallCategory {
  const text = (intentSignals.transcript || '').toLowerCase();
  const keywords = intentSignals.keywords || [];

  // Existing customer → customer_service
  if (intentSignals.isExistingCustomer) {
    return 'customer_service';
  }

  // Check for lead signals (quote, estimate, booking)
  const hasLeadSignal = LEAD_SIGNALS.some(signal =>
    text.includes(signal) || keywords.some(k => k.toLowerCase().includes(signal))
  );
  if (hasLeadSignal) {
    return 'lead_capture';
  }

  // Check for prospect signals (early interest)
  const hasProspectSignal = PROSPECT_SIGNALS.some(signal =>
    text.includes(signal) || keywords.some(k => k.toLowerCase().includes(signal))
  );
  if (hasProspectSignal) {
    return 'prospect_call';
  }

  // Default to customer_service
  return 'customer_service';
}

/**
 * Determine recording mode based on consent state.
 * FAIL-CLOSED: If consent is not granted, return 'no_record'.
 */
export function determineRecordingMode(
  consentState: SessionContext['consentState'],
  jurisdictionKnown: boolean = true
): SessionContext['recordingMode'] {
  // Fail-closed: require explicit consent AND known jurisdiction
  if (consentState === 'granted' && jurisdictionKnown) {
    return 'full';
  }

  // Any uncertainty → no_record mode
  return 'no_record';
}

/**
 * Build NO-RECORD mode metadata (only allowed fields).
 * This is what we persist when consent is not granted.
 */
export function buildNoRecordMetadata(session: SessionContext, callData: {
  callerIdName?: string;
  callerIdNumber?: string;
  callCategory: CallCategory;
  redactedSummary?: string;
  earliestFollowup?: string;
  needsReview?: boolean;
}): Record<string, unknown> {
  return {
    caller_id_name: callData.callerIdName || null,
    caller_id_number: callData.callerIdNumber || null, // Publicly available from CNAM
    call_category: callData.callCategory,
    consent_state: session.consentState,
    recording_mode: 'no_record',
    redacted_summary: callData.redactedSummary || null,
    earliest_followup: callData.earliestFollowup || null,
    needs_review: callData.needsReview ?? false,
    event_log: [], // Compliance events only, no transcript
  };
}

/**
 * Create a TL247_META block for emission (not spoken).
 */
export function createTL247Meta(
  session: SessionContext,
  data: Partial<TL247Meta>
): TL247Meta {
  return {
    call_category: data.call_category || 'customer_service',
    consent_state: session.consentState,
    recording_mode: session.recordingMode,
    sentiment: data.sentiment ?? 0,
    bant_summary: data.bant_summary,
    followup_recommendation: data.followup_recommendation,
    vision_anchor_flag: data.vision_anchor_flag ?? false,
    needs_review: data.needs_review ?? false,
    earliest_followup: data.earliest_followup,
  };
}

/**
 * Serialize TL247_META to the required format.
 */
export function serializeTL247Meta(meta: TL247Meta): string {
  return `<TL247_META>${JSON.stringify(meta)}</TL247_META>`;
}

/**
 * Parse TL247_META from response text.
 */
export function parseTL247Meta(text: string): TL247Meta | null {
  const match = text.match(/<TL247_META>(.*?)<\/TL247_META>/s);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as TL247Meta;
  } catch {
    return null;
  }
}

/**
 * Log a compliance event for audit trail.
 */
export function createComplianceEvent(
  eventType: 'consent_captured' | 'consent_denied' | 'recording_blocked' | 'sms_blocked' |
             'quiet_hours_adjusted' | 'suppression_applied' | 'opt_out_received' | 'vision_anchor_detected',
  session: SessionContext,
  metadata?: Record<string, unknown>
): {
  event_type: string;
  call_sid: string;
  timestamp: string;
  metadata: Record<string, unknown>;
} {
  return {
    event_type: eventType,
    call_sid: session.callSid,
    timestamp: new Date().toISOString(),
    metadata: {
      consent_state: session.consentState,
      recording_mode: session.recordingMode,
      ...metadata,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the next business day (skips weekends).
 */
function getNextBusinessDay(from: Date): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + 1);

  // Skip weekends
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * Check if a given hour is within quiet hours window.
 */
export function isWithinQuietHours(
  hour: number,
  window: { start: number; end: number } = QUIET_HOURS
): boolean {
  return hour >= window.start && hour < window.end;
}

/**
 * Validate E.164 phone number format.
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Extract timezone from phone number area code (US/Canada basic mapping).
 * Returns undefined if unknown.
 */
export function inferTimezoneFromAreaCode(e164: string): string | undefined {
  if (!e164.startsWith('+1')) return undefined;

  const areaCode = e164.slice(2, 5);

  // Basic US/Canada timezone mapping by area code ranges
  // This is a simplified mapping - production would use a full database
  const timezoneMap: Record<string, string> = {
    // Eastern
    '212': 'America/New_York', '718': 'America/New_York', '917': 'America/New_York',
    '416': 'America/Toronto', '647': 'America/Toronto', '437': 'America/Toronto',
    // Central
    '312': 'America/Chicago', '773': 'America/Chicago',
    '204': 'America/Winnipeg',
    // Mountain
    '303': 'America/Denver', '720': 'America/Denver',
    '403': 'America/Edmonton', '587': 'America/Edmonton', '780': 'America/Edmonton',
    // Pacific
    '206': 'America/Los_Angeles', '213': 'America/Los_Angeles', '310': 'America/Los_Angeles',
    '604': 'America/Vancouver', '778': 'America/Vancouver', '236': 'America/Vancouver',
  };

  return timezoneMap[areaCode];
}
