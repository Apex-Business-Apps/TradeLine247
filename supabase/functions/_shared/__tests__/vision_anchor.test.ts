/**
 * vision_anchor.test.ts - Unit tests for vision anchor module
 */

import {
  generateStorageKey,
  getExtensionFromMimeType,
  detectWarrantyRiskKeywords,
  estimateEquipmentAge,
  checkWarrantyStatus,
  DEFAULT_WARRANTY_RISK_KEYWORDS,
  MMS_BUCKET,
  createVisionAnchorService,
  type WarrantyRule
} from '../vision_anchor';

describe('vision_anchor pure utilities', () => {
  describe('generateStorageKey', () => {
    test('generates key with date prefix and call ID', () => {
      const testDate = new Date('2025-12-20T10:00:00Z');
      const key = generateStorageKey('call-123', 'image/jpeg', testDate);

      expect(key).toMatch(/^2025\/12\/20\/call-123\//);
      expect(key).toMatch(/\.jpg$/);
    });

    test('includes unique ID in key', () => {
      const key1 = generateStorageKey('call-123', 'image/png');
      const key2 = generateStorageKey('call-123', 'image/png');

      // Same call ID should generate different keys
      expect(key1).not.toBe(key2);
    });
  });

  describe('getExtensionFromMimeType', () => {
    test('maps common MIME types correctly', () => {
      expect(getExtensionFromMimeType('image/jpeg')).toBe('jpg');
      expect(getExtensionFromMimeType('image/png')).toBe('png');
      expect(getExtensionFromMimeType('image/gif')).toBe('gif');
      expect(getExtensionFromMimeType('image/webp')).toBe('webp');
      expect(getExtensionFromMimeType('application/pdf')).toBe('pdf');
    });

    test('returns bin for unknown types', () => {
      expect(getExtensionFromMimeType('application/octet-stream')).toBe('bin');
      expect(getExtensionFromMimeType('unknown/type')).toBe('bin');
    });
  });

  describe('detectWarrantyRiskKeywords', () => {
    test('detects default risk keywords', () => {
      const text = 'The unit looks old and has some rust on the casing';
      const detected = detectWarrantyRiskKeywords(text);

      expect(detected).toContain('old');
      expect(detected).toContain('rust');
    });

    test('is case insensitive', () => {
      const text = 'This is DAMAGED and CORRODED';
      const detected = detectWarrantyRiskKeywords(text);

      expect(detected).toContain('damaged');
      expect(detected).toContain('corroded');
    });

    test('accepts custom keywords', () => {
      const text = 'Equipment shows custom-issue pattern';
      const detected = detectWarrantyRiskKeywords(text, ['custom-issue', 'specific-problem']);

      expect(detected).toContain('custom-issue');
      expect(detected).not.toContain('specific-problem');
    });

    test('returns empty array when no keywords found', () => {
      const text = 'Brand new equipment in perfect condition';
      const detected = detectWarrantyRiskKeywords(text);

      expect(detected).toHaveLength(0);
    });
  });

  describe('estimateEquipmentAge', () => {
    test('returns null age with low confidence (placeholder)', () => {
      const result = estimateEquipmentAge('Carrier', 'Model123');

      expect(result.est_age_years).toBeNull();
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('checkWarrantyStatus', () => {
    const testRules: WarrantyRule[] = [
      { brand_name: 'Carrier', max_warranty_years: 5, warning_message: 'Carrier warranty expired (>5 years)' },
      { brand_name: 'Trane', max_warranty_years: 5, warning_message: 'Trane warranty expired (>5 years)' }
    ];

    test('returns unknown when age is null', () => {
      const result = checkWarrantyStatus('Carrier', null, testRules);
      expect(result.status).toBe('unknown');
    });

    test('returns unknown when brand not in rules', () => {
      const result = checkWarrantyStatus('UnknownBrand', 3, testRules);
      expect(result.status).toBe('unknown');
    });

    test('returns valid when within warranty period', () => {
      const result = checkWarrantyStatus('Carrier', 3, testRules);
      expect(result.status).toBe('valid');
    });

    test('returns expired when beyond warranty period', () => {
      const result = checkWarrantyStatus('Carrier', 7, testRules);
      expect(result.status).toBe('expired');
      expect(result.warning).toBe('Carrier warranty expired (>5 years)');
    });

    test('is case insensitive for brand matching', () => {
      const result = checkWarrantyStatus('CARRIER', 6, testRules);
      expect(result.status).toBe('expired');
    });
  });

  describe('constants', () => {
    test('MMS_BUCKET is defined', () => {
      expect(MMS_BUCKET).toBe('inbound-mms-media');
    });

    test('DEFAULT_WARRANTY_RISK_KEYWORDS is non-empty', () => {
      expect(DEFAULT_WARRANTY_RISK_KEYWORDS.length).toBeGreaterThan(0);
      expect(DEFAULT_WARRANTY_RISK_KEYWORDS).toContain('rust');
      expect(DEFAULT_WARRANTY_RISK_KEYWORDS).toContain('damaged');
    });
  });
});

describe('vision_anchor runtime service', () => {
  const createMockClient = () => {
    const events: Array<{ type: string; data: unknown }> = [];

    return {
      events,
      storage: {
        from: (_bucket: string) => ({
          upload: async (path: string, _data: unknown, _options?: unknown) => {
            events.push({ type: 'upload', data: { path } });
            return { data: { path }, error: null };
          },
          createSignedUrl: async (path: string, expiresIn: number) => {
            events.push({ type: 'createSignedUrl', data: { path, expiresIn } });
            return { data: { signedUrl: `https://signed.url/${path}?exp=${expiresIn}` }, error: null };
          },
          remove: async (paths: string[]) => {
            events.push({ type: 'remove', data: { paths } });
            return { data: null, error: null };
          }
        })
      },
      from: (table: string) => ({
        insert: async (data: unknown) => {
          events.push({ type: 'insert', data: { table, payload: data } });
          return { data, error: null };
        },
        update: (data: unknown) => ({
          eq: async (_col: string, _val: unknown) => {
            events.push({ type: 'update', data: { table, payload: data } });
            return { data, error: null };
          }
        }),
        select: (_columns?: string) => ({
          eq: async (_col: string, _val: unknown) => {
            if (table === 'warranty_rules') {
              return {
                data: [
                  { brand_name: 'Carrier', max_warranty_years: 5, warning_message: 'Warranty expired' }
                ],
                error: null
              };
            }
            return { data: [], error: null };
          }
        })
      })
    };
  };

  test('storeIncomingMedia uploads to private bucket', async () => {
    const mockClient = createMockClient();
    const svc = createVisionAnchorService(mockClient as never);

    const result = await svc.storeIncomingMedia(
      new ArrayBuffer(1024),
      { call_id: 'call-123', content_type: 'image/jpeg', source: 'mms' }
    );

    expect('storage_key' in result).toBe(true);
    if ('storage_key' in result) {
      expect(result.bucket).toBe('inbound-mms-media');
      expect(result.content_type).toBe('image/jpeg');
    }

    expect(mockClient.events.some(e => e.type === 'upload')).toBe(true);
  });

  test('generateSignedUrl creates time-limited URL', async () => {
    const mockClient = createMockClient();
    const svc = createVisionAnchorService(mockClient as never);

    const result = await svc.generateSignedUrl('2025/12/20/call-123/abc.jpg', 3600);

    expect('signedUrl' in result).toBe(true);
    if ('signedUrl' in result) {
      expect(result.signedUrl).toContain('signed.url');
    }
  });

  test('invokeAsyncAnalysis queues job', async () => {
    const mockClient = createMockClient();
    const svc = createVisionAnchorService(mockClient as never);

    const result = await svc.invokeAsyncAnalysis('path/to/image.jpg', 'call-123');

    expect(result.queued).toBe(true);
    expect(result.job_id).toBeDefined();
  });

  test('processAnalysisResult detects warranty risk', async () => {
    const mockClient = createMockClient();
    const svc = createVisionAnchorService(mockClient as never);

    const result = await svc.processAnalysisResult('path/to/image.jpg', {
      brand: 'Carrier',
      est_age_years: 8,
      visible_risks: ['rust', 'corrosion'],
      confidence: 0.85
    });

    expect(result.processed).toBe(true);
    expect(result.warranty_risk).toBe(true);
  });

  test('deleteMedia removes from storage', async () => {
    const mockClient = createMockClient();
    const svc = createVisionAnchorService(mockClient as never);

    const result = await svc.deleteMedia('path/to/image.jpg');

    expect(result.deleted).toBe(true);
    expect(mockClient.events.some(e => e.type === 'remove')).toBe(true);
  });

  test('throws if supabase client not provided', () => {
    expect(() => createVisionAnchorService(null as never)).toThrow('Supabase client is required');
  });
});

// CI safety test
describe('CI safety: vision_anchor module', () => {
  test('vision_anchor.ts has no https:// imports', () => {
    const fs = require('fs');
    const path = require('path');

    const modulePath = path.resolve(__dirname, '../vision_anchor.ts');
    const content = fs.readFileSync(modulePath, 'utf8');

    expect(content).not.toMatch(/^import.*from\s+['"]https:\/\//m);
  });
});
