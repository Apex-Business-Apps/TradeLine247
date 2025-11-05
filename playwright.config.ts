import { defineConfig, devices } from '@playwright/test';

const baseURL =
  process.env.E2E_BASE_URL ||
  process.env.BASE_URL ||
  'http://localhost:5173';

const baseUse = {
  baseURL,
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  // Allow inline scripts/styles under test harnesses even when CSP forbids them in production.
  bypassCSP: true,
} as const satisfies Parameters<typeof defineConfig>[0]['use'];

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
    command: 'npm run build && npm run preview -- --port 5173 --strictPort',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
