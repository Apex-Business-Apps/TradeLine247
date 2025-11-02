import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

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
