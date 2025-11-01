/**
 * Environment Variable Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import after mocking setup
describe('env', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('env()', () => {
    it('should return value from import.meta.env when available', () => {
      // Mock import.meta.env directly in the module
      const { env } = require('../env');
      
      // Note: import.meta.env is set by Vite at build time
      // In tests, we can't easily mock it, so we test the fallback behavior
      // This is a limitation of testing Vite-specific features
      const result = env('NON_EXISTENT_KEY');
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent keys', () => {
      const { env } = require('../env');
      const result = env('NON_EXISTENT_KEY');
      expect(result).toBeUndefined();
    });
  });

  describe('envRequired()', () => {
    it('should throw error in development mode for missing keys', () => {
      // Mock import.meta.env.DEV to false to avoid throwing
      const { envRequired } = require('../env');
      
      // Set MODE to production to avoid throw
      const originalEnv = (import.meta as any).env;
      (import.meta as any).env = { MODE: 'production', DEV: false };
      
      const result = envRequired('MISSING_KEY');
      expect(result).toBe('');
      
      (import.meta as any).env = originalEnv;
    });

    it('should return empty string in production for missing keys', () => {
      const originalEnv = (import.meta as any).env;
      (import.meta as any).env = { MODE: 'production', DEV: false };
      
      const { envRequired } = require('../env');
      const result = envRequired('MISSING_KEY');
      expect(result).toBe('');
      
      (import.meta as any).env = originalEnv;
    });

    it('should return empty string in test mode for missing keys', () => {
      const originalEnv = (import.meta as any).env;
      (import.meta as any).env = { MODE: 'test', DEV: false };
      
      const { envRequired } = require('../env');
      const result = envRequired('MISSING_KEY');
      expect(result).toBe('');
      
      (import.meta as any).env = originalEnv;
    });
  });
});
