import { test, expect } from '@playwright/test';
import { gotoAndWait } from './helpers';

// TODO: Re-enable after investigating CI environment React hydration timing
test.describe.skip('Header Position', () => {
  const widths = [360, 768, 1024];

  for (const width of widths) {
    test(`header left elements should be positioned near left edge at ${width}px width`, async ({ page }) => {
      // Set viewport size before navigation
      await page.setViewportSize({ width, height: 800 });

      // Navigate and wait for React hydration with animations disabled
      await gotoAndWait(page, '/');

      // Wait for header left section to be visible
      const headerLeft = page.locator('#app-header-left');
      await expect(headerLeft).toBeVisible({ timeout: 30000 });

      // Ensure element is scrolled into view and stable
      await headerLeft.scrollIntoViewIfNeeded();
      await page.waitForTimeout(100);

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
