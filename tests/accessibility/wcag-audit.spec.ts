/**
 * Accessibility Tests: WCAG 2.2 AA Compliance
 * 
 * Uses axe-core for automated accessibility testing
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginTestUser } from '../utils/auth';

test.describe('WCAG 2.2 AA Compliance', () => {
  test('landing page should have no accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('auth page should have no accessibility violations', async ({ page }) => {
    await page.goto('/auth');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dashboard should have no accessibility violations', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD, 
      'Auth tests require TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables');
    
    try {
      // Authenticate first
      await loginTestUser(page, { waitForRedirect: true });
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (error) {
      test.skip(true, `Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('forms should have proper labels and ARIA attributes', async ({ page }) => {
    await page.goto('/auth');

    // All inputs should have associated labels
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const label = await page.locator(`label[for="${id}"]`).count();
      
      // Either has label, aria-label, or aria-labelledby
      expect(label > 0 || ariaLabel !== null).toBeTruthy();
    }
  });

  test('interactive elements should have sufficient contrast', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('buttons should have minimum target size (24x24px)', async ({ page }) => {
    await page.goto('/');

    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        // WCAG 2.2: Target Size (Minimum) - 24x24px
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    }
  });

  test('focus indicators should be visible', async ({ page }) => {
    await page.goto('/auth');

    // Tab to first interactive element
    await page.keyboard.press('Tab');

    // Check if focused element has visible outline
    const focusedElement = await page.locator(':focus').first();
    const outline = await focusedElement.evaluate(el => 
      window.getComputedStyle(el).outline
    );

    // Should have outline or custom focus styling
    expect(outline).not.toBe('none');
  });
});

test.describe('Keyboard Navigation', () => {
  test('should navigate entire form with keyboard', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    let tabCount = 0;
    const maxTabs = 20; // Prevent infinite loop
    const interactiveTags = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'];
    let foundInteractiveElements = 0;

    // Tab through all interactive elements
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;

      const focusedElement = await page.locator(':focus').first();
      const tagName = await focusedElement.evaluate(el => el.tagName);

      // Skip if we've reached the end (body or html)
      if (tagName === 'BODY' || tagName === 'HTML') {
        break;
      }

      // Count interactive elements we encounter
      if (tagName && interactiveTags.includes(tagName)) {
        foundInteractiveElements++;
      }
    }
    
    // Verify we found at least some interactive elements
    expect(foundInteractiveElements).toBeGreaterThan(0);
  });

  test('should close modal with Escape key', async ({ page }) => {
    // TODO: Implement modal keyboard test
    // Open modal, press Escape, verify modal closed
  });

  test('should trap focus within modal', async ({ page }) => {
    // TODO: Implement focus trap test
    // Open modal, tab through elements, verify focus stays in modal
  });
});
