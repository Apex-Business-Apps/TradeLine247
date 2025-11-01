/**
 * ensureMembership Function Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureMembership } from '../ensureMembership';
function createMockSupabase() {
  const auth = {
    onAuthStateChange: vi.fn(),
    getSession: vi.fn(),
    signOut: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    getUser: vi.fn(),
  };

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

const supabaseMock = vi.hoisted(() => {
  return createMockSupabase();
});

// Mock Supabase - must use factory function
vi.mock('../../integrations/supabase/client', () => {
  return {
    supabase: supabaseMock,
  };
});

describe('ensureMembership', () => {
  const supabase = supabaseMock;
  const mockUser = createMockUser({ id: 'user-123' });

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(supabase, createMockSupabase());
  });

  describe('existing membership', () => {
    it('should return existing orgId if membership exists', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { org_id: 'existing-org-456' },
          error: null,
        }),
        limit: vi.fn().mockReturnThis(),
      };
      supabase.from.mockReturnValue(mockChain);

      const result = await ensureMembership(mockUser);

      expect(result.orgId).toBe('existing-org-456');
      expect(result.error).toBeUndefined();
      expect(supabase.functions.invoke).not.toHaveBeenCalled();
    });

    it('should handle membership check errors gracefully', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
        limit: vi.fn().mockReturnThis(),
      };
      supabase.from.mockReturnValue(mockChain);

      supabase.functions.invoke.mockResolvedValue({
        data: { ok: true, orgId: 'new-org-789' },
        error: null,
      });

      const result = await ensureMembership(mockUser);

      // Should proceed to create new membership despite check error
      expect(supabase.functions.invoke).toHaveBeenCalled();
      expect(result.orgId).toBe('new-org-789');
    });
  });

  describe('new membership creation', () => {
    it('should create new organization and trial when no membership exists', async () => {
      const userWithoutCompany = createMockUser({ user_metadata: {} });
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

      supabase.functions.invoke.mockResolvedValue({
        data: { ok: true, orgId: 'new-org-123' },
        error: null,
      });

      const result = await ensureMembership(userWithoutCompany);

      expect(result.orgId).toBe('new-org-123');
      expect(result.error).toBeUndefined();
      expect(supabase.functions.invoke).toHaveBeenCalledWith('start-trial', {
        body: { company: undefined },
      });
    });

    it('should pass company name from user metadata', async () => {
      const userWithCompany = createMockUser({
        id: 'user-123',
        user_metadata: { display_name: 'Test Company' },
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

      supabase.functions.invoke.mockResolvedValue({
        data: { ok: true, orgId: 'new-org-123' },
        error: null,
      });

      await ensureMembership(userWithCompany);

      expect(supabase.functions.invoke).toHaveBeenCalledWith('start-trial', {
        body: { company: 'Test Company' },
      });
    });

    it('should handle function invocation errors', async () => {
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

      supabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' },
      });

      const result = await ensureMembership(mockUser);

      expect(result.orgId).toBeNull();
      expect(result.error).toBe('Function error');
    });

    it('should handle function response with ok: false', async () => {
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

      supabase.functions.invoke.mockResolvedValue({
        data: { ok: false, error: 'Trial creation failed' },
        error: null,
      });

      const result = await ensureMembership(mockUser);

      expect(result.orgId).toBeNull();
      expect(result.error).toBe('Trial creation failed');
    });

    it('should handle missing orgId in response', async () => {
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

      supabase.functions.invoke.mockResolvedValue({
        data: { ok: true },
        error: null,
      });

      const result = await ensureMembership(mockUser);

      expect(result.orgId).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      supabase.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await ensureMembership(mockUser);

      expect(result.orgId).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('should provide error message for unexpected errors', async () => {
      supabase.from.mockImplementation(() => {
        throw new Error('Network timeout');
      });

      const result = await ensureMembership(mockUser);

      expect(result.error).toBe('Network timeout');
    });

    it('should handle errors without message', async () => {
      supabase.from.mockImplementation(() => {
        throw { toString: () => 'String error' };
      });

      const result = await ensureMembership(mockUser);

      expect(result.orgId).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('idempotency', () => {
    it('should be safe to call multiple times', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn()
          .mockResolvedValueOnce({
            data: null,
            error: null,
          })
          .mockResolvedValueOnce({
            data: { org_id: 'new-org-123' },
            error: null,
          }),
        limit: vi.fn().mockReturnThis(),
      };
      supabase.from.mockReturnValue(mockChain);

      supabase.functions.invoke.mockResolvedValue({
        data: { ok: true, orgId: 'new-org-123' },
        error: null,
      });

      // First call creates membership
      const result1 = await ensureMembership(mockUser);
      expect(result1.orgId).toBe('new-org-123');

      // Second call returns existing membership
      const result2 = await ensureMembership(mockUser);
      expect(result2.orgId).toBe('new-org-123');

      // Function should only be called once
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    });
  });
});

