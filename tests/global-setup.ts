import { test, expect, Page } from '@playwright/test';

/**
 * Phase 2 Gate - Global Test Hooks
 * 
 * Enforces blind-safe assertions across all E2E tests:
 * - No X-Frame-Options header
 * - Valid CSP frame-ancestors
 * - No console.error logs
 * - All navigations return 200
 */

export async function enforceSecurityHeaders(page: Page, url: string) {
  const response = await page.goto(url);
  
  if (!response) {
    throw new Error(`Failed to navigate to ${url}`);
  }

  // CRITICAL: Navigation must return 200
  if (response.status() !== 200) {
    throw new Error(`❌ GATE FAIL: ${url} returned ${response.status()}, expected 200`);
  }

  const headers = response.headers();

  // CRITICAL: X-Frame-Options must NOT exist
  if (headers['x-frame-options']) {
    throw new Error(`❌ GATE FAIL: X-Frame-Options header present on ${url} - breaks Lovable embed`);
  }

  // CRITICAL: CSP frame-ancestors must exist and be correct
  const csp = headers['content-security-policy'];
  if (!csp) {
    throw new Error(`❌ GATE FAIL: Missing Content-Security-Policy on ${url}`);
  }

  if (!csp.includes('frame-ancestors')) {
    throw new Error(`❌ GATE FAIL: CSP missing frame-ancestors directive on ${url}`);
  }

  if (csp.includes("frame-ancestors 'none'")) {
    throw new Error(`❌ GATE FAIL: CSP frame-ancestors set to 'none' on ${url} - breaks embed`);
  }

  console.log(`✅ Security headers validated for ${url}`);
}

export function setupConsoleErrorTracking(page: Page) {
  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    consoleErrors.push(error.message);
  });

  return {
    getErrors: () => consoleErrors,
    assertNoErrors: () => {
      if (consoleErrors.length > 0) {
        throw new Error(`❌ GATE FAIL: Console errors detected:\n${consoleErrors.join('\n')}`);
      }
      console.log('✅ No console errors detected');
    }
  };
}
