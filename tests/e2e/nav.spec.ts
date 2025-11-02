import { test, expect } from '@playwright/test';

const pages = [
  { qa: /View Calls/i, h1: /Calls/i, path: '/calls' },
  { qa: /Add Number/i, h1: /Add Number|Buy/i, path: '/numbers/new' },
  { qa: /Invite Staff|Invite Your Team/i, h1: /Invite|Team/i, path: '/team/invite' },
  { qa: /Integrations/i, h1: /Integrations/i, path: '/integrations' },
];

for (const p of pages) {
  test(`Quick Action ${p.path} navigates & survives refresh`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: p.qa }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.h1);
  });
}
