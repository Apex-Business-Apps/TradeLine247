/**
 * Accessibility Test: Complete WCAG 2.2 AA Audit
 * 
 * Comprehensive accessibility validation across all pages
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Complete WCAG 2.2 AA Compliance', () => {
  const pages = [
    { name: 'Landing', path: '/' },
    { name: 'Auth', path: '/auth' },
    { name: 'Dashboard', path: '/dashboard', requiresAuth: true },
    { name: 'Leads', path: '/leads', requiresAuth: true },
    { name: 'Quotes', path: '/quotes', requiresAuth: true },
    { name: 'Settings', path: '/settings', requiresAuth: true },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name} page should have no WCAG violations`, async ({ page }) => {
      if (pageInfo.requiresAuth) {
        await page.goto('/auth');
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'TestPass123!');
        await page.click('button:has-text("Sign In")');
        await page.waitForURL('/dashboard');
      }
      
      await page.goto(pageInfo.path);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();
      
      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const levels: number[] = [];
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      levels.push(parseInt(tagName[1]));
    }
    
    // Should have exactly one H1
    expect(levels.filter(l => l === 1).length).toBe(1);
    
    // No skipped levels
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have alt text for all images', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt!.length).toBeGreaterThan(0);
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/auth');
    
    // Tab through focusable elements
    const focusableSelectors = [
      'input[type="email"]',
      'input[type="password"]',
      'button[type="submit"]'
    ];
    
    for (let i = 0; i < focusableSelectors.length; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName + (el.getAttribute('type') ? `[type="${el.getAttribute('type')}"]` : '') : '';
      });
      
      console.log(`Focus ${i}: ${focused}`);
    }
    
    // Verify last element is focused
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/auth');
    
    const button = page.locator('button').first();
    await button.focus();
    
    const outline = await button.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });
    
    expect(outline).toBeTruthy();
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/auth');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['label'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support screen readers', async ({ page }) => {
    await page.goto('/');
    
    // Check for ARIA landmarks
    const landmarks = await page.locator('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]').all();
    expect(landmarks.length).toBeGreaterThan(0);
    
    // Check for proper ARIA labels on interactive elements
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Button should have either text content or aria-label
      expect(ariaLabel || text?.trim()).toBeTruthy();
    }
  });

  test('should handle reduced motion preference', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Verify animations are reduced or disabled
    const animatedElements = await page.locator('[class*="animate"]').all();
    
    for (const el of animatedElements.slice(0, 3)) {
      const animationDuration = await el.evaluate(el => {
        return window.getComputedStyle(el).animationDuration;
      });
      
      // Animation should be instant or very short
      expect(parseFloat(animationDuration)).toBeLessThanOrEqual(0.1);
    }
  });
});
