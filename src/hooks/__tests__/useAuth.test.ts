/**
 * useAuth Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { createMockUser, createMockSession } from '@/__tests__/utils/test-utils';

// Mock dependencies - create mocks inside factory to avoid hoisting issues
vi.mock('@/integrations/supabase/client', () => {
  const mockGetSession = vi.fn();
  const mockOnAuthStateChange = vi.fn();
  const mockSignOut = vi.fn();
  const mockFrom = vi.fn();
  const mockInvoke = vi.fn();
  
  return {
    supabase: {
      auth: {
        onAuthStateChange: mockOnAuthStateChange,
        getSession: mockGetSession,
        signOut: mockSignOut,
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        getUser: vi.fn(),
      },
      from: mockFrom,
      functions: {
        invoke: mockInvoke,
      },
      rpc: vi.fn(),
    },
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
  let mockGetSession: ReturnType<typeof vi.fn>;
  let mockOnAuthStateChange: ReturnType<typeof vi.fn>;
  let mockSignOut: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  const { ensureMembership } = require('@/lib/ensureMembership');

  beforeEach(() => {
    vi.clearAllMocks();
    
    const { supabase } = require('@/integrations/supabase/client');
    mockGetSession = supabase.auth.getSession;
    mockOnAuthStateChange = supabase.auth.onAuthStateChange;
    mockSignOut = supabase.auth.signOut;
    mockFrom = supabase.from;
    
    // Default mock implementations
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { role: 'user' },
      error: null,
    });

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
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
      
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
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
      
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.user).toBeTruthy();
      });

      // Simulate auth state change to null (sign out)
      const authChangeCallback = mockOnAuthStateChange.mock.calls[0]?.[0];
      if (authChangeCallback) {
        authChangeCallback('SIGNED_OUT', null);
      }
      
      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.session).toBeNull();
      });
    });

    it('should handle malformed token errors', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'JWT token is malformed' },
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });

    it('should handle invalid token errors', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid JWT token' },
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  describe('user roles', () => {
    it('should fetch and set user role', async () => {
      const mockUser = createMockUser({ id: 'user-123' });
      const mockSession = createMockSession(mockUser);
      
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockMaybeSingle.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.userRole).toBe('admin');
      });
    });

    it('should default to "user" role when no role found', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.userRole).toBe('user');
      });
    });
  });

  describe('membership management', () => {
    it('should call ensureMembership on login', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(ensureMembership).toHaveBeenCalledWith(mockUser);
      });
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      const unsubscribe = vi.fn();
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe } },
      });

      const { unmount } = renderHook(() => useAuth());
      
      unmount();
      
      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
