/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * useSecureFormSubmission Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  RATE_LIMIT_ERROR_MESSAGE,
  useSecureFormSubmission,
} from '../useSecureFormSubmission';

vi.mock('@/lib/errorReporter', () => ({
  errorReporter: {
    report: vi.fn(),
    getEnvironment: vi.fn(() => 'test'),
  },
}));

// Mock Supabase - use async mock factory for CI compatibility
vi.mock('@/integrations/supabase/client', async () => {
  const mockRpc = vi.fn();
  const mockInvoke = vi.fn();
  return {
    supabase: {
      rpc: mockRpc,
      functions: {
        invoke: mockInvoke,
      },
    },
    isSupabaseEnabled: true,
  };
});

describe('useSecureFormSubmission', () => {
  let mockRpc: ReturnType<typeof vi.fn>;
  let mockInvoke: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    sessionStorage.clear();

    // Use ES import instead of require() for proper module resolution
    const { supabase } = await import('@/integrations/supabase/client');

    // Use vi.mocked() with explicit any type for complex Supabase types
    mockRpc = vi.mocked(supabase.rpc) as any;
    mockInvoke = vi.mocked(supabase.functions.invoke) as any;

    // Mock crypto.randomUUID with valid UUID format
    vi.spyOn(global.crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000000');
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
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
    it('should generate CSRF token if none exists', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const { result } = renderHook(() => useSecureFormSubmission());

      expect(sessionStorage.getItem('csrf-token')).toBeNull();

      await act(async () => {
        await result.current.secureSubmit('test-endpoint', {});
      });

      const storedToken = sessionStorage.getItem('csrf-token');

      expect(storedToken).toMatch(/^[0-9a-f-]{36}$/);
      expect(mockInvoke).toHaveBeenCalledWith(
        'test-endpoint',
        expect.objectContaining({
          body: expect.objectContaining({ _csrf: storedToken }),
          headers: expect.objectContaining({ 'X-CSRF-Token': storedToken }),
        })
      );
    });

    it('should reuse existing CSRF token from sessionStorage', async () => {
      sessionStorage.setItem('csrf-token', 'existing-token-456');

      mockInvoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const { result } = renderHook(() => useSecureFormSubmission());

      await act(async () => {
        await result.current.secureSubmit('test-endpoint', {});
      });

      expect(mockInvoke).toHaveBeenCalledWith(
        'test-endpoint',
        expect.objectContaining({
          body: expect.objectContaining({ _csrf: 'existing-token-456' }),
          headers: expect.objectContaining({ 'X-CSRF-Token': 'existing-token-456' }),
        })
      );
    });
  });

  describe('rate limiting', () => {
    it('should skip rate limit check when no rateLimitKey provided', async () => {
      const { result } = renderHook(() => useSecureFormSubmission());

      const allowed = await result.current.checkRateLimit();

      expect(allowed).toBe(true);
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('should check rate limit when rateLimitKey provided', async () => {
      mockRpc.mockResolvedValue({
        data: { allowed: true, remaining: 4, limit: 5 },
        error: null,
      });

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
        maxAttemptsPerHour: 5,
      }));

      let allowed = false;

      await act(async () => {
        allowed = await result.current.checkRateLimit();
      });

      expect(allowed).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('secure_rate_limit', {
        identifier: 'test-key',
        max_requests: 5,
        window_seconds: 3600,
      });

      await waitFor(() => {
        expect(result.current.attempts).toBe(1); // 5 - 4 = 1
      });
    });

    it('should use server-provided limit when calculating attempts and remaining', async () => {
      mockRpc.mockResolvedValue({
        data: { allowed: true, remaining: 1, limit: 3 },
        error: null,
      });

      const { result } = renderHook(() =>
        useSecureFormSubmission({
          rateLimitKey: 'test-key',
          maxAttemptsPerHour: 10,
        })
      );

      await act(async () => {
        await result.current.checkRateLimit();
      });

      await waitFor(() => {
        expect(result.current.attempts).toBe(2);
        expect(result.current.getRemainingAttempts()).toBe(1);
      });
    });

    it('should preserve the server limit when a subsequent rate limit check errors', async () => {
      mockRpc
        .mockResolvedValueOnce({
          data: { allowed: true, remaining: 9, limit: 10 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        });

      const { result } = renderHook(() =>
        useSecureFormSubmission({
          rateLimitKey: 'test-key',
          maxAttemptsPerHour: 5,
        })
      );

      await act(async () => {
        await result.current.checkRateLimit();
      });

      await waitFor(() => {
        expect(result.current.attempts).toBe(1);
      });

      const allowed = await result.current.checkRateLimit();

      expect(allowed).toBe(false);

      await waitFor(() => {
        expect(result.current.attempts).toBe(10);
        expect(result.current.getRemainingAttempts()).toBe(0);
      });
    });

    it('should reuse the last server-provided limit on subsequent checks', async () => {
      mockRpc
        .mockResolvedValueOnce({
          data: { allowed: true, remaining: 8, limit: 10 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { allowed: true, remaining: 7, limit: 10 },
          error: null,
        });

      const { result } = renderHook(() =>
        useSecureFormSubmission({
          rateLimitKey: 'test-key',
          maxAttemptsPerHour: 5,
        })
      );

      await act(async () => {
        await result.current.checkRateLimit();
      });

      await waitFor(() => {
        expect(result.current.attempts).toBe(2);
        expect(result.current.getRemainingAttempts()).toBe(8);
      });

      await act(async () => {
        await result.current.checkRateLimit();
      });

      expect(mockRpc).toHaveBeenNthCalledWith(1, 'secure_rate_limit', {
        identifier: 'test-key',
        max_requests: 5,
        window_seconds: 3600,
      });

      expect(mockRpc).toHaveBeenNthCalledWith(2, 'secure_rate_limit', {
        identifier: 'test-key',
        max_requests: 10,
        window_seconds: 3600,
      });
    });

    it('should deny when rate limit exceeded', async () => {
      mockRpc.mockResolvedValue({
        data: { allowed: false, remaining: 0, limit: 5 },
        error: null,
      });

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
      }));

      let allowed = false;

      await act(async () => {
        allowed = await result.current.checkRateLimit();
      });

      expect(allowed).toBe(false);

      await waitFor(() => {
        expect(result.current.attempts).toBe(5);
        expect(result.current.getRemainingAttempts()).toBe(0);
      });
    });

    it('should deny on rate limit check error (fail closed)', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
      }));

      const allowed = await result.current.checkRateLimit();

      expect(allowed).toBe(false);

      await waitFor(() => {
        expect(result.current.attempts).toBe(5);
      });
    });

    it('should deny on rate limit check exception (fail closed)', async () => {
      mockRpc.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
      }));

      let allowed = false;

      await act(async () => {
        allowed = await result.current.checkRateLimit();
      });

      expect(allowed).toBe(false);

      await waitFor(() => {
        expect(result.current.attempts).toBe(5);
      });
    });
  });

  describe('secureSubmit', () => {
    it('should submit successfully with valid data', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true, id: '123' },
        error: null,
      });

      const { result } = renderHook(() => useSecureFormSubmission());

      let response;

      await act(async () => {
        response = await result.current.secureSubmit('test-endpoint', {
          name: 'Test',
          email: 'test@example.com',
        });
      });

      expect(response).toEqual({ success: true, id: '123' });
      expect(result.current.isSubmitting).toBe(false);
      expect(mockInvoke).toHaveBeenCalledWith(
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

      mockInvoke.mockReturnValue(promise);

      const { result } = renderHook(() => useSecureFormSubmission());

      let submitPromise!: Promise<any>;

      await act(async () => {
        submitPromise = result.current.secureSubmit('test-endpoint', {});
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(true);
      });

      await act(async () => {
        resolvePromise!({ data: { success: true }, error: null });
      });
      await submitPromise;

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should sanitize data if sanitizeData function provided', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const sanitizeData = vi.fn((data) => ({
        ...data,
        sanitized: true,
      }));

      const { result } = renderHook(() => useSecureFormSubmission());
      
      await act(async () => {
        await result.current.secureSubmit('test-endpoint', {
          name: 'Test',
        }, { sanitizeData });
      });
      
      expect(sanitizeData).toHaveBeenCalledWith({
        name: 'Test',
      });

      expect(mockInvoke).toHaveBeenCalledWith(
        'test-endpoint',
        expect.objectContaining({
          body: expect.objectContaining({
            sanitized: true,
          }),
        })
      );
    });

    it('should validate response if validateResponse function provided', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const validateResponse = vi.fn(() => true);

      const { result } = renderHook(() => useSecureFormSubmission());
      
      await act(async () => {
        await result.current.secureSubmit('test-endpoint', {}, {
          validateResponse,
        });
      });
      
      expect(validateResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should throw error if response validation fails', async () => {
      mockInvoke.mockResolvedValue({
        data: { success: false },
        error: null,
      });

      const validateResponse = vi.fn(() => false);

      const { result } = renderHook(() => useSecureFormSubmission());
      
      await act(async () => {
        await expect(
          result.current.secureSubmit('test-endpoint', {}, {
            validateResponse,
          })
        ).rejects.toThrow('Invalid response received');
      });
    });

    it('should throw error if rate limit exceeded', async () => {
      mockRpc.mockResolvedValue({
        data: { allowed: false },
        error: null,
      });

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
      }));
      
      await act(async () => {
        await expect(
          result.current.secureSubmit('test-endpoint', {})
        ).rejects.toThrow(RATE_LIMIT_ERROR_MESSAGE);
      });

      expect(result.current.attempts).toBe(5);
      expect(result.current.getRemainingAttempts()).toBe(0);
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should throw error on function invocation error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' },
      });

      const { result } = renderHook(() => useSecureFormSubmission());
      
      await act(async () => {
        await expect(
          result.current.secureSubmit('test-endpoint', {})
        ).rejects.toThrow('Function error');
      });
    });

    it('should always reset isSubmitting even on error', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSecureFormSubmission());
      
      await act(async () => {
        await expect(
          result.current.secureSubmit('test-endpoint', {})
        ).rejects.toThrow();
      });
      
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('getRemainingAttempts', () => {
    it('should calculate remaining attempts based on attempts made', async () => {
      mockRpc.mockResolvedValue({
        data: { allowed: true, remaining: 3, limit: 5 },
        error: null,
      });

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
        maxAttemptsPerHour: 5,
      }));

      await act(async () => {
        await result.current.checkRateLimit();
      });

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

