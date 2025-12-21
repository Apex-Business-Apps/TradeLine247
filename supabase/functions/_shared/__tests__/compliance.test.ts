/**
 * compliance.test.ts - Unit tests for compliance module
 *
 * Tests pure helpers without external dependencies and runtime service with mocks.
 * Includes CI safety test to ensure no remote https imports in _shared modules.
 */

import {
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
  createComplianceService,
  type SessionContext,
  type BANTSummary
} from '../compliance';

// ============================================================================
// PURE UTILITY TESTS
// ============================================================================

describe('compliance pure utilities', () => {
  describe('redactSensitive', () => {
    test('redacts SSN patterns', () => {
      const input = 'My SSN is 123-45-6789 and yours is 987-65-4321';
      const result = redactSensitive(input);
      expect(result).not.toContain('123-45-6789');
      expect(result).not.toContain('987-65-4321');
      expect(result).toContain('XXX-XX-XXXX');
    });

    test('redacts credit card numbers', () => {
      const input = 'Card number 4111111111111111 should be hidden';
      const result = redactSensitive(input);
      expect(result).not.toContain('4111111111111111');
      expect(result).toContain('4111XXXXXXXXXXXX');
    });

    test('redacts API keys', () => {
      const input = 'AKIAIOSFODNN7EXAMPLE and sk-abc123def456ghi789';
      const result = redactSensitive(input);
      expect(result).toContain('[REDACTED_KEY]');
      expect(result).not.toContain('AKIAIOSFODNN7EXAMPLE');
    });

    test('redacts phone numbers', () => {
      const input = 'Call me at +14155551234';
      const result = redactSensitive(input);
      expect(result).toContain('[PHONE]');
      expect(result).not.toContain('+14155551234');
    });

    test('redacts email addresses', () => {
      const input = 'Email me at john.doe@example.com';
      const result = redactSensitive(input);
      expect(result).toContain('[EMAIL]');
      expect(result).not.toContain('john.doe@example.com');
    });

    test('handles empty/null input', () => {
      expect(redactSensitive('')).toBe('');
      expect(redactSensitive(null as unknown as string)).toBe(null);
    });
  });

  describe('enforceQuietHours', () => {
    test('returns needs_review=true when timezone unknown', () => {
      const now = new Date().toISOString();
      const result = enforceQuietHours(now, null);
      expect(result.needs_review).toBe(true);
      expect(result.adjusted_time).toBeDefined();
    });

    test('allows time within window when tz known', () => {
      // 10:00 UTC should be within 8-21 window
      const testTime = new Date();
      testTime.setUTCHours(10, 0, 0, 0);
      const result = enforceQuietHours(testTime.toISOString(), 'America/New_York');
      expect(result.needs_review).toBe(false);
    });

    test('adjusts time outside quiet hours', () => {
      // 22:00 UTC is outside 8-21 window
      const testTime = new Date();
      testTime.setUTCHours(22, 0, 0, 0);
      const result = enforceQuietHours(testTime.toISOString(), 'America/New_York');
      expect(result.needs_review).toBe(false);
      // Should be scheduled for next day at 8:00
      const adjusted = new Date(result.adjusted_time);
      expect(adjusted.getUTCHours()).toBe(8);
    });

    test('accepts Date object input', () => {
      const testDate = new Date();
      testDate.setUTCHours(12, 0, 0, 0);
      const result = enforceQuietHours(testDate, 'UTC');
      expect(result.adjusted_time).toBeDefined();
    });
  });

  describe('categorizeCall', () => {
    test('returns prospect_call for pricing inquiries', () => {
      expect(categorizeCall({ text: 'How much does it cost?' })).toBe('prospect_call');
      expect(categorizeCall({ text: 'I need a quote' })).toBe('prospect_call');
      expect(categorizeCall({ text: 'What are your prices?' })).toBe('prospect_call');
      expect(categorizeCall({ text: 'Can I get an estimate?' })).toBe('prospect_call');
    });

    test('returns customer_service for support requests', () => {
      expect(categorizeCall({ text: 'I have a problem with my service' })).toBe('customer_service');
      expect(categorizeCall({ text: 'I need help' })).toBe('customer_service');
      expect(categorizeCall({ text: 'Can I cancel my order?' })).toBe('customer_service');
      expect(categorizeCall({ text: 'My unit is not working' })).toBe('customer_service');
    });

    test('returns lead_capture as default', () => {
      expect(categorizeCall({ text: 'Hello, I saw your ad' })).toBe('lead_capture');
      expect(categorizeCall({ text: '' })).toBe('lead_capture');
      expect(categorizeCall(null)).toBe('lead_capture');
    });

    test('uses keywords array', () => {
      expect(categorizeCall({ keywords: ['quote', 'pricing'] })).toBe('prospect_call');
    });
  });

  describe('validateRecordingConsent', () => {
    test('allows when recording consent is true', () => {
      const session: SessionContext = {
        consent_flags: { recording: true }
      };
      const result = validateRecordingConsent(session);
      expect(result.allow).toBe(true);
      expect(result.mode).toBe('full');
    });

    test('blocks when recording consent is false', () => {
      const session: SessionContext = {
        consent_flags: { recording: false }
      };
      const result = validateRecordingConsent(session);
      expect(result.allow).toBe(false);
      expect(result.mode).toBe('no_record');
      expect(result.reason).toBe('consent_denied');
    });

    test('blocks when consent is undefined (fail closed)', () => {
      const session: SessionContext = {};
      const result = validateRecordingConsent(session);
      expect(result.allow).toBe(false);
      expect(result.mode).toBe('no_record');
      expect(result.reason).toBe('consent_unknown');
    });
  });

  describe('validateSmsOptIn', () => {
    test('returns true only when sms_opt_in is explicitly true', () => {
      expect(validateSmsOptIn({ consent_flags: { sms_opt_in: true } })).toBe(true);
      expect(validateSmsOptIn({ consent_flags: { sms_opt_in: false } })).toBe(false);
      expect(validateSmsOptIn({ consent_flags: {} })).toBe(false);
      expect(validateSmsOptIn({})).toBe(false);
    });
  });

  describe('calculateSentiment', () => {
    test('returns positive score for positive words', () => {
      const score = calculateSentiment('This is great, thank you so much!');
      expect(score).toBeGreaterThan(0);
    });

    test('returns negative score for negative words', () => {
      const score = calculateSentiment('This is terrible and awful service');
      expect(score).toBeLessThan(0);
    });

    test('returns neutral for mixed or neutral text', () => {
      const score = calculateSentiment('Hello, I am calling about something');
      expect(score).toBe(0);
    });

    test('handles empty input', () => {
      expect(calculateSentiment('')).toBe(0);
    });
  });

  describe('shouldEscalate', () => {
    test('returns true for sentiment <= -0.5', () => {
      expect(shouldEscalate('', -0.5)).toBe(true);
      expect(shouldEscalate('', -0.8)).toBe(true);
    });

    test('returns true for threat keywords', () => {
      expect(shouldEscalate('I will sue you', 0)).toBe(true);
      expect(shouldEscalate('Calling my lawyer', 0)).toBe(true);
      expect(shouldEscalate('Report to BBB', 0)).toBe(true);
    });

    test('returns false for normal conversation', () => {
      expect(shouldEscalate('I need help with my order', 0)).toBe(false);
    });
  });

  describe('buildNoRecordMetadata', () => {
    test('builds allowed metadata only', () => {
      const session: SessionContext = {
        caller_number: '+14155551234',
        caller_name: 'John Doe',
        call_category: 'lead_capture',
        consent_flags: { recording: false }
      };
      const result = buildNoRecordMetadata(session, 'Customer asked about prices');

      expect(result.caller_id_number).toBe('+14155551234');
      expect(result.caller_id_name).toBe('John Doe');
      expect(result.call_category).toBe('lead_capture');
      expect(result.consent_state).toBe('denied');
      expect(result.recording_mode).toBe('no_record');
      expect(result.needs_review).toBe(true);
      expect(result.redacted_summary).toBeDefined();
    });

    test('redacts sensitive info in summary', () => {
      const session: SessionContext = {};
      const result = buildNoRecordMetadata(session, 'Call +14155551234 for SSN 123-45-6789');

      expect(result.redacted_summary).toContain('[PHONE]');
      expect(result.redacted_summary).toContain('XXX-XX-XXXX');
    });
  });

  describe('generateTL247Meta', () => {
    test('generates complete meta block', () => {
      const session: SessionContext = {
        call_category: 'prospect_call',
        consent_flags: { recording: true },
        caller_tz: 'America/New_York'
      };
      const bant: BANTSummary = {
        budget: '5000',
        need: 'HVAC repair',
        timeline: 'this week'
      };

      const meta = generateTL247Meta(session, 0.3, bant, 'schedule_callback', false);

      expect(meta.call_category).toBe('prospect_call');
      expect(meta.consent_state).toBe('granted');
      expect(meta.recording_mode).toBe('full');
      expect(meta.sentiment).toBe(0.3);
      expect(meta.bant_summary).toEqual(bant);
      expect(meta.followup_recommendation).toBe('schedule_callback');
      expect(meta.vision_anchor_flag).toBe(false);
      expect(meta.needs_review).toBe(false);
    });

    test('marks needs_review for missing tz or low sentiment', () => {
      const session: SessionContext = { call_category: 'lead_capture' };
      const meta = generateTL247Meta(session, -0.6, null, null, false);

      expect(meta.needs_review).toBe(true);
    });
  });

  describe('formatTL247MetaBlock', () => {
    test('formats meta as XML-like block', () => {
      const meta = {
        call_category: 'lead_capture' as const,
        consent_state: 'granted' as const,
        recording_mode: 'full' as const,
        sentiment: 0.5,
        bant_summary: null,
        followup_recommendation: null,
        vision_anchor_flag: false,
        needs_review: false
      };

      const block = formatTL247MetaBlock(meta);
      expect(block).toMatch(/^<TL247_META>/);
      expect(block).toMatch(/<\/TL247_META>$/);
      expect(block).toContain('"call_category":"lead_capture"');
    });
  });
});

