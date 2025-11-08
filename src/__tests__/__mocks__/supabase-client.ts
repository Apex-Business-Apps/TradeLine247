/**
 * Shared Supabase Client Mock
 * 
 * Centralized mock for all tests to ensure consistency
 * and proper module resolution in CI environments.
 */

import { vi } from 'vitest';

// Create mock functions that can be accessed by tests
export const mockInvoke = vi.fn();
export const mockRpc = vi.fn();
export const mockFrom = vi.fn();
export const mockGetSession = vi.fn();
export const mockOnAuthStateChange = vi.fn();
export const mockSignOut = vi.fn();

// Default mock implementations
const createMockQuery = () => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn(),
  limit: vi.fn().mockReturnThis(),
});

export const createMockSupabaseClient = () => ({
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
  rpc: mockRpc,
});

// Export the mock client
export const mockSupabaseClient = createMockSupabaseClient();

// Default mock module
const mockModule = {
  supabase: mockSupabaseClient,
  isSupabaseEnabled: true,
};

export default mockModule;

