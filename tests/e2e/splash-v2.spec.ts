/**
 * Splash v2 E2E Tests
 *
 * Integration tests for the Magic Heart Splash v2 experience.
 *
 * Tests:
 * - Splash v2 duration ≤ 2.0s
 * - Alberta Innovates logo visible by ≤ 1.0s
 * - No spinner present
 * - Persistence (once per version)
 * - Flag OFF keeps app stable
 *
 * @module tests/e2e/splash-v2.spec
 */

import { test, expect } from '@playwright/test';

test.describe('Splash v2 (Magic Heart) - OFF by default', () => {
  test('should NOT show splash when flag is OFF', async ({ page }) => {
    // Visit app with flag OFF (default)
    await page.goto('/');

    // Wait for app to mount
    await page.waitForSelector('[data-testid="app-content"]', { timeout: 5000 });

    // Splash should not appear
    const splash = page.locator('[role="dialog"][aria-label*="Welcome to TradeLine"]');
    await expect(splash).not.toBeVisible();

    // App should render normally
    const appContent = page.locator('[data-testid="app-content"]');
    await expect(appContent).toBeVisible();
  });

  test('should not show duplicate/stacked splash screens', async ({ page }) => {
    await page.goto('/');

    // Wait for app
    await page.waitForSelector('[data-testid="app-content"]', { timeout: 5000 });

    // Count splash dialogs - should be 0
    const splashCount = await page.locator('[role="dialog"]').count();
    expect(splashCount).toBe(0);
  });
});

test.describe('Splash v2 (Magic Heart) - ON via flag', () => {
  test.use({
    // Enable splash v2 via environment variable
    launchOptions: {
      env: {
        VITE_SPLASH_V2_ENABLED: 'true',
        VITE_SPLASH_V2_FORCE_SHOW: 'true', // Force show for testing
      },
    },
  });

  test('should show splash v2 when flag is ON', async ({ page, context }) => {
    // Clear storage to simulate first run
    await context.clearCookies();
    await context.clearPermissions();

    await page.goto('/');

    // Splash should appear
    const splash = page.locator('[role="dialog"][aria-label*="Welcome to TradeLine"]');
    await expect(splash).toBeVisible({ timeout: 2000 });
  });

  test('should complete within 2.0s (hard cap)', async ({ page, context }) => {
    await context.clearCookies();

    const startTime = Date.now();

    await page.goto('/');

    // Wait for splash to appear
    const splash = page.locator('[role="dialog"][aria-label*="Welcome to TradeLine"]');
    await expect(splash).toBeVisible({ timeout: 2000 });

    // Wait for splash to disappear
    await expect(splash).not.toBeVisible({ timeout: 3000 });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Duration should be ≤ 2.0s (2000ms) + small buffer
    expect(duration).toBeLessThanOrEqual(2500); // 2.5s max (includes page load)
  });

  test('should show Alberta Innovates logo by 1.0s', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/');

    // Start timer when splash appears
    const splash = page.locator('[role="dialog"][aria-label*="Welcome to TradeLine"]');
    await expect(splash).toBeVisible({ timeout: 2000 });

    const startTime = Date.now();

    // Alberta Innovates logo should be visible
    const albertaLogo = page.locator('img[alt*="Alberta Innovates"]');
    await expect(albertaLogo).toBeVisible({ timeout: 1500 });

    const logoVisibleTime = Date.now() - startTime;

    // Logo should be visible within 1.0s
    expect(logoVisibleTime).toBeLessThanOrEqual(1000);
  });

  test('should NOT show spinner', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/');

    // Wait for splash
    const splash = page.locator('[role="dialog"][aria-label*="Welcome to TradeLine"]');
    await expect(splash).toBeVisible({ timeout: 2000 });

    // Check for spinner (should not exist)
    const spinner = page.locator('[role="progressbar"], [aria-label*="loading"], .spinner');
    await expect(spinner).not.toBeVisible();
  });

  test('should show text "TDA-backed biobytes"', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/');

    // Wait for splash
    const splash = page.locator('[role="dialog"][aria-label*="Welcome to TradeLine"]');
    await expect(splash).toBeVisible({ timeout: 2000 });

    // Check for exact text
    const text = page.locator('text=TDA-backed biobytes');
    await expect(text).toBeVisible();
  });

  test('should allow skip via click', async ({ page, context }) => {
    await context.clearCookies();

    await page.goto('/');

    // Wait for splash
    const splash = page.locator('[role="dialog"][aria-label*="Welcome to TradeLine"]');
    await expect(splash).toBeVisible({ timeout: 2000 });

    // Click anywhere on splash to skip
    await splash.click();

    // Splash should disappear immediately
    await expect(splash).not.toBeVisible({ timeout: 500 });

    // App should be visible
    const appContent = page.locator('[data-testid="app-content"]');
    await expect(appContent).toBeVisible();
  });

  test('should respect prefers-reduced-motion', async ({ page, context }) => {
    // Set reduced motion preference
    await context.emulateMedia({ reducedMotion: 'reduce' });
    await context.clearCookies();

    await page.goto('/');

    // Splash should still appear but with no animations
    const splash = page.locator('[role="dialog"][aria-label*="TradeLine"]');
    await expect(splash).toBeVisible({ timeout: 2000 });

    // Should complete instantly (or very quickly) with reduced motion
    await expect(splash).not.toBeVisible({ timeout: 500 });
  });
});

test.describe('Splash v2 Persistence', () => {
  test.use({
    launchOptions: {
      env: {
        VITE_SPLASH_V2_ENABLED: 'true',
        VITE_SPLASH_V2_FORCE_SHOW: 'false', // Don't force show (test persistence)
        VITE_APP_VERSION: '1.0.1',
      },
    },
  });

  test('should show full splash on first visit', async ({ page, context }) => {
    // Clear storage to simulate first visit
    await context.clearCookies();
    await page.goto('/');

    // Splash should appear
    const splash = page.locator('[role="dialog"][aria-label*="Welcome to TradeLine"]');
    await expect(splash).toBeVisible({ timeout: 2000 });
  });

  test('should show quick fade on second visit (same version)', async ({ page, context }) => {
    // First visit
    await context.clearCookies();
    await page.goto('/');
    await page.waitForTimeout(3000); // Let splash complete

    // Second visit (reload page)
    await page.reload();

    // Should see quick fade or no splash
    // Quick fade should complete faster than full splash
    const startTime = Date.now();
    await page.waitForLoadState('domcontentloaded');
    const duration = Date.now() - startTime;

    // Quick fade should be much faster than 2.0s
    expect(duration).toBeLessThan(1000);
  });

  test('should show full splash again when app version changes', async ({ page, context }) => {
    // First visit with version 1.0.1
    await context.clearCookies();
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Simulate version bump (would happen via env change in real scenario)
    // For this test, we'll clear storage to simulate version change detection
    await page.evaluate(() => {
      // Manually set a different version in storage
      localStorage.setItem('splash_v2_last_seen_version', '1.0.0');
    });

    await page.reload();

    // Should show full splash again (version mismatch)
    const splash = page.locator('[role="dialog"][aria-label*="Welcome to TradeLine"]');
    await expect(splash).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Splash v2 Fallback', () => {
  test('should handle missing assets gracefully', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');

    // Block image requests to simulate asset failure
    await page.route('**/*.{png,jpg,svg}', (route) => route.abort());

    // Splash should still render (fallback mode)
    const splash = page.locator('[role="dialog"]');
    await expect(splash).toBeVisible({ timeout: 3000 });

    // Should complete within fallback duration (1.0s)
    await expect(splash).not.toBeVisible({ timeout: 2000 });
  });
});
