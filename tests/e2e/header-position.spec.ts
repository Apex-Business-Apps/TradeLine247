/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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

      // Wait for React ready signal explicitly
      await page.waitForFunction(() => (window as any).__REACT_READY__ === true, { timeout: 30000 });

      // Wait for header element to exist in DOM
      await page.waitForSelector('header[data-site-header]', { state: 'attached', timeout: 10000 });
      
      // Wait for header left section to exist
      await page.waitForSelector('#app-header-left', { state: 'attached', timeout: 10000 });

      // Get the element and check if it's actually in the DOM
      const headerLeft = page.locator('#app-header-left');
      await expect(headerLeft).toBeVisible({ timeout: 10000 });

      // Wait for element to have non-zero dimensions (proves it's rendered)
      await page.waitForFunction(
        () => {
          const el = document.getElementById('app-header-left');
          if (!el) return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        },
        { timeout: 15000 }
      );

      // Ensure element is scrolled into view
      await headerLeft.scrollIntoViewIfNeeded();

      const boundingBox = await headerLeft.boundingBox();
      expect(boundingBox).not.toBeNull();

      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThan(0);
        expect(boundingBox.height).toBeGreaterThan(0);
        // Header should be positioned near left edge (within container padding)
        // Account for container padding: px-4 (1rem = 16px) at 360px
        // At 360px: padding is 16px (1rem)
        // At 768px: padding is 24px (1.5rem)
        // At 1024px: padding is 32px (2rem)
        const maxPadding = width <= 360 ? 16 : width <= 768 ? 24 : 32;
        expect(boundingBox.x).toBeLessThanOrEqual(maxPadding);
      }
    });
  }
});

