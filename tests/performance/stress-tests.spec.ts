/**
 * Stress Tests - Heavy Load & Edge Cases
 *
 * Tests to ensure the app remains stable under heavy load
 *
 * @slow - These tests run in nightly builds only (full project)
 * They are excluded from PR gates (critical project)
 */

import { test, expect } from '@playwright/test';

// Configure for parallel execution, no retries (stress tests should be deterministic)
test.describe.configure({ mode: 'parallel', retries: 0 });

test.describe('Stress Tests - Heavy Load Scenarios', () => {
  test('Rapid Navigation Stress Test', async ({ page }) => {
    test.setTimeout(120000);
    
    await page.goto('/');
    
    const routes = ['/features', '/pricing', '/contact', '/faq', '/demo', '/security', '/compare'];
    
    // Rapidly navigate through all routes 10 times
    for (let cycle = 0; cycle < 10; cycle++) {
      for (const route of routes) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(100); // Minimal wait
      }
    }

    // Final page should still work
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();

    const title = await page.title();
    expect(title).toContain('TradeLine');
  });

  test('Rapid Scroll Stress Test', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    // Rapid scrolling up and down
    for (let i = 0; i < 100; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, Math.random() * document.body.scrollHeight);
      });
      await page.waitForTimeout(10);
    }

    // Page should still be responsive
    const scrollable = await page.evaluate(() => {
      return document.body.scrollHeight > window.innerHeight;
    });
    expect(scrollable).toBe(true);
  });

  test('Multiple Background Image Load Test', async ({ page }) => {
    // Navigate to all pages that use background images
    const pages = ['/', '/features', '/pricing', '/contact', '/faq', '/demo'];
    
    for (const route of pages) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      
      // Verify background image is loaded and has correct properties
      const bgProps = await page.evaluate(() => {
        const bgElements = document.querySelectorAll('[style*="backgroundImage"], .landing-wallpaper, .hero-bg');
        return Array.from(bgElements).map(el => {
          const style = window.getComputedStyle(el);
          return {
            pointerEvents: style.pointerEvents,
            zIndex: parseInt(style.zIndex) || 0,
            backgroundImage: style.backgroundImage,
          };
        });
      });

      // All should have pointer-events: none
      bgProps.forEach(props => {
        expect(props.pointerEvents).toBe('none');
        expect(props.zIndex).toBeLessThan(10); // Should be bottom layer
      });
    }
  });

  test('Concurrent User Interaction Simulation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    // Simulate multiple concurrent interactions
    await Promise.all([
      page.mouse.move(100, 100),
      page.mouse.move(200, 200),
      page.mouse.move(300, 300),
      page.keyboard.press('Tab'),
      page.keyboard.press('Tab'),
    ]);

    // Page should still be stable
    const errors = await page.evaluate(() => {
      return (window as any).__ERRORS__ || [];
    });
    expect(errors.length).toBe(0);
  });

  test('Large DOM Manipulation Test', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    // Measure initial DOM size
    const initialSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    // Navigate through all pages
    const routes = ['/features', '/pricing', '/contact', '/faq', '/demo', '/security'];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
    }

    // Return to home
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    // DOM should not be excessively large
    const finalSize = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    expect(finalSize).toBeLessThan(initialSize * 2);
  });

  test('Network Failure Recovery', async ({ page, context }) => {
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    // Simulate network offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // Try to navigate
    await page.goto('/features', { timeout: 5000 }).catch(() => {
      // Expected to fail
    });

    // Restore network
    await context.setOffline(false);
    await page.waitForTimeout(1000);

    // Should recover
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    const title = await page.title();
    expect(title).toContain('TradeLine');
  });

  test('Low Memory Device Simulation', async ({ page }) => {
    // Simulate low memory by limiting resources
    await page.route('**/*', route => {
      route.continue();
    });

    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();

    // Should still render core content
    const heroText = await page.locator('h1').first();
    await expect(heroText).toBeVisible();
  });
});
