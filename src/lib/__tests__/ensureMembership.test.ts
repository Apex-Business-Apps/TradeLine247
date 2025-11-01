/**
 * ensureMembership Function Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureMembership } from '../ensureMembership';
import { createMockUser } from '@/__tests__/utils/test-utils';

// Mock Supabase - inline mocks to avoid hoisting issues
vi.mock('@/integrations/supabase/client', () => {
  const mockFrom = vi.fn();
  const mockInvoke = vi.fn();
  return {
    supabase: {
      from: mockFrom,
      functions: {
        invoke: mockInvoke,
      },
    },
  };
});

describe('ensureMembership', () => {
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockInvoke: ReturnType<typeof vi.fn>;
  const mockUser = createMockUser({ id: 'user-123' });

  beforeEach(() => {
    vi.clearAllMocks();
    const { supabase } = require('@/integrations/supabase/client');
    mockFrom = supabase.from;
    mockInvoke = supabase.functions.invoke;
    
    const mockMaybeSingle = vi.fn();
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
    });
  });

  describe('existing membership', () => {
    it('should return existing orgId if membership exists', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { org_id: 'existing-org-456' },
          error: null,
        }),
      });

      const result = await ensureMembership(mockUser);

      expect(result.orgId).toBe('existing-org-456');
      expect(result.error).toBeUndefined();
      expect(mockInvoke).not.toHaveBeenCalled();
    });

    it('should handle membership check errors gracefully', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      mockInvoke.mockResolvedValue({
        data: { ok: true, orgId: 'new-org-789' },
        error: null,
      });

      const result = await ensureMembership(mockUser);

      // Should proceed to create new membership despite check error
      expect(mockInvoke).toHaveBeenCalled();
      expect(result.orgId).toBe('new-org-789');
    });
  });

  describe('new membership creation', () => {
    it('should create new organization and trial when no membership exists', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockInvoke.mockResolvedValue({
        data: { ok: true, orgId: 'new-org-123' },
        error: null,
      });

      const result = await ensureMembership(mockUser);

      expect(result.orgId).toBe('new-org-123');
      expect(result.error).toBeUndefined();
      expect(mockInvoke).toHaveBeenCalledWith('start-trial', {
        body: { company: undefined },
      });
    });

    it('should pass company name from user metadata', async () => {
      const userWithCompany = createMockUser({
        id: 'user-123',
        user_metadata: { display_name: 'Test Company' },
      });

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockInvoke.mockResolvedValue({
        data: { ok: true, orgId: 'new-org-123' },
        error: null,
      });

      await ensureMembership(userWithCompany);

      expect(mockInvoke).toHaveBeenCalledWith('start-trial', {
        body: { company: 'Test Company' },
      });
    });

    it('should handle function invocation errors', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' },
      });

      const result = await ensureMembership(mockUser);

      expect(result.orgId).toBeNull();
      expect(result.error).toBe('Function error');
    });

    it('should handle function response with ok: false', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockInvoke.mockResolvedValue({
        data: { ok: false, error: 'Trial creation failed' },
        error: null,
      });

      const result = await ensureMembership(mockUser);

      expect(result.orgId).toBeNull();
      expect(result.error).toBe('Trial creation failed');
    });

    it('should handle missing orgId in response', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      mockInvoke.mockResolvedValue({
        data: { ok: true },
        error: null,
      });

      const result = await ensureMembership(mockUser);

      expect(result.orgId).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await ensureMembership(mockUser);

      expect(result.orgId).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('should provide error message for unexpected errors', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Network timeout');
      });

      const result = await ensureMembership(mockUser);

      expect(result.error).toBe('Network timeout');
    });

    it('should handle errors without message', async () => {
      mockFrom.mockImplementation(() => {
        throw { toString: () => 'String error' };
      });

      const result = await ensureMembership(mockUser);

      expect(result.orgId).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('idempotency', () => {
    it('should be safe to call multiple times', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn()
          .mockResolvedValueOnce({
            data: null,
            error: null,
          })
          .mockResolvedValueOnce({
            data: { org_id: 'new-org-123' },
            error: null,
          }),
      });

      mockInvoke.mockResolvedValue({
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
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });
  });
});

