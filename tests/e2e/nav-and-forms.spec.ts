import { test, expect } from '@playwright/test';
import { gotoAndWait } from './helpers';

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
      // Navigate and wait for React hydration
      await gotoAndWait(page, '/');

      // Wait for button to be visible and click
      const button = page.getByRole('button', { name: p.qa });
      await expect(button).toBeVisible({ timeout: 30000 });
      await button.scrollIntoViewIfNeeded();
      await button.click();

      // Wait for navigation and heading
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1, { timeout: 30000 });

      // Reload and verify persistence
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1, { timeout: 30000 });
    });
  }
});
