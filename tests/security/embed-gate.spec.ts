/**
 * Embed Gate Test - Regression Prevention
 * 
 * Ensures the app can be embedded in Lovable preview iframes
 * Blocks builds that reintroduce X-Frame-Options or break frame-ancestors
 * 
 * CRITICAL: This test MUST pass for deployment
 */

import { test, expect } from '@playwright/test';

test.describe('Embed Gate - Anti-Framing Header Check', () => {
  test('CRITICAL: Root document must NOT have X-Frame-Options header', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).toBeTruthy();
    
    const headers = response!.headers();
    
    // FAIL build if X-Frame-Options is present
    expect(headers['x-frame-options']).toBeUndefined();
    
    console.log('✅ X-Frame-Options not present (embed allowed)');
  });

  test('CRITICAL: CSP must include correct frame-ancestors allow-list', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).toBeTruthy();
    
    const headers = response!.headers();
    const csp = headers['content-security-policy'];
    
    expect(csp).toBeDefined();
    
    // Must allow self and Lovable domains
    expect(csp).toContain('frame-ancestors');
    expect(csp).toContain("'self'");
    expect(csp).toContain('https://*.lovable.dev');
    expect(csp).toContain('https://*.lovableproject.com');
    expect(csp).toContain('https://*.lovable.app');
    
    // Must NOT be set to 'none'
    expect(csp).not.toContain("frame-ancestors 'none'");
    
    console.log('✅ CSP frame-ancestors correctly configured');
    console.log(`   Allow-list: self + Lovable domains`);
  });

  test('Security baseline: Required security headers present', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).toBeTruthy();
    
    const headers = response!.headers();
    
    // Verify essential security headers
    expect(headers['content-security-policy']).toBeDefined();
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBeDefined();
    expect(headers['permissions-policy']).toBeDefined();
    
    console.log('✅ Security baseline headers present');
  });

  test('Service Worker: Verify updated cache version', async ({ page }) => {
    await page.goto('/');
    
    // Wait for service worker registration
    await page.waitForFunction(() => {
      return navigator.serviceWorker.controller !== null;
    }, { timeout: 10000 });
    
    // Check SW cache name contains embed-fix marker
    const swCacheName = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      return cacheNames.find(name => name.includes('embed-fix')) || 'none';
    });
    
    expect(swCacheName).toContain('embed-fix');
    console.log('✅ Service Worker updated with embed-fix cache version');
  });
});
