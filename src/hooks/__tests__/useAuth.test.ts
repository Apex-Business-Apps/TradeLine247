/**
 * useAuth Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { createMockSupabase, createMockUser, createMockSession } from '@/__tests__/utils/test-utils';

// Mock dependencies - must use factory function
vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: createMockSupabase(),
    isSupabaseEnabled: true,
  };
});

vi.mock('@/lib/ensureMembership', () => ({
  ensureMembership: vi.fn().mockResolvedValue({ orgId: 'org-123', error: undefined }),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('useAuth', () => {
  const { supabase } = require('@/integrations/supabase/client');
  const { ensureMembership } = require('@/lib/ensureMembership');

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.loading).toBe(true);
    });

    it('should initialize with null user and session', () => {
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.userRole).toBeNull();
    });
  });

  describe('session handling', () => {
    it('should set user and session when session exists', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      // Mock role fetch
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should clear session on sign out', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.user).toBeTruthy();
      });

      // Simulate auth state change to null (sign out)
      const authChangeCallback = supabase.auth.onAuthStateChange.mock.calls[0][0];
      authChangeCallback('SIGNED_OUT', null);
      
      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.session).toBeNull();
        expect(result.current.userRole).toBeNull();
      });
    });

    it('should handle malformed token errors', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'JWT token is malformed' },
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });

    it('should handle invalid token errors', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid JWT token' },
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('user roles', () => {
    it('should fetch and set user role', async () => {
      const mockUser = createMockUser({ id: 'user-123' });
      const mockSession = createMockSession(mockUser);
      
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.userRole).toBe('admin');
      });
      
      expect(supabase.from).toHaveBeenCalledWith('user_roles');
    });

    it('should default to "user" role when no role found', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.userRole).toBe('user');
      });
    });

    it('should default to "user" role when Supabase is disabled', () => {
      // Mock isSupabaseEnabled as false
      vi.resetModules();
      vi.doMock('@/integrations/supabase/client', () => ({
        supabase: createMockSupabase(),
        isSupabaseEnabled: false,
      }));

      const { useAuth } = require('../useAuth');
      const { result } = renderHook(() => useAuth());
      
      expect(result.current.loading).toBe(false);
    });
  });

  describe('membership management', () => {
    it('should call ensureMembership on login', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      });

      renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(ensureMembership).toHaveBeenCalledWith(mockUser);
      });
    });

    it('should show toast on membership error', async () => {
      const { toast } = require('@/hooks/use-toast');
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      
      ensureMembership.mockResolvedValue({
        orgId: null,
        error: 'Failed to create trial',
      });
      
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      });

      renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
            title: 'Trial Setup Failed',
          })
        );
      });
    });
  });

  describe('isAdmin helper', () => {
    it('should return true for admin role', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.userRole).toBe('admin');
      });
      
      expect(result.current.isAdmin()).toBe(true);
    });

    it('should return false for non-admin roles', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.userRole).toBe('user');
      });
      
      expect(result.current.isAdmin()).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      const unsubscribe = vi.fn();
      supabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe } },
      });

      const { unmount } = renderHook(() => useAuth());
      
      unmount();
      
      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});

