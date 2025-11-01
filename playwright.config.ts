import { defineConfig, devices } from '@playwright/test';

const baseURL =
  process.env.E2E_BASE_URL ||
  process.env.BASE_URL ||
  'http://localhost:4173';

// Always bypass CSP in CI/automation so inline scripts/styles used in
// pre-rendered shells do not break the test harness. Engineers can override by
// setting PLAYWRIGHT_BYPASS_CSP=false locally when debugging a real CSP issue.
const bypassCSP = process.env.PLAYWRIGHT_BYPASS_CSP === 'false' ? false : true;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined, // throttle on CI, use all cores locally
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    bypassCSP,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