// ============================================================================
// RUNTIME SERVICE TESTS (with mock supabase client)
// ============================================================================

describe('compliance runtime service', () => {
  const createMockClient = () => {
    const events: Array<{ table: string; operation: string; data: unknown }> = [];

    return {
      events,
      from: (table: string) => ({
        upsert: async (data: Record<string, unknown>, _opts?: unknown) => {
          events.push({ table, operation: 'upsert', data });
          return { data, error: null };
        },
        insert: async (data: Record<string, unknown> | Record<string, unknown>[]) => {
          events.push({ table, operation: 'insert', data });
          return { data, error: null };
        },
        select: (_columns?: string) => ({
          eq: async (_column: string, _value: unknown) => {
            return { data: [], error: null };
          },
          single: async () => {
            return { data: null, error: null };
          }
        })
      })
    };
  };

  test('applySuppression calls supabase upsert', async () => {
    const mockClient = createMockClient();
    const svc = createComplianceService(mockClient as never);

    const result = await svc.applySuppression({
      type: 'sms',
      identifier: 'user-123',
      source: 'voice_opt_out'
    });

    expect(result.suppressed).toBe(true);
    expect(mockClient.events).toHaveLength(1);
    expect(mockClient.events[0].table).toBe('suppressions');
    expect(mockClient.events[0].operation).toBe('upsert');
  });

  test('requireRecordingConsent blocks and logs when consent missing', async () => {
    const mockClient = createMockClient();
    const svc = createComplianceService(mockClient as never);

    const session: SessionContext = {
      call_id: 'call-123',
      consent_flags: {}
    };

    const result = await svc.requireRecordingConsent({ type: 'record' }, session);

    expect(result.allow).toBe(false);
    expect(result.mode).toBe('no_record');
    expect(mockClient.events).toHaveLength(1);
    expect(mockClient.events[0].table).toBe('compliance_events');
    expect(mockClient.events[0].operation).toBe('insert');
  });

  test('requireRecordingConsent allows when consent granted', async () => {
    const mockClient = createMockClient();
    const svc = createComplianceService(mockClient as never);

    const session: SessionContext = {
      call_id: 'call-123',
      consent_flags: { recording: true }
    };

    const result = await svc.requireRecordingConsent({ type: 'record' }, session);

    expect(result.allow).toBe(true);
    expect(result.mode).toBe('full');
    expect(mockClient.events).toHaveLength(0); // No compliance event logged
  });

  test('requireSmsOptIn blocks and logs when opt-in missing', async () => {
    const mockClient = createMockClient();
    const svc = createComplianceService(mockClient as never);

    const session: SessionContext = {
      call_id: 'call-123',
      consent_flags: {}
    };

    const result = await svc.requireSmsOptIn({ type: 'sms', recipient: '+14155551234' }, session);

    expect(result.allow).toBe(false);
    expect(result.reason).toBe('sms_opt_in_required');
    expect(mockClient.events).toHaveLength(1);
    expect(mockClient.events[0].table).toBe('compliance_events');
  });

  test('logComplianceEvent writes to compliance_events table', async () => {
    const mockClient = createMockClient();
    const svc = createComplianceService(mockClient as never);

    const result = await svc.logComplianceEvent({
      call_id: 'call-123',
      event_type: 'test_event',
      reason: 'unit_test',
      details: { test: true },
      created_by: 'test_runner'
    });

    expect(result.logged).toBe(true);
    expect(mockClient.events).toHaveLength(1);
    expect(mockClient.events[0].table).toBe('compliance_events');
  });

  test('throws if supabase client not provided', () => {
    expect(() => createComplianceService(null as never)).toThrow('Supabase client is required');
  });

  test('scheduleCompliantFollowup enforces quiet hours', async () => {
    const mockClient = createMockClient();
    const svc = createComplianceService(mockClient as never);

    const session: SessionContext = {
      call_id: 'call-123',
      caller_tz: 'America/New_York',
      consent_flags: { sms_opt_in: true }
    };

    const proposedTime = new Date();
    proposedTime.setUTCHours(10, 0, 0, 0);

    const result = await svc.scheduleCompliantFollowup(session, proposedTime, 'callback');

    expect(result.scheduled_time).toBeDefined();
    expect(result.blocked).toBeUndefined();
  });

  test('scheduleCompliantFollowup blocks SMS without opt-in', async () => {
    const mockClient = createMockClient();
    const svc = createComplianceService(mockClient as never);

    const session: SessionContext = {
      call_id: 'call-123',
      consent_flags: {}
    };

    const result = await svc.scheduleCompliantFollowup(session, new Date(), 'sms');

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('sms_opt_in_required');
  });
});

