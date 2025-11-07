/**
 * Unit Tests: Consent Management
 *
 * Tests GDPR, CASL, TCPA, PIPEDA compliance logic
 */

import { describe, it, expect } from 'vitest';

// Consent types as per compliance requirements
type ConsentType =
  | 'marketing_email'
  | 'marketing_sms'
  | 'marketing_phone'
  | 'data_processing'
  | 'credit_check'
  | 'esign'
  | 'tcpa'
  | 'casl';

interface ConsentRecord {
  type: ConsentType;
  granted: boolean;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  jurisdiction: 'CA' | 'US' | 'EU' | 'other';
}

// Consent validation functions
function isConsentValid(consent: ConsentRecord): boolean {
  // Must be explicitly granted
  if (!consent.granted) return false;

  // Must have timestamp
  if (!consent.timestamp) return false;

  // Must not be expired (2 years for GDPR/PIPEDA)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  if (consent.timestamp < twoYearsAgo) return false;

  // EU: Must have IP address for audit trail
  if (consent.jurisdiction === 'EU' && !consent.ipAddress) return false;

  return true;
}

function canSendMarketingEmail(consents: ConsentRecord[]): boolean {
  const emailConsent = consents.find(c => c.type === 'marketing_email');
  return emailConsent ? isConsentValid(emailConsent) : false;
}

function canSendMarketingSMS(consents: ConsentRecord[]): boolean {
  const smsConsent = consents.find(c => c.type === 'marketing_sms');

  // TCPA (US): Requires explicit consent for SMS
  const tcpaConsent = consents.find(c => c.type === 'tcpa');

  // CASL (Canada): Requires explicit consent for commercial messages
  const caslConsent = consents.find(c => c.type === 'casl');

  // Need both marketing SMS consent AND applicable regulatory consent
  if (!smsConsent || !isConsentValid(smsConsent)) return false;

  // Check jurisdiction-specific requirements
  const jurisdiction = smsConsent.jurisdiction;
  if (jurisdiction === 'US' && (!tcpaConsent || !isConsentValid(tcpaConsent))) {
    return false;
  }
  if (jurisdiction === 'CA' && (!caslConsent || !isConsentValid(caslConsent))) {
    return false;
  }

  return true;
}

function requiresDoubleOptIn(consentType: ConsentType, jurisdiction: string): boolean {
  // EU: GDPR requires double opt-in for marketing
  if (jurisdiction === 'EU' && consentType.startsWith('marketing_')) {
    return true;
  }

  // Canada: CASL recommends double opt-in
  if (jurisdiction === 'CA' && consentType === 'casl') {
    return true;
  }

  return false;
}

describe('Consent Validation', () => {
  it('should validate granted consent with timestamp', () => {
    const consent: ConsentRecord = {
      type: 'marketing_email',
      granted: true,
      timestamp: new Date(),
      jurisdiction: 'US',
    };

    expect(isConsentValid(consent)).toBe(true);
  });

  it('should reject consent without explicit grant', () => {
    const consent: ConsentRecord = {
      type: 'marketing_email',
      granted: false,
      timestamp: new Date(),
      jurisdiction: 'US',
    };

    expect(isConsentValid(consent)).toBe(false);
  });

  it('should reject expired consent (older than 2 years)', () => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const consent: ConsentRecord = {
      type: 'marketing_email',
      granted: true,
      timestamp: threeYearsAgo,
      jurisdiction: 'US',
    };

    expect(isConsentValid(consent)).toBe(false);
  });

  it('should require IP address for EU consents', () => {
    const euConsentWithoutIP: ConsentRecord = {
      type: 'marketing_email',
      granted: true,
      timestamp: new Date(),
      jurisdiction: 'EU',
      // Missing ipAddress
    };

    expect(isConsentValid(euConsentWithoutIP)).toBe(false);

    const euConsentWithIP: ConsentRecord = {
      ...euConsentWithoutIP,
      ipAddress: '192.168.1.1',
    };

    expect(isConsentValid(euConsentWithIP)).toBe(true);
  });
});

describe('Marketing Communications - Email', () => {
  it('should allow email marketing with valid consent', () => {
    const consents: ConsentRecord[] = [
      {
        type: 'marketing_email',
        granted: true,
        timestamp: new Date(),
        jurisdiction: 'US',
      },
    ];

    expect(canSendMarketingEmail(consents)).toBe(true);
  });

  it('should block email marketing without consent', () => {
    const consents: ConsentRecord[] = [];
    expect(canSendMarketingEmail(consents)).toBe(false);
  });

  it('should block email marketing with expired consent', () => {
    const expiredDate = new Date();
    expiredDate.setFullYear(expiredDate.getFullYear() - 3);

    const consents: ConsentRecord[] = [
      {
        type: 'marketing_email',
        granted: true,
        timestamp: expiredDate,
        jurisdiction: 'US',
      },
    ];

    expect(canSendMarketingEmail(consents)).toBe(false);
  });
});

describe('Marketing Communications - SMS (TCPA/CASL)', () => {
  it('should allow SMS in US with TCPA consent', () => {
    const consents: ConsentRecord[] = [
      {
        type: 'marketing_sms',
        granted: true,
        timestamp: new Date(),
        jurisdiction: 'US',
      },
      {
        type: 'tcpa',
        granted: true,
        timestamp: new Date(),
        jurisdiction: 'US',
      },
    ];

    expect(canSendMarketingSMS(consents)).toBe(true);
  });

  it('should block SMS in US without TCPA consent', () => {
    const consents: ConsentRecord[] = [
      {
        type: 'marketing_sms',
        granted: true,
        timestamp: new Date(),
        jurisdiction: 'US',
      },
      // Missing TCPA consent
    ];

    expect(canSendMarketingSMS(consents)).toBe(false);
  });

  it('should allow SMS in Canada with CASL consent', () => {
    const consents: ConsentRecord[] = [
      {
        type: 'marketing_sms',
        granted: true,
        timestamp: new Date(),
        jurisdiction: 'CA',
      },
      {
        type: 'casl',
        granted: true,
        timestamp: new Date(),
        jurisdiction: 'CA',
      },
    ];

    expect(canSendMarketingSMS(consents)).toBe(true);
  });

  it('should block SMS in Canada without CASL consent', () => {
    const consents: ConsentRecord[] = [
      {
        type: 'marketing_sms',
        granted: true,
        timestamp: new Date(),
        jurisdiction: 'CA',
      },
      // Missing CASL consent
    ];

    expect(canSendMarketingSMS(consents)).toBe(false);
  });
});

describe('Double Opt-In Requirements', () => {
  it('should require double opt-in for EU marketing', () => {
    expect(requiresDoubleOptIn('marketing_email', 'EU')).toBe(true);
    expect(requiresDoubleOptIn('marketing_sms', 'EU')).toBe(true);
    expect(requiresDoubleOptIn('marketing_phone', 'EU')).toBe(true);
  });

  it('should require double opt-in for Canada CASL', () => {
    expect(requiresDoubleOptIn('casl', 'CA')).toBe(true);
  });

  it('should not require double opt-in for US marketing', () => {
    expect(requiresDoubleOptIn('marketing_email', 'US')).toBe(false);
  });

  it('should not require double opt-in for transactional consents', () => {
    expect(requiresDoubleOptIn('credit_check', 'EU')).toBe(false);
    expect(requiresDoubleOptIn('esign', 'EU')).toBe(false);
    expect(requiresDoubleOptIn('data_processing', 'EU')).toBe(false);
  });
});
