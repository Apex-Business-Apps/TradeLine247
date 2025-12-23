/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test Utilities and Helpers
 *
 * Centralized test utilities for consistent testing across the codebase.
 */

import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReactElement } from 'react';
import { vi } from 'vitest';

/**
 * Custom render function with common providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { route = '/', ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]}>
        {children}
      </MemoryRouter>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Re-export render alias for convenience
export const render = renderWithProviders;

/**
 * Mock Supabase client factory
 */
export function createMockSupabase() {
  const mockAuth = {
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
    getSession: vi.fn(),
    signOut: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    getUser: vi.fn(),
  };

  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    limit: vi.fn().mockReturnThis(),
  }));

  const mockFunctions = {
    invoke: vi.fn(),
  };

  return {
    auth: mockAuth,
    from: mockFrom,
    functions: mockFunctions,
  };
}

/**
 * Mock localStorage helper
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    _store: store,
  };
}

/**
 * Mock window.location
 */
export function mockLocation(url: string) {
  const location = new URL(url);
  Object.defineProperty(window, 'location', {
    value: {
      ...location,
      href: location.href,
      hostname: location.hostname,
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      reload: vi.fn(),
    },
    writable: true,
  });
}

/**
 * Wait for async updates
 */
export async function waitForAsync() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Create mock user for testing with all required Supabase User properties
 */
export function createMockUser(overrides?: Partial<any>) {
  const now = new Date().toISOString();
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    email_confirmed_at: now,
    phone: '',
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {
      display_name: 'Test User',
    },
    identities: [],
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/**
 * Create mock session for testing
 */
export function createMockSession(user?: any) {
  return {
    user: user || createMockUser(),
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() / 1000 + 3600,
  };
}

export * from '@testing-library/react';
export { vi } from 'vitest';
export { renderWithProviders };
export { renderWithProviders as render };