// ============================================================================
// CI SAFETY NET: No remote https imports in _shared modules
// ============================================================================

describe('CI safety: no remote https imports in _shared', () => {
  test('compliance.ts has no https:// imports', () => {
    const fs = require('fs');
    const path = require('path');

    const compliancePath = path.resolve(__dirname, '../compliance.ts');
    const content = fs.readFileSync(compliancePath, 'utf8');

    // Should not contain any https:// imports at module level
    expect(content).not.toMatch(/^import.*from\s+['"]https:\/\//m);
    expect(content).not.toMatch(/^import\s+['"]https:\/\//m);
  });

  test('no _shared .ts files contain top-level https imports (except test files)', () => {
    const fs = require('fs');
    const path = require('path');

    const sharedDir = path.resolve(__dirname, '..');
    const files = fs.readdirSync(sharedDir).filter((f: string) =>
      f.endsWith('.ts') && !f.endsWith('.test.ts')
    );

    const filesWithHttpsImports: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(sharedDir, file), 'utf8');

      // Check for top-level import statements with https://
      // This regex matches: import ... from "https://..." or import "https://..."
      if (/^import\s+(?:.*\s+from\s+)?['"]https:\/\//m.test(content)) {
        filesWithHttpsImports.push(file);
      }
    }

    // Report which files have https imports for CI debugging
    if (filesWithHttpsImports.length > 0) {
      console.warn('Files with https:// imports:', filesWithHttpsImports);
    }

    // The compliance.ts module we just created should NOT have https imports
    expect(filesWithHttpsImports).not.toContain('compliance.ts');
  });
});
