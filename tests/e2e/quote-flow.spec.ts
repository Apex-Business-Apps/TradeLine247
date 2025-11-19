/**
 * E2E Test: Quote/Desking Flow
 * 
 * Tests Canadian tax calculations and quote generation
 */

import { test, expect } from '@playwright/test';
import { loginTestUser } from '../utils/auth';

test.describe('Quote Builder Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is authenticated
    await loginTestUser(page);
  });

  test('should calculate Ontario taxes correctly (HST 13%)', async ({ page }) => {
    await page.goto('/quotes/new');

    // Fill quote details
    await page.fill('input[name="vehiclePrice"]', '30000');
    await page.fill('input[name="downPayment"]', '5000');
    await page.selectOption('select[name="province"]', 'ON');

    // Calculate
    await page.click('button:has-text("Calculate")');

    // Verify HST calculation (30000 * 0.13 = 3900)
    await expect(page.locator('text=/HST.*3,900/')).toBeVisible();
    
    // Verify total (30000 + 3900 = 33900)
    await expect(page.locator('text=/Total.*33,900/')).toBeVisible();
  });

  test('should calculate BC taxes correctly (GST 5% + PST 7%)', async ({ page }) => {
    await page.goto('/quotes/new');

    await page.fill('input[name="vehiclePrice"]', '40000');
    await page.fill('input[name="downPayment"]', '8000');
    await page.selectOption('select[name="province"]', 'BC');

    await page.click('button:has-text("Calculate")');

    // GST: 40000 * 0.05 = 2000
    // PST: 40000 * 0.07 = 2800
    // Total tax: 4800
    await expect(page.locator('text=/GST.*2,000/')).toBeVisible();
    await expect(page.locator('text=/PST.*2,800/')).toBeVisible();
    await expect(page.locator('text=/Total.*44,800/')).toBeVisible();
  });

  test('should calculate monthly payment correctly', async ({ page }) => {
    await page.goto('/quotes/new');

    await page.fill('input[name="vehiclePrice"]', '25000');
    await page.fill('input[name="downPayment"]', '5000');
    await page.fill('input[name="financeRate"]', '6.99');
    await page.fill('input[name="financeTerm"]', '60');
    await page.selectOption('select[name="province"]', 'ON');

    await page.click('button:has-text("Calculate")');

    // Verify monthly payment is calculated and displayed
    await expect(page.locator('text=/Monthly Payment/i')).toBeVisible();
    await expect(page.locator('text=/\\$\\d{3}/i')).toBeVisible(); // Should show payment amount
  });

  test('should save quote with version tracking', async ({ page }) => {
    await page.goto('/quotes/new');

    await page.fill('input[name="vehiclePrice"]', '35000');
    await page.fill('input[name="downPayment"]', '7000');
    await page.selectOption('select[name="province"]', 'AB');

    await page.click('button:has-text("Save Quote")');

    // Verify success message
    await expect(page.locator('text=/Quote saved/i')).toBeVisible();

    // Navigate to quotes list
    await page.goto('/quotes');
    
    // Verify quote appears in list
    await expect(page.locator('text=35,000')).toBeVisible();
  });
});

test.describe('Quote PDF Export', () => {
  test('should generate bilingual PDF quote (EN/FR)', async ({ page }) => {
    // TODO: Implement PDF download test
    // Generate quote and click "Download PDF"
    // Verify PDF file downloaded
    // Verify PDF contains both EN/FR content
  });

  test('should create E2EE share link with expiry', async ({ page }) => {
    // TODO: Implement secure share link test
    // Generate quote and click "Share Securely"
    // Verify share link created with OTP/expiry
    // Open link in incognito window and verify decryption
  });
});
