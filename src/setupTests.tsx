import '@testing-library/jest-dom/vitest';
import { vi, beforeEach } from 'vitest';

// Mock Supabase environment variables for tests
beforeEach(() => {
  process.env.VITE_SUPABASE_URL = 'https://test-project.supabase.co';
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
});

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

// Mock IntersectionObserver globally for all tests
const observe = vi.fn();
const disconnect = vi.fn();
const unobserve = vi.fn();

class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  observe = observe;
  disconnect = disconnect;
  unobserve = unobserve;
  takeRecords = vi.fn(() => [] as IntersectionObserverEntry[]);

  constructor(
    _callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    // Store options to match real IntersectionObserver API
    if (options) {
      (this as { root: Element | Document | null }).root = options.root ?? null;
      (this as { rootMargin: string }).rootMargin = options.rootMargin ?? '0px';
      (this as { thresholds: ReadonlyArray<number> }).thresholds = Array.isArray(options.threshold)
        ? options.threshold
        : [options.threshold ?? 0];
    }
  }
}

window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
