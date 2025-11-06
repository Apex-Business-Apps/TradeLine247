import { Page, expect } from '@playwright/test';

/**
 * Wait for React hydration to complete.
 * Ensures the header and critical UI elements are mounted before tests proceed.
 */
export async function waitForReactHydration(page: Page, timeout = 30000): Promise<void> {
  // Wait for the app header to be present and visible (key indicator React has hydrated)
  await expect(page.locator('#app-header')).toBeVisible({ timeout });

  // Wait for DOM to be fully loaded
  await page.waitForLoadState('domcontentloaded');

  // Small buffer for any final React effects
  await page.waitForTimeout(100);
}

/**
 * Disable all CSS animations and transitions for deterministic test execution.
 * Injected CSS takes precedence over all other styles.
 */
export async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
    `,
  });
}

/**
 * Navigate to a page and wait for React hydration.
 * Use this instead of page.goto() for all E2E tests.
 */
export async function gotoAndWait(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await disableAnimations(page);
  await waitForReactHydration(page);
}
