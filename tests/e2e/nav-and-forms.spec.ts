import { test, expect } from '@playwright/test';
import { gotoAndWait } from './helpers';

const actions = [
  { name: 'View Calls', h1: /Calls/i, path: '/calls' },
  { name: 'Add Number', h1: /Add Number|Buy/i, path: '/numbers/new' },
  { name: 'Invite Staff', h1: /Invite|Team/i, path: '/team/invite' },
  { name: 'Integrations', h1: /Integrations/i, path: '/integrations' },
];

test.describe('Nav & refresh', () => {
  for (const action of actions) {
    test(`Quick Action ${action.path} navigates & survives refresh`, async ({ page }) => {
      // Navigate and wait for React hydration
      await gotoAndWait(page, '/');

      // Scroll quick action into view (below the fold), then assert visibility
      const button = page.getByRole('button', { name: action.name, exact: true });
      await expect(button).toHaveCount(1);
      await button.scrollIntoViewIfNeeded();
      await expect(button).toBeVisible({ timeout: 15000 });
      await button.click();

      // Wait for navigation and heading
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(action.h1, { timeout: 30000 });

      // Reload and verify persistence
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(action.h1, { timeout: 30000 });
    });
  }
});
