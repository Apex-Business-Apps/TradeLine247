/**
 * useAuth Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
function createMockSupabase() {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    limit: vi.fn().mockReturnThis(),
  };

  const auth = {
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    getSession: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    getUser: vi.fn(),
  };

  const from = vi.fn(() => mockChain);

  return {
    auth,
    from,
    functions: {
      invoke: vi.fn(),
    },
  };
}

function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    user_metadata: {
      display_name: 'Test User',
    },
    ...overrides,
  };
}

function createMockSession(user: any = createMockUser()) {
  return {
    user,
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() / 1000 + 3600,
  };
}

const supabaseMock = vi.hoisted(() => {
  return createMockSupabase();
});
const supabaseEnabledState = vi.hoisted(() => ({ value: true }));
const ensureMembershipMock = vi.hoisted(() => vi.fn());

// Mock dependencies - must use factory function
vi.mock('../../integrations/supabase/client', () => {
  return {
    supabase: supabaseMock,
    get isSupabaseEnabled() {
      return supabaseEnabledState.value;
    },
  };
});

vi.mock('../../lib/ensureMembership', () => ({
  ensureMembership: ensureMembershipMock,
}));

const toastMock = vi.hoisted(() => vi.fn());

vi.mock('../use-toast', () => ({
  toast: toastMock,
}));

describe('useAuth', () => {
  const supabase = supabaseMock;
  const ensureMembership = ensureMembershipMock;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    Object.assign(supabase, createMockSupabase());

    ensureMembership.mockResolvedValue({ orgId: 'org-123', error: undefined });
    supabaseEnabledState.value = true;

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
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
      };
      supabase.from.mockReturnValue(mockChain);

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
      
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
      };
      supabase.from.mockReturnValue(mockChain);

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.user).toBeTruthy();
      });

      // Simulate auth state change to null (sign out)
      const onAuthStateChangeMock = supabase.auth.onAuthStateChange as any;
      const authChangeCallback = onAuthStateChangeMock.mock?.calls?.[0]?.[0];
      if (authChangeCallback) {
        authChangeCallback('SIGNED_OUT', null);
      }
      
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
        error: { message: 'invalid JWT token' },
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
      
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
      };
      supabase.from.mockReturnValue(mockChain);

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
      
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
      };
      supabase.from.mockReturnValue(mockChain);

      const { result } = renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(result.current.userRole).toBe('user');
      });
    });

    it('should default to "user" role when Supabase is disabled', () => {
      supabaseEnabledState.value = false;
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
      
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
      };
      supabase.from.mockReturnValue(mockChain);

      renderHook(() => useAuth());
      
      await waitFor(() => {
        expect(ensureMembership).toHaveBeenCalledWith(mockUser);
      });
    });

    it('should show toast on membership error', async () => {
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
      
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
      };
      supabase.from.mockReturnValue(mockChain);

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(toastMock).toHaveBeenCalledWith(
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
      
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
      };
      supabase.from.mockReturnValue(mockChain);

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
      
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'user' },
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
      };
      supabase.from.mockReturnValue(mockChain);

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

