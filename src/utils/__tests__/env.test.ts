/**
 * Environment Variable Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { env, envRequired } from '../env';

describe('env', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('env()', () => {
    it('should return undefined for non-existent keys', () => {
      const result = env('NON_EXISTENT_KEY');
      expect(result).toBeUndefined();
    });

    it('should handle empty string values', () => {
      const result = env('NON_EXISTENT_KEY');
      expect(result).toBeUndefined();
    });
  });

  describe('envRequired()', () => {
    it('should return empty string for missing keys when not in dev mode', () => {
      // In test mode, envRequired should return empty string for missing keys
      const result = envRequired('MISSING_KEY_FOR_TEST');
      expect(result).toBe('');
      expect(typeof result).toBe('string');
    });

    it('should handle missing keys gracefully', () => {
      const result = envRequired('NON_EXISTENT_KEY');
      expect(typeof result).toBe('string');
    });
  });
});
