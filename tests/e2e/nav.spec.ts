import { test, expect } from "@playwright/test";

test('Quick Action navigates & survives refresh', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /View Calls/i }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Calls/i);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Calls/i);
});