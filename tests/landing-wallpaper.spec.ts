import { expect, test } from '@playwright/test';

test.describe('Landing wallpaper + mask guardrails', () => {
  test('landing wallpaper and mask wrapper is present', async ({ page }) => {
    await page.goto('/');

    const wallpaper = page.locator('.landing-wallpaper');
    const mask = page.locator('.landing-mask');
    const content = page.locator('.landing-content');

    await expect(wallpaper).toBeVisible();
    await expect(mask).toBeVisible();
    await expect(content.locator('text=The TradeLine 24/7 Difference')).toBeVisible();
    await expect(content.locator('text=Grow your business, not your payroll.')).toBeVisible();
  });
});

