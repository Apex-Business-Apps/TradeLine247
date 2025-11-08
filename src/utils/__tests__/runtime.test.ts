/**
 * Runtime Detection Utilities Tests
 * 
 * Note: These are compile-time constants, so we can only test
 * the actual runtime behavior, not mock them.
 */

import { describe, it, expect } from 'vitest';
import { isDeno, isNode, isBrowser } from '../runtime';

describe('runtime', () => {
  describe('isDeno', () => {
    it('should be a boolean value', () => {
      expect(typeof isDeno).toBe('boolean');
    });

    it('should detect actual runtime environment', () => {
      // In Node.js test environment, isDeno should be false
      // These are compile-time constants, so we test actual behavior
      expect(isDeno).toBe(false); // Running in Node.js, not Deno
    });
  });

  describe('isNode', () => {
    it('should be a boolean value', () => {
      expect(typeof isNode).toBe('boolean');
    });

    it('should detect Node.js environment', () => {
      // In Node.js test environment, isNode should be true
      expect(isNode).toBe(true);
    });
  });

  describe('isBrowser', () => {
    it('should be a boolean value', () => {
      expect(typeof isBrowser).toBe('boolean');
    });

    it('should detect browser environment (jsdom)', () => {
      // In jsdom test environment (which has window), isBrowser should be true
      // Note: jsdom creates a window object, so isBrowser will be true
      expect(isBrowser).toBe(true);
    });
  });
});
