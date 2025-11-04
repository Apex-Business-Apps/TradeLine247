// playwright.config.cjs — CommonJS so GitHub Actions Babel doesn’t choke on `import`
const { defineConfig, devices } = require('@playwright/test');

const baseURL = process.env.BASE_URL || 'http://localhost:4173';

const baseUse = {
  baseURL,
  trace: 'retain-on-failure',
  video: 'retain-on-failure',
  // Keep test harnesses stable even when production CSP blocks inline execution.
  bypassCSP: true,
};

module.exports = defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
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
