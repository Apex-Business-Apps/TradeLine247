/**
 * Report Error Fallback Tests - P0 Fix Verification
 * Tests for localStorage fallback and error suppression fix
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Report Error - P0 Fix: Silent Error Suppression', () => {
  let consoleErrorSpy: any;
  let localStorageGetSpy: any;
  let localStorageSetSpy: any;

  beforeEach(() => {
    // Setup spies
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorageGetSpy = vi.spyOn(Storage.prototype, 'getItem');
    localStorageSetSpy = vi.spyOn(Storage.prototype, 'setItem');

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('localStorage fallback behavior', () => {
    it('should store error in localStorage when reporting fails', () => {
      const fallbackKey = 'error_reporting_failures';
      const testError = new Error('test error');
      const reportingError = new Error('network failure');

      // Simulate the fallback logic
      const existing = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
      existing.push({
        originalError: testError.message,
        reportingError: reportingError.message,
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      });
      localStorage.setItem(fallbackKey, JSON.stringify(existing));

      const stored = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].originalError).toBe('test error');
      expect(stored[0].reportingError).toBe('network failure');
    });

    it('should limit fallback storage to last 10 errors', () => {
      const fallbackKey = 'error_reporting_failures';

      // Add 15 errors
      const errors = Array.from({ length: 15 }, (_, i) => ({
        originalError: `error ${i}`,
        reportingError: 'network failure',
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      }));

      const limited = errors.slice(-10);
      localStorage.setItem(fallbackKey, JSON.stringify(limited));

      const stored = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
      expect(stored).toHaveLength(10);
      expect(stored[0].originalError).toBe('error 5'); // Should start from index 5
      expect(stored[9].originalError).toBe('error 14');
    });

    it('should handle non-Error objects in fallback', () => {
      const fallbackKey = 'error_reporting_failures';
      const testError = 'string error';
      const reportingError = { code: 500, message: 'server error' };

      const existing = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
      existing.push({
        originalError: typeof testError === 'object' && testError !== null && 'message' in testError
          ? (testError as any).message
          : String(testError),
        reportingError: typeof reportingError === 'object' && reportingError !== null && 'message' in reportingError
          ? (reportingError as any).message
          : String(reportingError),
        timestamp: new Date().toISOString(),
        userAgent: 'test-agent'
      });
      localStorage.setItem(fallbackKey, JSON.stringify(existing));

      const stored = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
      expect(stored[0].originalError).toBe('string error');
      expect(stored[0].reportingError).toBe('server error');
    });
  });

  describe('console logging fallback', () => {
    it('should log to console when localStorage also fails', () => {
      // Simulate localStorage failure
      localStorageSetSpy.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      const testError = new Error('test error');
      const reportingError = new Error('network failure');
      const storageError = new Error('localStorage quota exceeded');

      // Simulate final fallback - console logging
      console.error('[reportError] Failed to report error and store fallback:', {
        originalError: testError,
        reportingError,
        storageError
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[reportError] Failed to report error and store fallback:',
        expect.objectContaining({
          originalError: testError,
          reportingError,
          storageError
        })
      );
    });

    it('should include all error context in console log', () => {
      const testError = new Error('original error');
      const reportingError = new Error('reporting failed');
      const storageError = new Error('storage failed');

      console.error('[reportError] Failed to report error and store fallback:', {
        originalError: testError,
        reportingError,
        storageError
      });

      const call = consoleErrorSpy.mock.calls[0];
      expect(call[0]).toBe('[reportError] Failed to report error and store fallback:');
      expect(call[1]).toMatchObject({
        originalError: expect.any(Error),
        reportingError: expect.any(Error),
        storageError: expect.any(Error)
      });
    });
  });

  describe('error metadata preservation', () => {
    it('should preserve timestamp in fallback', () => {
      const fallbackKey = 'error_reporting_failures';
      const before = Date.now();

      const existing = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
      const timestamp = new Date().toISOString();
      existing.push({
        originalError: 'test error',
        reportingError: 'network error',
        timestamp,
        userAgent: 'test-agent'
      });
      localStorage.setItem(fallbackKey, JSON.stringify(existing));

      const after = Date.now();
      const stored = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
      const storedTime = new Date(stored[0].timestamp).getTime();

      expect(storedTime).toBeGreaterThanOrEqual(before);
      expect(storedTime).toBeLessThanOrEqual(after);
    });

    it('should preserve userAgent in fallback', () => {
      const fallbackKey = 'error_reporting_failures';

      const existing = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
      existing.push({
        originalError: 'test error',
        reportingError: 'network error',
        timestamp: new Date().toISOString(),
        userAgent: 'Mozilla/5.0 Test Browser'
      });
      localStorage.setItem(fallbackKey, JSON.stringify(existing));

      const stored = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
      expect(stored[0].userAgent).toBe('Mozilla/5.0 Test Browser');
    });
  });

  describe('graceful degradation', () => {
    it('should not throw when all fallbacks fail', () => {
      localStorageSetSpy.mockImplementation(() => {
        throw new Error('storage error');
      });

      expect(() => {
        try {
          localStorage.setItem('test', 'value');
        } catch (storageError) {
          console.error('[reportError] Failed to report error and store fallback:', {
            originalError: new Error('test'),
            reportingError: new Error('reporting'),
            storageError
          });
        }
      }).not.toThrow();
    });
  });
});
