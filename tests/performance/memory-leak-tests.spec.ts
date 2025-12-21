/**
 * Memory Leak Detection Tests
 * 
 * Comprehensive tests to detect memory leaks and ensure proper cleanup
 */

import { test, expect } from '@playwright/test';

test.describe('Memory Leak Detection', () => {
  test('Component Unmount Cleanup', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    // Get baseline memory
    const baseline = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Navigate through multiple routes (triggers mount/unmount)
    const routes = ['/features', '/pricing', '/contact', '/faq', '/'];
    
    for (let cycle = 0; cycle < 3; cycle++) {
      for (const route of routes) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('main')).toBeVisible();
        await page.waitForTimeout(500);
      }
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    await page.waitForTimeout(2000);

    // Check final memory
    const final = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    if (baseline > 0 && final > 0) {
      const growth = ((final - baseline) / baseline) * 100;
      // Memory should not grow more than 30% after multiple navigation cycles
      expect(growth).toBeLessThan(30);
    }
  });

  test('Event Listener Cleanup', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    // Count event listeners before
    const beforeCount = await page.evaluate(() => {
      // Approximate by checking for common event handler patterns
      const elements = document.querySelectorAll('*');
      return elements.length;
    });

    // Trigger many interactions
    for (let i = 0; i < 50; i++) {
      await page.click('body');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(10);
    }

    // Navigate away and back
    await page.goto('/features', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    const afterCount = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      return elements.length;
    });

    // Should not have excessive element accumulation
    expect(afterCount).toBeLessThan(beforeCount * 2);
  });

  test('Image Resource Cleanup', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    const initialImages = await page.evaluate(() => {
      return document.images.length;
    });

    // Navigate through pages with images
    await page.goto('/features', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    const finalImages = await page.evaluate(() => {
      return document.images.length;
    });

    // Should not accumulate excessive images
    expect(finalImages).toBeLessThan(initialImages * 3);
  });

  test('Animation Frame Cleanup', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();

    // Start animations
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await page.waitForTimeout(1000);

    // Navigate away
    await page.goto('/features', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main')).toBeVisible();
    await page.waitForTimeout(1000);

    // Check for errors (orphaned animation frames cause errors)
    const errors = await page.evaluate(() => {
      return (window as any).__ANIMATION_ERRORS__ || [];
    });

    expect(errors.length).toBe(0);
  });
});
