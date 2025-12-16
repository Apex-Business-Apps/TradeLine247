import { defineConfig, devices } from '@playwright/test';

const LOCAL_BASE_URL = 'http://localhost:4176';

const baseURL =
  process.env.E2E_BASE_URL ||
  process.env.BASE_URL ||
  LOCAL_BASE_URL;

const shouldStartLocalServer =
  !process.env.E2E_BASE_URL && !process.env.BASE_URL;

const baseUse: Parameters<typeof defineConfig>[0]['use'] = {
  baseURL,
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  // Allow inline scripts/styles under test harnesses even when CSP forbids them in production.
  bypassCSP: true,
  // Fixed viewport for deterministic layout tests
  viewport: { width: 1366, height: 900 },
  // Extended timeout for CI environment + React hydration signal
  actionTimeout: 45000,
  navigationTimeout: 45000,
};

const webServer = shouldStartLocalServer
  ? {
      command: 'npm run preview:test',
      url: LOCAL_BASE_URL,
      // In CI: reuse if available, start if not. Locally: reuse to avoid conflicts.
      reuseExistingServer: true,
      timeout: 120_000,
      // Kill server on exit in CI to prevent port conflicts
      stdout: 'pipe' as const,
      stderr: 'pipe' as const,
    }
  : undefined;

export default defineConfig({
  testDir: './',
  testMatch: ['tests/**/*.{spec,test}.{ts,tsx,js}', 'scripts/**/*.spec.ts'],

  // CI-specific settings
  timeout: process.env.CI ? 120000 : 60000, // 2 minutes in CI, 1 minute local for accessibility tests
  expect: {
    timeout: process.env.CI ? 10000 : 5000, // 10s in CI, 5s local
  },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined, // throttle on CI, use all cores locally

  reporter: process.env.CI
    ? [['github'], ['html']]
    : [['list'], ['html']],

  use: {
    ...baseUse,
    // CI-specific browser settings
    launchOptions: {
      slowMo: process.env.CI ? 100 : 0, // Add delay in CI
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...baseUse,
      },
    },
  ],
  ...(webServer ? { webServer } : {}),
});
