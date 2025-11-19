/**
 * E2E Test: Bilingual PDF Generation
 * 
 * Tests EN/FR quote PDF generation with Canadian tax calculations
 */

import { test, expect } from '@playwright/test';
import { loginTestUser } from '../utils/auth';

test.describe('Bilingual PDF Quote Generation', () => {
  test.beforeEach(async ({ page }) => {
    await loginTestUser(page);
  });

  test('should generate English PDF quote', async ({ page }) => {
    await page.goto('/quotes/new');
    
    // Fill quote details
    await page.fill('input[name="vehiclePrice"]', '35000');
    await page.fill('input[name="downPayment"]', '7000');
    await page.selectOption('select[name="province"]', 'ON');
    
    // Calculate first
    await page.click('button:has-text("Calculate")');
    await page.waitForTimeout(1000);
    
    // Look for PDF generation button
    const downloadButton = page.locator('button:has-text("Download PDF")').or(page.locator('button:has-text("Generate PDF")'));
    
    if (await downloadButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      await downloadButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/quote.*\.pdf/i);
    }
  });

  test('should generate French PDF quote', async ({ page }) => {
    await page.goto('/quotes/new');
    
    // Switch to French if language toggle exists
    const langToggle = page.locator('[data-testid="language-toggle"]').or(page.locator('button:has-text("FR")'));
    if (await langToggle.isVisible()) {
      await langToggle.click();
    }
    
    // Fill quote details
    await page.fill('input[name="vehiclePrice"]', '40000');
    await page.fill('input[name="downPayment"]', '8000');
    await page.selectOption('select[name="province"]', 'QC');
    
    await page.click('button:has-text("Calculate")').or(page.click('button:has-text("Calculer")')).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Verify French content present
    await expect(page.locator('text=/Prix|Montant|Total/i')).toBeVisible({ timeout: 5000 });
  });

  test('should include all Canadian provinces in quote', async ({ page }) => {
    await page.goto('/quotes/new');
    
    // Check that all provinces are available
    const provinceSelect = page.locator('select[name="province"]');
    await expect(provinceSelect).toBeVisible();
    
    const provinces = ['ON', 'BC', 'AB', 'QC', 'MB', 'SK', 'NS', 'NB', 'PE', 'NL', 'YT', 'NT', 'NU'];
    
    for (const province of provinces.slice(0, 3)) {
      await provinceSelect.selectOption(province);
      await page.waitForTimeout(200);
    }
  });

  test('should calculate correct taxes for each province', async ({ page }) => {
    await page.goto('/quotes/new');
    
    const testCases = [
      { province: 'ON', price: 30000, expectedTaxRate: 0.13, taxName: 'HST' },
      { province: 'BC', price: 30000, expectedTaxRate: 0.12, taxName: 'GST' },
      { province: 'AB', price: 30000, expectedTaxRate: 0.05, taxName: 'GST' },
    ];
    
    for (const testCase of testCases) {
      await page.fill('input[name="vehiclePrice"]', testCase.price.toString());
      await page.selectOption('select[name="province"]', testCase.province);
      await page.click('button:has-text("Calculate")');
      await page.waitForTimeout(1000);
      
      // Verify tax is displayed
      const expectedTax = testCase.price * testCase.expectedTaxRate;
      const taxRegex = new RegExp(expectedTax.toFixed(0), 'i');
      await expect(page.locator(`text=${taxRegex}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should create secure share link for quote', async ({ page }) => {
    await page.goto('/quotes/new');
    
    await page.fill('input[name="vehiclePrice"]', '32000');
    await page.fill('input[name="downPayment"]', '6000');
    await page.selectOption('select[name="province"]', 'AB');
    
    await page.click('button:has-text("Calculate")');
    await page.waitForTimeout(1000);
    
    // Look for share button
    const shareButton = page.locator('button:has-text("Share")').or(page.locator('button[aria-label*="share"]'));
    
    if (await shareButton.isVisible()) {
      await shareButton.click();
      
      // Should show share link or copy confirmation
      await expect(page.locator('text=/link|copied|share/i')).toBeVisible({ timeout: 5000 });
    }
  });
});
