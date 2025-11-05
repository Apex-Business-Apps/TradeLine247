import { test, expect } from '@playwright/test';

test.describe('Header Position', () => {
  const widths = [360, 768, 1024];

  for (const width of widths) {
    test(`header left elements should be positioned near left edge at ${width}px width`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize({ width, height: 800 });

      // Navigate and wait for page to fully load
      await page.goto('/', { waitUntil: 'networkidle' });

      // Wait for page to be fully loaded (DOM + assets)
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('load');

      // Wait for header element to be in DOM and visible
      const headerLeft = page.locator('#app-header-left');
      await headerLeft.waitFor({ state: 'visible', timeout: 15000 });

      // Ensure layout is stable (wait for any CSS transitions/animations)
      await page.waitForTimeout(500);

      // Ensure element is in viewport
      await headerLeft.scrollIntoViewIfNeeded();

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

