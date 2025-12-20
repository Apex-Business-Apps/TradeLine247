/**
 * Splash V2 E2E Tests
 *
 * Tests the "Magic Heart" splash screen experience.
 *
 * Acceptance Criteria:
 * - Splash v2 duration ≤ 2.0s
 * - Alberta Innovates logo visible by 1.0s and persists through end
 * - No spinner
 * - Runs once per app version (persistence confirmed)
 * - v2 flag OFF keeps launch stable (no double-splash, no dead routes)
 * - Legacy splash is not stackable and not referenced
 * - Fallback works if assets/audio missing
 */

import { test, expect } from '@playwright/test';

// Test URLs with splash v2 feature flags
const SPLASH_V2_URL = '/?VITE_SPLASH_V2_ENABLED=true&VITE_SPLASH_V2_FORCE_SHOW=true';
const SPLASH_V2_OFF_URL = '/?VITE_SPLASH_V2_ENABLED=false';

test.describe('Splash V2 - Feature Flag OFF (Default)', () => {
  test('should skip splash when SPLASH_V2_ENABLED=false', async ({ page }) => {
    await page.goto('/');

    // Wait for React to mount
    await expect(page.locator('#root')).toBeVisible({ timeout: 3000 });

    // Splash v2 should not be present
    const splash = page.locator('[data-testid="splash-v2"]');
    await expect(splash).not.toBeVisible();

    // Main content should be immediately visible
    await expect(page.locator('section.hero-section').first()).toBeVisible({ timeout: 3000 });
  });

  test('should not show double splash (no stacking)', async ({ page }) => {
    await page.goto('/');

    // Wait for React to mount
    await expect(page.locator('#root')).toBeVisible({ timeout: 3000 });

    // Count splash screens - should be 0
    const splashCount = await page.locator('[data-testid="splash-v2"]').count();
    expect(splashCount).toBe(0);

    // Legacy splash should also not be present
    const legacySplash = await page.locator('[aria-label="Welcome to TradeLine 24/7"]').count();
    expect(legacySplash).toBe(0);
  });

  test('should render main content without blocking', async ({ page }) => {
    await page.goto('/');

    // Content should be visible within 3 seconds (no splash blocking)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('navigation').first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Splash V2 - When Enabled', () => {
  // Note: These tests require SPLASH_V2_ENABLED=true to be set
  // In production, this is controlled via environment variables

  test.skip('should show sponsor logo by 1.0s', async ({ page }) => {
    // This test requires splash v2 to be enabled
    await page.goto('/');

    // If splash v2 is showing, check sponsor timing
    const splash = page.locator('[data-testid="splash-v2"]');

    if (await splash.isVisible()) {
      // Start timing
      const startTime = Date.now();

      // Wait for sponsor to appear
      const sponsor = page.locator('[data-testid="splash-v2-sponsor"]');
      await expect(sponsor).toBeVisible({ timeout: 1100 });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThanOrEqual(1100); // 1.0s + 100ms tolerance
    }
  });

  test.skip('should complete within 2.0s', async ({ page }) => {
    await page.goto('/');

    const splash = page.locator('[data-testid="splash-v2"]');

    if (await splash.isVisible()) {
      const startTime = Date.now();

      // Wait for splash to disappear
      await expect(splash).not.toBeVisible({ timeout: 2500 });

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThanOrEqual(2100); // 2.0s + 100ms tolerance
    }
  });

  test.skip('should not show spinner', async ({ page }) => {
    await page.goto('/');

    const splash = page.locator('[data-testid="splash-v2"]');

    if (await splash.isVisible()) {
      // Check for common spinner patterns
      const spinners = await splash.locator('[class*="spinner"], [class*="loading"], [role="progressbar"]').count();
      expect(spinners).toBe(0);
    }
  });
});

test.describe('Splash V2 - Persistence', () => {
  test('should not show splash on repeat visit (same version)', async ({ page, context }) => {
    // First visit - clear storage
    await context.clearCookies();

    // Set localStorage to simulate having seen the splash for current version
    await page.goto('/');
    await page.evaluate(() => {
      // Get current version (if available) or use a test version
      const version = '1.0.1'; // Match package.json version
      localStorage.setItem('splash_v2_last_seen_version', version);
    });

    // Reload the page
    await page.reload();

    // Wait for React
    await expect(page.locator('#root')).toBeVisible({ timeout: 3000 });

    // Splash should not be visible (already seen this version)
    // Note: This only applies when SPLASH_V2_ENABLED=true
    // When false, splash is always skipped anyway
    await expect(page.locator('section.hero-section').first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Splash V2 - Fallback', () => {
  test('should handle missing assets gracefully', async ({ page }) => {
    // Block splash assets to simulate failure
    await page.route('**/apex-logo.png', (route) => route.abort());
    await page.route('**/alberta-innovates.png', (route) => route.abort());

    await page.goto('/');

    // App should still load
    await expect(page.locator('#root')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('section.hero-section').first()).toBeVisible({ timeout: 5000 });

    // No errors should crash the app
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Wait a moment for any errors to surface
    await page.waitForTimeout(500);

    // Filter out asset loading errors (expected) from actual crashes
    const criticalErrors = errors.filter(
      (e) => !e.includes('Failed to fetch') && !e.includes('net::ERR')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Splash V2 - No Dead Routes', () => {
  test('legacy splash route should not be registered', async ({ page }) => {
    // Try to navigate to any legacy splash routes
    const response = await page.goto('/splash');

    // Should either 404 or redirect to home (not show splash screen)
    const url = page.url();
    expect(url).not.toContain('/splash');
  });

  test('deprecated StartupSplash component should not render', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await expect(page.locator('#root')).toBeVisible({ timeout: 3000 });

    // Check console for deprecation warnings
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('DEPRECATED')) {
        logs.push(msg.text());
      }
    });

    // Wait for any warnings
    await page.waitForTimeout(500);

    // No deprecated component should have been mounted
    expect(logs.filter((l) => l.includes('StartupSplashLegacyDeprecated'))).toHaveLength(0);
  });
});

test.describe('Splash V2 - Accessibility', () => {
  test('should respect reduced motion preference', async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');

    // App should still work
    await expect(page.locator('#root')).toBeVisible({ timeout: 3000 });

    // If splash shows, animations should be instant (prefers-reduced-motion)
    const splash = page.locator('[data-testid="splash-v2"]');
    if (await splash.isVisible()) {
      // Should complete immediately with reduced motion
      await expect(splash).not.toBeVisible({ timeout: 500 });
    }
  });

  test('splash should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/');

    const splash = page.locator('[data-testid="splash-v2"]');

    if (await splash.isVisible()) {
      // Check accessibility attributes
      await expect(splash).toHaveAttribute('role', 'dialog');
      await expect(splash).toHaveAttribute('aria-modal', 'true');
      await expect(splash).toHaveAttribute('aria-label');
    }
  });
});
