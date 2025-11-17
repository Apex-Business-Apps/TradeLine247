import '@testing-library/jest-dom/vitest';
import { vi, beforeEach } from 'vitest';

// Mock Supabase environment variables for tests using vi.stubEnv
// This is the correct way to mock env vars in Vitest (not Object.defineProperty)
beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
});

// Mock Supabase environment variables for tests
// This allows Supabase client tests to run without real credentials
if (typeof import.meta.env !== 'undefined') {
  (import.meta.env as any).VITE_SUPABASE_URL = 'https://test-project.supabase.co';
  (import.meta.env as any).VITE_SUPABASE_ANON_KEY = 'test-anon-key-12345';
}

// Mock react-helmet-async for test environment
// This prevents "Cannot read properties of undefined (reading 'add')" errors in jsdom
vi.mock('react-helmet-async', async () => {
  const actual = await vi.importActual('react-helmet-async');
  return {
    ...actual,
    HelmetProvider: ({ children }: { children: React.ReactNode }) => {
      // Return children directly in test environment to avoid jsdom issues
      return <>{children}</>;
    },
    Helmet: () => null, // Mock Helmet to return nothing in tests
  };
});
