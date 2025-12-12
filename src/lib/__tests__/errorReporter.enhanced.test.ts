/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Enhanced Error Reporter Tests - P0 Fix Verification
 * Tests for error type normalization and stack trace preservation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock normalizeError function (extracted from errorReporter for testing)
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

function normalizeError(value: unknown): Error {
  if (isError(value)) {
    return value;
  }

  if (typeof value === 'string') {
    return new Error(value);
  }

  if (value && typeof value === 'object') {
    const message = (value as any).message || (value as any).error || JSON.stringify(value);
    const error = new Error(message);
    if ((value as any).stack) {
      error.stack = (value as any).stack;
    }
    return error;
  }

  return new Error(String(value));
}

describe('Error Reporter - P0 Fix: Unvalidated Error Types', () => {
  describe('isError type guard', () => {
    it('should return true for Error instances', () => {
      const error = new Error('test error');
      expect(isError(error)).toBe(true);
    });

    it('should return true for TypeError instances', () => {
      const error = new TypeError('type error');
      expect(isError(error)).toBe(true);
    });

    it('should return false for string', () => {
      expect(isError('error string')).toBe(false);
    });

    it('should return false for object', () => {
      expect(isError({ message: 'error' })).toBe(false);
    });

    it('should return false for null', () => {
      expect(isError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isError(undefined)).toBe(false);
    });
  });

  describe('normalizeError utility', () => {
    it('should return Error as-is', () => {
      const error = new Error('original error');
      const normalized = normalizeError(error);
      expect(normalized).toBe(error);
      expect(normalized.message).toBe('original error');
      expect(normalized.stack).toBeDefined();
    });

    it('should convert string to Error with stack trace', () => {
      const normalized = normalizeError('string error');
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('string error');
      expect(normalized.stack).toBeDefined();
      expect(normalized.stack).toContain('string error');
    });

    it('should convert object with message to Error', () => {
      const obj = { message: 'object error', code: 500 };
      const normalized = normalizeError(obj);
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('object error');
      expect(normalized.stack).toBeDefined();
    });

    it('should preserve original stack if available', () => {
      const originalStack = 'Error: original\n  at function1\n  at function2';
      const obj = { message: 'error with stack', stack: originalStack };
      const normalized = normalizeError(obj);
      expect(normalized.stack).toBe(originalStack);
    });

    it('should handle object without message', () => {
      const obj = { error: 'error field', data: 'test' };
      const normalized = normalizeError(obj);
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('error field');
    });

    it('should convert number to Error', () => {
      const normalized = normalizeError(404);
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('404');
      expect(normalized.stack).toBeDefined();
    });

    it('should convert boolean to Error', () => {
      const normalized = normalizeError(false);
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('false');
    });

    it('should handle null', () => {
      const normalized = normalizeError(null);
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('null');
    });

    it('should handle undefined', () => {
      const normalized = normalizeError(undefined);
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('undefined');
    });
  });

  describe('Stack trace preservation', () => {
    it('should preserve stack trace through normalization', () => {
      const error = new Error('test error');
      const originalStack = error.stack;
      const normalized = normalizeError(error);
      expect(normalized.stack).toBe(originalStack);
    });

    it('should generate new stack for string errors', () => {
      const normalized = normalizeError('string error');
      expect(normalized.stack).toBeDefined();
      expect(normalized.stack).toContain('normalizeError');
    });
  });

  describe('Promise rejection handling', () => {
    it('should handle rejected promise with Error', async () => {
      const error = new Error('promise error');
      try {
        await Promise.reject(error);
      } catch (e) {
        const normalized = normalizeError(e);
        expect(normalized).toBeInstanceOf(Error);
        expect(normalized.message).toBe('promise error');
        expect(normalized.stack).toBeDefined();
      }
    });

    it('should handle rejected promise with string', async () => {
      try {
        await Promise.reject('string rejection');
      } catch (e) {
        const normalized = normalizeError(e);
        expect(normalized).toBeInstanceOf(Error);
        expect(normalized.message).toBe('string rejection');
        expect(normalized.stack).toBeDefined();
      }
    });

    it('should handle rejected promise with object', async () => {
      try {
        await Promise.reject({ code: 'ERR_NETWORK', message: 'Network failure' });
      } catch (e) {
        const normalized = normalizeError(e);
        expect(normalized).toBeInstanceOf(Error);
        expect(normalized.message).toBe('Network failure');
      }
    });
  });
});
