// playwright.config.cjs — CommonJS so GitHub Actions Babel doesn’t choke on `import`
const { defineConfig, devices } = require('@playwright/test');

// Default to bypassing CSP for inline fixtures used in e2e tests. Allow
// opting out by exporting PLAYWRIGHT_BYPASS_CSP=false when debugging.
const bypassCSP = process.env.PLAYWRIGHT_BYPASS_CSP !== 'false';

module.exports = defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    bypassCSP,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
