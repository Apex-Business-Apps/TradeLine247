import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// CI-specific timeout settings
test.describe.configure({
  timeout: process.env.CI ? 120000 : 60000, // 2 minutes in CI, 1 minute local
});

test('a11y on home', async ({ page }) => {
  // Navigate with explicit wait
  await page.goto('/', {
    waitUntil: 'networkidle',
    timeout: process.env.CI ? 15000 : 10000
  });

  // Wait for critical content to load
  await page.waitForSelector('main', { state: 'visible', timeout: 10000 });

  // Run axe scan - timeout is handled at the test level via test.describe.configure
  const results = await new AxeBuilder({ page })
    .analyze();

  // DEBUG: Log specific low-contrast nodes for targeted fixes
  const cc = results.violations.find(v => v.id === 'color-contrast');
  if (cc) {
    console.log('--- A11Y color-contrast nodes ---');
    for (const n of cc.nodes) {
      // Print selector(s) if present, else a trimmed HTML snippet
      const sel = n.target?.[0] ?? '';
      console.log(sel || n.html?.slice(0, 160) || n.failureSummary || 'node');
    }
    console.log('--- END nodes ---');
  }

  // Color contrast should be fixed - bg-green-700 should pass WCAG AA (4.5:1+)
  expect(results.violations.find((v) => v.id === 'color-contrast')).toBeFalsy();
});


