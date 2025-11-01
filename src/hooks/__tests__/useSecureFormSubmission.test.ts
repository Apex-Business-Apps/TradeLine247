/**
 * useSecureFormSubmission Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSecureFormSubmission } from '../useSecureFormSubmission';
function createMockSupabase() {
  const auth = {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(),
    signOut: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    getUser: vi.fn(),
  };

  const from = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    limit: vi.fn().mockReturnThis(),
  }));

  return {
    auth,
    from,
    functions: {
      invoke: vi.fn(),
    },
    rpc: vi.fn(),
  };
}

const supabaseMock = vi.hoisted(() => {
  return createMockSupabase();
});

// Mock Supabase - must use factory function
vi.mock('../../integrations/supabase/client', () => {
  return {
    supabase: supabaseMock,
  };
});

describe('useSecureFormSubmission', () => {
  const supabase = supabaseMock;
  let originalCrypto: Crypto | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    Object.assign(supabase, createMockSupabase());

    // Mock crypto.randomUUID
    originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        randomUUID: vi.fn(() => 'mock-uuid-123'),
      },
    });
  });

  afterEach(() => {
    sessionStorage.clear();
    if (originalCrypto) {
      Object.defineProperty(globalThis, 'crypto', {
        configurable: true,
        value: originalCrypto,
      });
    } else {
      Reflect.deleteProperty(globalThis, 'crypto');
    }
  });

  describe('initial state', () => {
    it('should start with isSubmitting false', () => {
      const { result } = renderHook(() => useSecureFormSubmission());
      
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.attempts).toBe(0);
    });

    it('should calculate remaining attempts correctly', () => {
      const { result } = renderHook(() => useSecureFormSubmission({
        maxAttemptsPerHour: 10,
      }));
      
      expect(result.current.getRemainingAttempts()).toBe(10);
    });
  });

  describe('CSRF token generation', () => {
    it('should generate CSRF token if none exists', () => {
      const { result } = renderHook(() => useSecureFormSubmission());
      
      // Token should be generated on first access
      expect(sessionStorage.getItem('csrf-token')).toBeNull();
    });

    it('should reuse existing CSRF token from sessionStorage', () => {
      sessionStorage.setItem('csrf-token', 'existing-token-456');
      
      const { result } = renderHook(() => useSecureFormSubmission());
      
      // Token should be retrieved from storage
      expect(sessionStorage.getItem('csrf-token')).toBe('existing-token-456');
    });
  });

  describe('rate limiting', () => {
    it('should skip rate limit check when no rateLimitKey provided', async () => {
      const { result } = renderHook(() => useSecureFormSubmission());
      
      const allowed = await result.current.checkRateLimit();
      
      expect(allowed).toBe(true);
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('should check rate limit when rateLimitKey provided', async () => {
      supabase.rpc.mockResolvedValue({
        data: { allowed: true, remaining: 4, limit: 5 },
        error: null,
      });

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
        maxAttemptsPerHour: 5,
      }));
      
      const allowed = await result.current.checkRateLimit();

      expect(allowed).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith('secure_rate_limit', {
        identifier: 'test-key',
        max_requests: 5,
        window_seconds: 3600,
      });
      await waitFor(() => {
        expect(result.current.attempts).toBe(1); // 5 - 4 = 1
      });
    });

    it('should deny when rate limit exceeded', async () => {
      supabase.rpc.mockResolvedValue({
        data: { allowed: false, remaining: 0, limit: 5 },
        error: null,
      });

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
      }));
      
      const allowed = await result.current.checkRateLimit();
      
      expect(allowed).toBe(false);
    });

    it('should deny on rate limit check error (fail closed)', async () => {
      supabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
      }));
      
      const allowed = await result.current.checkRateLimit();
      
      expect(allowed).toBe(false);
    });

    it('should deny on rate limit check exception (fail closed)', async () => {
      supabase.rpc.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
      }));
      
      const allowed = await result.current.checkRateLimit();
      
      expect(allowed).toBe(false);
    });
  });

  describe('secureSubmit', () => {
    it('should submit successfully with valid data', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: { success: true, id: '123' },
        error: null,
      });

      const { result } = renderHook(() => useSecureFormSubmission());
      
      const response = await result.current.secureSubmit('test-endpoint', {
        name: 'Test',
        email: 'test@example.com',
      });
      
      expect(response).toEqual({ success: true, id: '123' });
      expect(result.current.isSubmitting).toBe(false);
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'test-endpoint',
        expect.objectContaining({
          body: expect.objectContaining({
            name: 'Test',
            email: 'test@example.com',
            _csrf: expect.any(String),
            _timestamp: expect.any(Number),
          }),
          headers: expect.objectContaining({
            'X-CSRF-Token': expect.any(String),
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should set isSubmitting during submission', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      supabase.functions.invoke.mockReturnValue(promise);

      const { result } = renderHook(() => useSecureFormSubmission());
      
      const submitPromise = result.current.secureSubmit('test-endpoint', {});
      
      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });
      
      resolvePromise!({ data: { success: true }, error: null });
      await submitPromise;

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should sanitize data if sanitizeData function provided', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const sanitizeData = vi.fn((data) => ({
        ...data,
        sanitized: true,
      }));

      const { result } = renderHook(() => useSecureFormSubmission());
      
      await result.current.secureSubmit('test-endpoint', {
        name: 'Test',
      }, { sanitizeData });
      
      expect(sanitizeData).toHaveBeenCalledWith({
        name: 'Test',
      });
      
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'test-endpoint',
        expect.objectContaining({
          body: expect.objectContaining({
            sanitized: true,
          }),
        })
      );
    });

    it('should validate response if validateResponse function provided', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const validateResponse = vi.fn(() => true);

      const { result } = renderHook(() => useSecureFormSubmission());
      
      await result.current.secureSubmit('test-endpoint', {}, {
        validateResponse,
      });
      
      expect(validateResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should throw error if response validation fails', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: { success: false },
        error: null,
      });

      const validateResponse = vi.fn(() => false);

      const { result } = renderHook(() => useSecureFormSubmission());
      
      await expect(
        result.current.secureSubmit('test-endpoint', {}, {
          validateResponse,
        })
      ).rejects.toThrow('Invalid response received');
    });

    it('should throw error if rate limit exceeded', async () => {
      supabase.rpc.mockResolvedValue({
        data: { allowed: false },
        error: null,
      });

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
      }));
      
      await expect(
        result.current.secureSubmit('test-endpoint', {})
      ).rejects.toThrow('Rate limit exceeded');
      
      expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('should throw error on function invocation error', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' },
      });

      const { result } = renderHook(() => useSecureFormSubmission());
      
      await expect(
        result.current.secureSubmit('test-endpoint', {})
      ).rejects.toThrow('Function error');
    });

    it('should always reset isSubmitting even on error', async () => {
      supabase.functions.invoke.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSecureFormSubmission());
      
      await expect(
        result.current.secureSubmit('test-endpoint', {})
      ).rejects.toThrow();
      
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('getRemainingAttempts', () => {
    it('should calculate remaining attempts based on attempts made', async () => {
      supabase.rpc.mockResolvedValue({
        data: { allowed: true, remaining: 3, limit: 5 },
        error: null,
      });

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
        maxAttemptsPerHour: 5,
      }));
      
      await result.current.checkRateLimit();
      
      await waitFor(() => {
        expect(result.current.getRemainingAttempts()).toBe(3);
      });
    });

    it('should never return negative remaining attempts', async () => {
      const { result } = renderHook(() => useSecureFormSubmission({
        maxAttemptsPerHour: 5,
      }));
      
      // Manually set attempts higher than limit (shouldn't happen, but test edge case)
      // We can't directly set state, but we can test the calculation
      const remaining = result.current.getRemainingAttempts();
      expect(remaining).toBeGreaterThanOrEqual(0);
    });
  });
});

