import { defineConfig, devices } from '@playwright/test';

const baseURL =
  process.env.E2E_BASE_URL ||
  process.env.BASE_URL ||
  'http://localhost:4173';

const baseUse: Parameters<typeof defineConfig>[0]['use'] = {
  baseURL,
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  // Allow inline scripts/styles under test harnesses even when CSP forbids them in production.
  bypassCSP: true,
  // Fixed viewport for deterministic layout tests
  viewport: { width: 1366, height: 900 },
  // Disable animations for stable element detection
  reducedMotion: 'reduce',
  // Extended timeout for CI environment + React hydration signal
  actionTimeout: 45000,
  navigationTimeout: 45000,
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined, // throttle on CI, use all cores locally
  reporter: 'html',
  use: baseUse,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...baseUse,
      },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
