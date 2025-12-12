 
/**
 * Preview Environment Health Tests
 * Automated tests to ensure preview environment works correctly
 */

import { test, expect } from '@playwright/test';

const SAFE_MODE_LOG = '[SAFE MODE] Enabled via ?safe=1';

test.describe('Preview Environment Health', () => {
  test('should load without blank screen', async ({ page }) => {
    await page.goto('/');
    
    // Wait for React to mount by checking for __REACT_READY__ signal
    await page.waitForFunction(() => (window as any).__REACT_READY__ === true, { timeout: 10000 });
    
    // Check root element is visible
    const root = await page.locator('#root');
    await expect(root).toBeVisible();
    
    // Check opacity is 1
    const opacity = await root.evaluate(el => window.getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeGreaterThan(0.9);
    
    // Check there's actual content
    const content = await page.textContent('#root');
    expect(content?.length).toBeGreaterThan(100);
  });

  test('should not redirect in preview environment', async ({ page }) => {
    const initialUrl = '/';
    await page.goto(initialUrl);
    
    // Wait a bit to see if any redirects happen
    await page.waitForTimeout(2000);
    
    // Should still be on the same origin
    const currentUrl = page.url();
    expect(currentUrl).toContain(initialUrl);
  });

  test('should show no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out known non-critical errors
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('404') &&
      !err.includes('DevTools') &&
      !err.includes('Global error caught')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have service worker disabled in dev', async ({ page }) => {
    await page.goto('/');
    
    const swCount = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return registrations.length;
      }
      return 0;
    });
    
    // Should be 0 in development/preview
    expect(swCount).toBe(0);
  });

  test('should load main navigation elements', async ({ page }) => {
    await page.goto('/');
    
    // Wait for React to mount
    await page.waitForFunction(() => (window as any).__REACT_READY__ === true, { timeout: 10000 });

    // Check for header
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // Check for main content area
    const main = page.locator('main').first();
    await expect(main).toBeVisible();
  });

  test.skip('should have working error boundary', async ({ page }) => {
    await page.goto('/preview-health?testErrorBoundary=1');
    
    await expect(page.getByRole('heading', { name: /something went wrong/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /reload page/i })).toBeVisible();
  });

  test('safe mode should work with ?safe=1', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => {
      logs.push(msg.text());
    });

    await page.goto('/?safe=1', { waitUntil: 'load' });

    // CRITICAL: Wait for Safe Mode detection to complete
    await page.waitForFunction(
      () => document.body.hasAttribute('data-safe-mode'),
      { timeout: process.env.CI ? 10000 : 5000 }
    );

    const safeAttr = await page.getAttribute('body', 'data-safe-mode');
    expect(safeAttr).toBe('true');

    const hasSafeModeLog = logs.some(log => log.includes(SAFE_MODE_LOG));
    expect(hasSafeModeLog).toBeTruthy();
  });

  test('should have fast initial load time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds (relaxed for Windows CI builds)
    expect(loadTime).toBeLessThan(10000);
  });

  test('should render hero section', async ({ page }) => {
    await page.goto('/');
    
    // Wait for React to mount
    await page.waitForFunction(() => (window as any).__REACT_READY__ === true, { timeout: 10000 });
    
    // Look for main headline
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    
    const text = await h1.textContent();
    expect(text?.length).toBeGreaterThan(10);
  });

  test('should not have z-index issues', async ({ page }) => {
    await page.goto('/');
    
    // Wait for React to mount
    await page.waitForFunction(() => (window as any).__REACT_READY__ === true, { timeout: 10000 });
    
    // Check header z-index is high enough
    const header = page.locator('header').first();
    const zIndex = await header.evaluate(el => window.getComputedStyle(el).zIndex);
    
    expect(parseInt(zIndex) || 0).toBeGreaterThanOrEqual(40);
  });
});

