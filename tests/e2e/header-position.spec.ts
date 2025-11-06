import { test, expect } from '@playwright/test';

test.describe('Header Position', () => {
  const widths = [360, 768, 1024];

  for (const width of widths) {
    test(`header left elements should be positioned near left edge at ${width}px width`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize({ width, height: 800 });

      // Header is visible on all pages, test on homepage
      // Wait for network idle to ensure all resources loaded
      await page.goto('/', { waitUntil: 'networkidle' });

      // Wait for React hydration
      await page.waitForLoadState('domcontentloaded');

      // Wait for header to be visible (increased timeout for CI reliability)
      const headerLeft = page.locator('#app-header-left');
      await expect(headerLeft).toBeVisible({ timeout: 15000 });

      // Allow time for any CSS animations to complete
      await page.waitForTimeout(300);

      const boundingBox = await headerLeft.boundingBox();
      expect(boundingBox).not.toBeNull();

      if (boundingBox) {
        // Header should be positioned near left edge (within container padding)
        // At mobile (360px): px-3 = 12px
        // At tablet (768px): sm:px-4 = 16px
        // At desktop (1024px): lg:px-6 = 24px
        // Allow 32px max to accommodate all viewports
        expect(boundingBox.x).toBeLessThanOrEqual(32);
      }
    });
  }
});
