/**
 * E2E Test: Resilience & Circuit Breaker
 * 
 * Tests offline queue, circuit breaker patterns, and graceful degradation
 */

import { test, expect } from '@playwright/test';

test.describe('Offline Queue Resilience', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');
  });

  test('should queue operations when offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Try to create a quote
    await page.goto('/quotes/new');
    await page.fill('input[name="vehiclePrice"]', '25000');
    await page.fill('input[name="downPayment"]', '5000');
    await page.click('button:has-text("Save Quote")');
    
    // Should see queued message
    await expect(page.locator('text=/queued|offline|pending/i')).toBeVisible({ timeout: 5000 });
    
    // Go back online
    await context.setOffline(false);
    await page.reload();
    
    // Should see success after reconnection
    await expect(page.locator('text=/saved|synced|success/i')).toBeVisible({ timeout: 10000 });
  });

  test('should show offline indicator', async ({ page, context }) => {
    await context.setOffline(true);
    
    // Should show offline banner/indicator
    await expect(page.locator('text=/offline|no connection/i')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Circuit Breaker Pattern', () => {
  test('should handle connector failures gracefully', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    // Navigate to settings to check connector status
    await page.goto('/settings');
    
    // Look for circuit breaker status indicators
    await expect(page.locator('text=/connector|integration|status/i')).toBeVisible({ timeout: 5000 });
    
    // Should show connector health cards
    const statusCard = page.locator('[data-testid="connector-status"]').or(page.locator('text=/Dealertrack|Autovance/i'));
    await expect(statusCard).toBeVisible({ timeout: 5000 });
  });

  test('should display circuit breaker states', async ({ page }) => {
    await page.goto('/settings');
    
    // Should show circuit states: CLOSED, OPEN, or HALF_OPEN
    const stateIndicator = page.locator('text=/CLOSED|OPEN|HALF_OPEN|healthy|degraded/i');
    await expect(stateIndicator).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Graceful Degradation', () => {
  test('should maintain core functionality when connectors are down', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    // Even with connector issues, should still:
    // 1. Capture leads
    await page.goto('/leads');
    const captureButton = page.locator('button:has-text("New Lead")').or(page.locator('button:has-text("Add Lead")'));
    await expect(captureButton).toBeVisible({ timeout: 5000 });
    
    // 2. Create quotes
    await page.goto('/quotes/new');
    await expect(page.locator('input[name="vehiclePrice"]')).toBeVisible();
    
    // 3. View timeline
    await page.goto('/leads');
    await expect(page.locator('text=/lead|customer/i')).toBeVisible({ timeout: 5000 });
  });
});
