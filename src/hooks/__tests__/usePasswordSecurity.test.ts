/**
 * usePasswordSecurity Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePasswordSecurity } from '../usePasswordSecurity';
import { createMockSupabase } from '@/__tests__/utils/test-utils';

// Mock Supabase - must use factory function for hoisting
vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: createMockSupabase(),
  };
});

describe('usePasswordSecurity', () => {
  const { supabase } = require('@/integrations/supabase/client');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validatePasswordStrength', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const { result } = renderHook(() => usePasswordSecurity());
      
      const validation = result.current.validatePasswordStrength('short');
      
      expect(validation.isValid).toBe(false);
      expect(validation.strength).toBe('Too short');
      expect(validation.message).toContain('8 characters');
    });

    it('should reject passwords with less than 3 criteria', () => {
      const { result } = renderHook(() => usePasswordSecurity());
      
      const validation = result.current.validatePasswordStrength('onlylowercase');
      
      expect(validation.isValid).toBe(false);
      expect(validation.strength).toBe('Too weak');
      expect(validation.message).toContain('at least 3');
    });

    it('should accept passwords with 3 criteria', () => {
      const { result } = renderHook(() => usePasswordSecurity());
      
      const validation = result.current.validatePasswordStrength('Lowercase123');
      
      expect(validation.isValid).toBe(true);
      expect(validation.strength).toBe('Good');
    });

    it('should accept passwords with all 4 criteria as "Very strong"', () => {
      const { result } = renderHook(() => usePasswordSecurity());
      
      const validation = result.current.validatePasswordStrength('StrongP@ss123');
      
      expect(validation.isValid).toBe(true);
      expect(validation.strength).toBe('Very strong');
    });

    it('should detect lowercase letters', () => {
      const { result } = renderHook(() => usePasswordSecurity());
      
      const validation1 = result.current.validatePasswordStrength('PASSWORD123!');
      const validation2 = result.current.validatePasswordStrength('password123!');
      
      expect(validation1.isValid).toBe(false);
      expect(validation2.isValid).toBe(true);
    });

    it('should detect uppercase letters', () => {
      const { result } = renderHook(() => usePasswordSecurity());
      
      const validation1 = result.current.validatePasswordStrength('password123!');
      const validation2 = result.current.validatePasswordStrength('Password123!');
      
      expect(validation1.isValid).toBe(true);
      expect(validation2.isValid).toBe(true);
    });

    it('should detect numbers', () => {
      const { result } = renderHook(() => usePasswordSecurity());
      
      const validation1 = result.current.validatePasswordStrength('Password!');
      const validation2 = result.current.validatePasswordStrength('Password1!');
      
      expect(validation1.isValid).toBe(false);
      expect(validation2.isValid).toBe(true);
    });

    it('should detect special characters', () => {
      const { result } = renderHook(() => usePasswordSecurity());
      
      const validation1 = result.current.validatePasswordStrength('Password123');
      const validation2 = result.current.validatePasswordStrength('Password123!');
      
      expect(validation1.isValid).toBe(true); // 3 criteria (lower, upper, number)
      expect(validation2.isValid).toBe(true); // 4 criteria (all)
    });
  });

  describe('checkPasswordBreach', () => {
    it('should return not breached for valid password', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: { isBreached: false, message: 'Password is safe' },
        error: null,
      });

      const { result } = renderHook(() => usePasswordSecurity());
      
      const breachCheck = await result.current.checkPasswordBreach('SecurePassword123!');
      
      expect(breachCheck.isBreached).toBe(false);
      expect(breachCheck.message).toBe('Password is safe');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('check-password-breach', {
        body: { password: 'SecurePassword123!' },
      });
    });

    it('should return breached for compromised password', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: { isBreached: true, message: 'This password appears in known breaches' },
        error: null,
      });

      const { result } = renderHook(() => usePasswordSecurity());
      
      const breachCheck = await result.current.checkPasswordBreach('password123');
      
      expect(breachCheck.isBreached).toBe(true);
      expect(breachCheck.message).toContain('breaches');
    });

    it('should handle empty password', async () => {
      const { result } = renderHook(() => usePasswordSecurity());
      
      const breachCheck = await result.current.checkPasswordBreach('');
      
      expect(breachCheck.isBreached).toBe(false);
      expect(breachCheck.message).toBe('Password required');
      expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Service unavailable' },
      });

      const { result } = renderHook(() => usePasswordSecurity());
      
      const breachCheck = await result.current.checkPasswordBreach('TestPassword123!');
      
      expect(breachCheck.isBreached).toBe(false);
      expect(breachCheck.message).toContain('unavailable');
      expect(breachCheck.error).toBe('Service unavailable');
    });

    it('should handle network errors', async () => {
      supabase.functions.invoke.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => usePasswordSecurity());
      
      const breachCheck = await result.current.checkPasswordBreach('TestPassword123!');
      
      expect(breachCheck.isBreached).toBe(false);
      expect(breachCheck.message).toContain('error');
    });
  });

  describe('validatePassword', () => {
    it('should return invalid if strength check fails', async () => {
      const { result } = renderHook(() => usePasswordSecurity());
      
      const validation = await result.current.validatePassword('short');
      
      expect(validation.isValid).toBe(false);
      expect(validation.isBreached).toBe(false);
      expect(validation.strength).toBe('Too short');
      expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('should check breach if strength is valid', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: { isBreached: false },
        error: null,
      });

      const { result } = renderHook(() => usePasswordSecurity());
      
      const validation = await waitFor(async () => {
        return await result.current.validatePassword('ValidPassword123!');
      });
      
      expect(validation.isValid).toBe(true);
      expect(validation.isBreached).toBe(false);
      expect(supabase.functions.invoke).toHaveBeenCalled();
    });

    it('should return invalid if password is breached', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: { isBreached: true, message: 'Breached password' },
        error: null,
      });

      const { result } = renderHook(() => usePasswordSecurity());
      
      const validation = await waitFor(async () => {
        return await result.current.validatePassword('BreachedPassword123!');
      });
      
      expect(validation.isValid).toBe(false);
      expect(validation.isBreached).toBe(true);
      expect(validation.message).toContain('Breached');
    });

    it('should combine strength and breach checks', async () => {
      supabase.functions.invoke.mockResolvedValue({
        data: { isBreached: false },
        error: null,
      });

      const { result } = renderHook(() => usePasswordSecurity());
      
      const validation = await waitFor(async () => {
        return await result.current.validatePassword('VeryStrongP@ss123');
      });
      
      expect(validation.isValid).toBe(true);
      expect(validation.isBreached).toBe(false);
      expect(validation.strength).toBe('Very strong');
    });
  });
});

