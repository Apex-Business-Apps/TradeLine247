/**
 * Accessibility Tests: WCAG 2.2 AA Compliance
 * 
 * Uses axe-core for automated accessibility testing
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
    // Authenticate first
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

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

    let tabCount = 0;
    const maxTabs = 20; // Prevent infinite loop

    // Tab through all interactive elements
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;

      const focusedElement = await page.locator(':focus').first();
      const tagName = await focusedElement.evaluate(el => el.tagName);

      // Verify focused element is interactive
      if (tagName) {
        expect(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A']).toContain(tagName);
      }
    }
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
