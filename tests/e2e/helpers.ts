 
import { Page, expect } from '@playwright/test';

/**
 * Wait for React hydration to complete using explicit signal.
 * This is the most reliable method - main.tsx sets window.__REACT_READY__ after mount.
 */
export async function waitForReactHydration(page: Page, timeout = 45000): Promise<void> {
  // Wait for explicit React ready signal from main.tsx
  await page.waitForFunction(() => (window as any).__REACT_READY__ === true, { timeout });

  // Additional safety: wait for app header to be attached first
  const header = page.locator('header[data-site-header]');
  await expect(header).toBeAttached({ timeout: 10000 });
  
  // Then wait for it to be visible
  await expect(header).toBeVisible({ timeout: 10000 });

  // Wait for header left section to be ready (critical for position tests)
  const headerLeft = page.locator('#app-header-left');
  await expect(headerLeft).toBeAttached({ timeout: 10000 });
  await expect(headerLeft).toBeVisible({ timeout: 10000 });
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
  // Use domcontentloaded for faster initial load, then wait for React
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await disableAnimations(page);
  await waitForReactHydration(page);
  // Wait for main content to be visible after React hydration
  await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
}
