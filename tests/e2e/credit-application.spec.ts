/**
 * E2E Test: Credit Application Flow
 * 
 * Tests FCRA compliance, GLBA security, ESIGN consent
 */

import { test, expect } from '@playwright/test';

test.describe('Credit Application Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');
    await page.goto('/credit-apps/new');
  });

  test('should complete solo credit application with FCRA consent', async ({ page }) => {
    // Step 1: Applicant Information
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', 'jane.smith@example.com');
    await page.fill('input[name="phone"]', '+1 647-555-0199');
    await page.fill('input[name="dateOfBirth"]', '1985-05-15');
    await page.fill('input[name="ssn"]', '123-45-6789');
    await page.fill('input[name="address"]', '123 Main Street');
    await page.fill('input[name="city"]', 'Toronto');
    await page.selectOption('select[name="province"]', 'ON');
    await page.fill('input[name="postalCode"]', 'M5V 3A8');

    await page.click('button:has-text("Next")');

    // Step 2: Employment
    await page.fill('input[name="employer"]', 'Acme Corp');
    await page.fill('input[name="occupation"]', 'Software Engineer');
    await page.fill('input[name="employmentLength"]', '5');
    await page.fill('input[name="monthlyIncome"]', '7500');

    await page.click('button:has-text("Next")');

    // Step 3: Consent & Disclosures
    // FCRA Section 604 - Permissible Purpose
    await expect(page.locator('text=/Fair Credit Reporting Act/i')).toBeVisible();
    
    // GLBA Safeguards
    await expect(page.locator('text=/Gramm-Leach-Bliley/i')).toBeVisible();
    
    // ESIGN Act - E-Signature Consent
    await expect(page.locator('text=/Electronic Signatures/i')).toBeVisible();

    // Check all required consents
    await page.check('input[name="fcraConsent"]');
    await page.check('input[name="glbaAcknowledge"]');
    await page.check('input[name="esignConsent"]');

    // E-Signature
    await page.fill('input[name="signature"]', 'Jane Smith');

    await page.click('button:has-text("Submit Application")');

    // Verify success
    await expect(page.locator('text=/Application submitted/i')).toBeVisible();

    // Verify consent logged (audit event should be created)
    // TODO: Add API verification
  });

  test('should allow co-applicant addition', async ({ page }) => {
    // Fill primary applicant
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    // ... fill other required fields

    // Toggle co-applicant
    await page.click('button:has-text("Add Co-Applicant")');

    // Fill co-applicant
    await expect(page.locator('text=/Co-Applicant Information/i')).toBeVisible();
    await page.fill('input[name="coFirstName"]', 'Emily');
    await page.fill('input[name="coLastName"]', 'Doe');
    // ... fill co-applicant fields

    await page.click('button:has-text("Next")');
    // Continue through remaining steps
  });

  test('should validate required fields before submission', async ({ page }) => {
    // Attempt to submit without filling required fields
    await page.click('button:has-text("Next")');

    // Verify validation errors
    await expect(page.locator('text=/First name is required/i')).toBeVisible();
    await expect(page.locator('text=/Email is required/i')).toBeVisible();
  });

  test('should enforce FCRA consent requirement', async ({ page }) => {
    // Fill all fields but skip FCRA consent
    // ... fill applicant and employment sections ...
    
    // Navigate to consent step
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');

    // Try to submit without FCRA consent
    await page.click('button:has-text("Submit Application")');

    // Verify error message
    await expect(page.locator('text=/You must consent to credit check/i')).toBeVisible();
  });
});

test.describe('Credit Application Export', () => {
  test('should export to Dealertrack format', async ({ page }) => {
    // TODO: Implement Dealertrack export test
    // Submit credit app
    // Click "Export to Dealertrack"
    // Verify API call made with correct format
  });
});
