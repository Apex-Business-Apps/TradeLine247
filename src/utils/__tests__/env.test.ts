/**
 * Environment Variable Utilities Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type EnvSnapshot = NodeJS.ProcessEnv;

let originalProcessEnv: EnvSnapshot;

describe('env utilities', () => {
  beforeEach(() => {
    originalProcessEnv = { ...process.env };
    vi.resetModules();
  });

  afterEach(() => {
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalProcessEnv)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalProcessEnv);
    vi.resetModules();
  });

  describe('env()', () => {
    it('should return value from import.meta.env when available', async () => {
      process.env.VITE_SAMPLE = 'hello-world';
      const { env } = await import('../env');
      expect(env('VITE_SAMPLE')).toBe('hello-world');
    });

    it('should return undefined for non-existent keys', async () => {
      delete process.env.VITE_SAMPLE;
      const { env } = await import('../env');
      expect(env('NON_EXISTENT_KEY')).toBeUndefined();
    });
  });

  describe('envRequired()', () => {
    it('should throw error in development mode for missing keys', async () => {
      process.env.MODE = 'development';
      process.env.DEV = 'true';
      const { envRequired } = await import('../env');
      expect(() => envRequired('MISSING_KEY')).toThrowError('Missing required env: MISSING_KEY');
    });

    it('should return empty string in production for missing keys', async () => {
      process.env.MODE = 'production';
      delete process.env.DEV;
      const { envRequired } = await import('../env');
      expect(envRequired('MISSING_KEY')).toBe('');
    });

    it('should return empty string in test mode for missing keys', async () => {
      process.env.MODE = 'test';
      delete process.env.DEV;
      const { envRequired } = await import('../env');
      expect(envRequired('MISSING_KEY')).toBe('');
    });
  });
});
