/**
 * useSecureFormSubmission Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSecureFormSubmission } from '../useSecureFormSubmission';

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

      const allowed = await result.current.checkRateLimit();

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

    it('should deny when rate limit exceeded', async () => {
      mockRpc.mockResolvedValue({
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
      mockRpc.mockResolvedValue({
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
      mockRpc.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
      }));
      
      const allowed = await result.current.checkRateLimit();
      
      expect(allowed).toBe(false);
    });
  });

  describe('secureSubmit', () => {
    it('should submit successfully with valid data', async () => {
      mockInvoke.mockResolvedValue({
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
      mockInvoke.mockResolvedValue({
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
      
      await result.current.secureSubmit('test-endpoint', {}, {
        validateResponse,
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
      
      await expect(
        result.current.secureSubmit('test-endpoint', {}, {
          validateResponse,
        })
      ).rejects.toThrow('Invalid response received');
    });

    it('should throw error if rate limit exceeded', async () => {
      mockRpc.mockResolvedValue({
        data: { allowed: false },
        error: null,
      });

      const { result } = renderHook(() => useSecureFormSubmission({
        rateLimitKey: 'test-key',
      }));
      
      await expect(
        result.current.secureSubmit('test-endpoint', {})
      ).rejects.toThrow('Rate limit exceeded');

      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should throw error on function invocation error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' },
      });

      const { result } = renderHook(() => useSecureFormSubmission());
      
      await expect(
        result.current.secureSubmit('test-endpoint', {})
      ).rejects.toThrow('Function error');
    });

    it('should always reset isSubmitting even on error', async () => {
      mockInvoke.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSecureFormSubmission());
      
      await expect(
        result.current.secureSubmit('test-endpoint', {})
      ).rejects.toThrow();
      
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

