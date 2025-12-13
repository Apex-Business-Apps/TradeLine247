 
/**
 * useAuth Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { createMockUser, createMockSession } from '@/__tests__/utils/test-utils';

// Mock dependencies - use async mock factories for CI compatibility
vi.mock('@/integrations/supabase/client', async () => {
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

vi.mock('@/lib/ensureMembership', async () => ({
  ensureMembership: vi.fn(() => Promise.resolve({ orgId: 'org-123', error: undefined })),
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('useAuth', () => {
  let mockGetSession: ReturnType<typeof vi.fn>;
  let mockOnAuthStateChange: ReturnType<typeof vi.fn>;
  let mockSignOut: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockMaybeSingle: ReturnType<typeof vi.fn>;
  let ensureMembership: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Use ES imports instead of require() for proper module resolution
    const { supabase } = await import('@/integrations/supabase/client');
    const ensureMembershipModule = await import('@/lib/ensureMembership');

    // Properly cast to mocked functions using vi.mocked() with explicit any type
    ensureMembership = vi.mocked(ensureMembershipModule.ensureMembership) as any;

    // CRITICAL: Reset ensureMembership mock to always return valid result
    (ensureMembership as any).mockImplementation(() =>
      Promise.resolve({ orgId: 'org-123', error: undefined })
    );

    // Use vi.mocked() with explicit any type for complex Supabase types
    mockGetSession = vi.mocked(supabase.auth.getSession) as any;
    mockOnAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange) as any;
    mockSignOut = vi.mocked(supabase.auth.signOut) as any;
    mockFrom = vi.mocked(supabase.from) as any;

    // Default mock implementations
    mockGetSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    // Mock signOut to return a resolved Promise
    mockSignOut.mockResolvedValue({ error: null });
    mockMaybeSingle = vi.fn().mockResolvedValue({
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

      // Trigger the auth state change callback
      mockOnAuthStateChange.mockImplementation((callback) => {
        setTimeout(() => callback('SIGNED_IN', mockSession), 0);
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toBeTruthy();
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.session).toEqual(mockSession);
      });
    });

    it('should clear session on sign out', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);

      let authChangeCallback: any;
      mockOnAuthStateChange.mockImplementation((callback) => {
        authChangeCallback = callback;
        setTimeout(() => callback('SIGNED_IN', mockSession), 0);
        return {
          data: { subscription: { unsubscribe: vi.fn() } },
        };
      });

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).toBeTruthy();
      });

      // Simulate auth state change to null (sign out)
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
      
      // Wait for loading to complete and signOut to be called
      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
        },
        { timeout: 3000 }
      );
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });
      
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

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      }, { timeout: 2000 });
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

      // Update mockMaybeSingle before the hook runs
      mockMaybeSingle.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

      const { result } = renderHook(() => useAuth());
      
      // Wait for user to be set first
      await waitFor(() => {
        expect(result.current.user).toBeTruthy();
      });
      
      // Then wait for role to be fetched
      await waitFor(() => {
        expect(result.current.userRole).toBe('admin');
      }, { timeout: 3000 });
    });

    it('should default to "user" role when no role found', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      // Update mockMaybeSingle to return null (no role found)
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const { result } = renderHook(() => useAuth());
      
      // Wait for user to be set first
      await waitFor(() => {
        expect(result.current.user).toBeTruthy();
      });
      
      // Then wait for default role to be set
      await waitFor(() => {
        expect(result.current.userRole).toBe('user');
      }, { timeout: 3000 });
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
