import { test, expect } from '@playwright/test';
import { gotoAndWait } from './helpers';

test.describe('Header Position', () => {
  const widths = [360, 768, 1024];

  for (const width of widths) {
    test(`header left elements should be positioned near left edge at ${width}px width`, async ({ page }) => {
      // Set viewport size before navigation
      await page.setViewportSize({ width, height: 800 });

      // Navigate and wait for React hydration with animations disabled
      await gotoAndWait(page, '/');

      // Wait for header to be present in DOM first
      const header = page.locator('header[data-site-header]');
      await expect(header).toBeAttached({ timeout: 10000 });

      // Wait for header left section to be visible
      const headerLeft = page.locator('#app-header-left');
      
      // First ensure it's attached to DOM
      await expect(headerLeft).toBeAttached({ timeout: 10000 });
      
      // Then wait for it to be visible
      await expect(headerLeft).toBeVisible({ timeout: 15000 });

      // Ensure element is scrolled into view and stable
      await headerLeft.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200); // Increased wait for layout stability

      const boundingBox = await headerLeft.boundingBox();
      expect(boundingBox).not.toBeNull();
      
      if (boundingBox) {
        // Header should be positioned near left edge (within container padding)
        // Account for container padding: max(1rem, min(2rem, 4vw))
        // At 360px: 4vw = 14.4px, so padding is 16px (1rem)
        // At 768px: 4vw = 30.7px, so padding is 30.7px
        // At 1024px: 2rem = 32px, so padding is 32px
        const maxPadding = width <= 360 ? 16 : width <= 768 ? 32 : 32;
        expect(boundingBox.x).toBeLessThanOrEqual(maxPadding);
      }
    });
  }
});

