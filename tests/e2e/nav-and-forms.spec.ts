import { test, expect } from '@playwright/test';
import { gotoAndWait } from './helpers';

const pages = [
  { testId: 'quick-action-view-calls', h1: /Calls/i, path: '/calls' },
  { testId: 'quick-action-add-number', h1: /Add Number|Buy/i, path: '/numbers/new' },
  { testId: 'quick-action-invite-staff', h1: /Invite|Team/i, path: '/team/invite' },
  { testId: 'quick-action-integrations', h1: /Integrations/i, path: '/integrations' },
];

test.describe('Nav & refresh', () => {
  for (const p of pages) {
    test(`Quick Action ${p.path} navigates & survives refresh`, async ({ page }) => {
      // Navigate and wait for React hydration
      await gotoAndWait(page, '/');

      // Scroll quick action into view (below the fold), then assert visibility
      const qa = page.getByTestId(p.testId);
      await qa.scrollIntoViewIfNeeded();
      await expect(qa).toBeVisible({ timeout: 15000 });
      await qa.click();

      // Wait for navigation and heading
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1, { timeout: 30000 });

      // Reload and verify persistence
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1, { timeout: 30000 });
    });
  }
});
