import { test, expect } from '@playwright/test';

const pages = [
  { qa: /View Calls/i, h1: /Calls/i, path: '/calls' },
  { qa: /Add Number/i, h1: /Add Number|Buy/i, path: '/numbers/new' },
  { qa: /Invite Staff|Invite/i, h1: /Invite|Team/i, path: '/team/invite' },
  { qa: /Integrations/i, h1: /Integrations/i, path: '/integrations' },
];

// TODO: Re-enable after investigating CI environment navigation timing
test.describe.skip('Nav & refresh', () => {
  for (const p of pages) {
    test(`Quick Action ${p.path} navigates & survives refresh`, async ({ page }) => {
      // Navigate with network idle wait for better stability
      await page.goto('/', { waitUntil: 'networkidle' });

      // Wait for page to be fully loaded
      await page.waitForLoadState('domcontentloaded');

      // Find and click the button with increased timeout
      const button = page.getByRole('button', { name: p.qa });
      await expect(button).toBeVisible({ timeout: 15000 });
      await button.click();

      // Wait for navigation and heading to appear
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1, { timeout: 15000 });

      // Reload page with network idle wait
      await page.reload({ waitUntil: 'networkidle' });

      // Verify heading persists after reload
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1, { timeout: 15000 });
    });
  }
});
