import { test, expect } from '@playwright/test';

const pages = [
  { testId: 'quick-action-view-calls', h1: /Calls/i, path: '/calls' },
  { testId: 'quick-action-add-number', h1: /Add Number|Buy/i, path: '/numbers/new' },
  { testId: 'quick-action-invite-staff', h1: /Invite|Team/i, path: '/team/invite' },
  { testId: 'quick-action-integrations', h1: /Integrations/i, path: '/integrations' },
];

for (const p of pages) {
  test(`Quick Action ${p.path} navigates & survives refresh`, async ({ page }) => {
    await page.goto('/');
    // Scroll into view to handle below-the-fold content
    const qa = page.getByTestId(p.testId);
    await qa.scrollIntoViewIfNeeded();
    await expect(qa).toBeVisible({ timeout: 15000 });
    await qa.click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1);
  });
}
