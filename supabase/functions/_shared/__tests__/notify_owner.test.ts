/**
 * notify_owner.test.ts - Unit tests for owner notification module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  formatSubject,
  formatEmailBody,
  formatEmailBodyPlain,
  isNotificationEnabled,
  createNotifyOwnerService,
  DEFAULT_FROM_EMAIL,
  NOTIFICATION_COOLDOWN_SECONDS,
  type OwnerNotificationPayload,
  type NotificationEventType
} from '../notify_owner.ts';

describe('notify_owner pure utilities', () => {
  describe('formatSubject', () => {
    it('formats basic subject', () => {
      const subject = formatSubject('warranty_risk_detected');
      expect(subject).toBe('[TradeLine 24/7] Warranty Risk Detected');
    });

    it('adds urgent prefix', () => {
      const subject = formatSubject('escalation_required', 'urgent');
      expect(subject).toContain('URGENT');
    });

    it('adds warning emoji for high priority', () => {
      const subject = formatSubject('negative_sentiment', 'high');
      expect(subject).toContain('⚠️');
    });

    it('handles all event types', () => {
      const eventTypes: NotificationEventType[] = [
        'warranty_risk_detected',
        'escalation_required',
        'high_value_lead',
        'negative_sentiment',
        'opt_out_received',
        'compliance_event',
        'call_summary'
      ];

      for (const eventType of eventTypes) {
        const subject = formatSubject(eventType);
        expect(subject).toContain('[TradeLine 24/7]');
        expect(subject.length).toBeGreaterThan(20);
      }
    });
  });

  describe('formatEmailBody', () => {
    it('generates HTML email body', () => {
      const payload: OwnerNotificationPayload = {
        event_type: 'warranty_risk_detected',
        call_id: 'call-123',
        needs_review: true,
        redacted_summary: 'Potential warranty issue detected'
      };

      const html = formatEmailBody(payload);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('TradeLine 24/7');
      expect(html).toContain('call-123');
      expect(html).toContain('warranty issue');
    });

    it('includes priority badge for urgent', () => {
      const payload: OwnerNotificationPayload = {
        event_type: 'escalation_required',
        needs_review: true,
        priority: 'urgent'
      };

      const html = formatEmailBody(payload);
      expect(html).toContain('URGENT');
    });

    it('shows consent state', () => {
      const payload: OwnerNotificationPayload = {
        event_type: 'call_summary',
        consent_state: 'granted',
        needs_review: false
      };

      const html = formatEmailBody(payload);
      expect(html).toContain('Granted');
    });
  });

  describe('formatEmailBodyPlain', () => {
    it('generates plain text email body', () => {
      const payload: OwnerNotificationPayload = {
        event_type: 'high_value_lead',
        call_id: 'call-456',
        category: 'prospect_call',
        needs_review: true
      };

      const text = formatEmailBodyPlain(payload);

      expect(text).toContain('TradeLine 24/7');
      expect(text).toContain('HIGH VALUE LEAD');
      expect(text).toContain('call-456');
      expect(text).toContain('prospect_call');
    });
  });

  describe('isNotificationEnabled', () => {
    it('returns true when no flags set', () => {
      expect(isNotificationEnabled('warranty_risk_detected', {})).toBe(true);
    });

    it('returns false when globally disabled', () => {
      expect(isNotificationEnabled('warranty_risk_detected', {
        OWNER_NOTIFY_DISABLED: 'true'
      })).toBe(false);
    });

    it('returns false when event-specific flag is false', () => {
      expect(isNotificationEnabled('warranty_risk_detected', {
        NOTIFY_WARRANTY_RISK: 'false'
      })).toBe(false);
    });

    it('returns true when event-specific flag is true', () => {
      expect(isNotificationEnabled('escalation_required', {
        NOTIFY_ESCALATION: 'true'
      })).toBe(true);
    });

    it('respects global disable over event flags', () => {
      expect(isNotificationEnabled('high_value_lead', {
        OWNER_NOTIFY_DISABLED: 'true',
        NOTIFY_HIGH_VALUE_LEAD: 'true'
      })).toBe(false);
    });
  });

  describe('constants', () => {
    it('DEFAULT_FROM_EMAIL is valid email format', () => {
      expect(DEFAULT_FROM_EMAIL).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
    });

    it('NOTIFICATION_COOLDOWN_SECONDS is reasonable', () => {
      expect(NOTIFICATION_COOLDOWN_SECONDS).toBeGreaterThan(60);
      expect(NOTIFICATION_COOLDOWN_SECONDS).toBeLessThan(3600);
    });
  });
});

describe('notify_owner runtime service', () => {
  // Store original Deno reference
  let originalDeno: unknown;

  beforeEach(() => {
    originalDeno = (globalThis as Record<string, unknown>).Deno;
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>).Deno = originalDeno;
  });

  const createMockClient = (recentNotifications: unknown[] = []) => {
    const events: Array<{ type: string; data: unknown }> = [];

    return {
      events,
      from: (table: string) => ({
        insert: async (data: unknown) => {
          events.push({ type: 'insert', data: { table, payload: data } });
          return { data, error: null };
        },
        select: (_columns?: string) => ({
          eq: (_col: string, _val: unknown) => ({
            // Support chained .eq().gte() pattern
            eq: (_col2: string, _val2: unknown) => ({
              gte: async (_col3: string, _val3: unknown) => {
                return { data: recentNotifications, error: null };
              }
            }),
            gte: async (_col2: string, _val2: unknown) => {
              return { data: recentNotifications, error: null };
            }
          })
        })
      })
    };
  };

  const setupDenoMock = (ownerEmail?: string) => {
    (globalThis as Record<string, unknown>).Deno = {
      env: {
        get: (key: string) => {
          if (key === 'OWNER_NOTIFY_EMAIL') return ownerEmail;
          return undefined;
        }
      }
    };
  };

  const createMockEmailProvider = () => {
    const sentEmails: unknown[] = [];
    return {
      sentEmails,
      send: async (options: unknown) => {
        sentEmails.push(options);
        return { data: { id: 'msg-123' }, error: null };
      }
    };
  };

  it('returns no_owner_email_configured when email not set', async () => {
    setupDenoMock(undefined); // No owner email

    const mockClient = createMockClient();
    const mockEmail = createMockEmailProvider();
    const svc = createNotifyOwnerService(mockClient as never, mockEmail);

    const result = await svc.sendNotification({
      event_type: 'warranty_risk_detected',
      call_id: 'call-123',
      needs_review: true
    });

    expect(result.sent).toBe(false);
    expect(result.error).toBe('no_owner_email_configured');
  });

  it('respects cooldown when recent notifications exist', async () => {
    setupDenoMock('owner@test.com');

    const mockClient = createMockClient([{ id: 'existing-notification' }]);
    const mockEmail = createMockEmailProvider();
    const svc = createNotifyOwnerService(mockClient as never, mockEmail);

    const result = await svc.sendNotification({
      event_type: 'warranty_risk_detected',
      call_id: 'call-123',
      needs_review: true
    });

    expect(result.sent).toBe(false);
    expect(result.error).toBe('cooldown_active');
  });

  it('sends email when provider available and owner email set', async () => {
    setupDenoMock('owner@test.com');

    const mockClient = createMockClient();
    const mockEmail = createMockEmailProvider();
    const svc = createNotifyOwnerService(mockClient as never, mockEmail);

    const result = await svc.sendNotification({
      event_type: 'high_value_lead',
      call_id: 'call-456',
      needs_review: false
    });

    expect(result.sent).toBe(true);
    expect(mockEmail.sentEmails.length).toBe(1);

    const insertEvents = mockClient.events.filter(e => e.type === 'insert');
    expect(insertEvents.length).toBeGreaterThan(0);
  });

  it('notifyWarrantyRisk sends with high priority', async () => {
    setupDenoMock('owner@test.com');

    const mockClient = createMockClient();
    const mockEmail = createMockEmailProvider();
    const svc = createNotifyOwnerService(mockClient as never, mockEmail);

    const result = await svc.notifyWarrantyRisk('call-789', 'Old equipment detected');

    expect(result.sent).toBe(true);
    expect(mockEmail.sentEmails.length).toBe(1);
  });

  it('throws if supabase client not provided', () => {
    expect(() => createNotifyOwnerService(null as never)).toThrow('Supabase client is required');
  });
});
