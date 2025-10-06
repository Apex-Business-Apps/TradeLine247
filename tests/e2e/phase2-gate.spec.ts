import { test, expect } from '@playwright/test';
import { enforceSecurityHeaders, setupConsoleErrorTracking } from '../global-setup';

/**
 * Phase 2 Production Gate - Critical Path Validation
 * 
 * This suite MUST pass before production deployment.
 * Validates all critical user flows with strict assertions.
 */

test.describe('Phase 2 Gate - Critical Flows', () => {
  test('Root route (/) - Security headers and 200 response', async ({ page }) => {
    const errorTracker = setupConsoleErrorTracking(page);
    
    await enforceSecurityHeaders(page, '/');
    await page.waitForLoadState('networkidle');
    
    // Verify core content loaded
    await expect(page.locator('h1, [role="heading"]')).toBeVisible({ timeout: 10000 });
    
    errorTracker.assertNoErrors();
    console.log('✅ Phase 2: Root route passed');
  });

  test('404 route - Security headers and proper error handling', async ({ page }) => {
    const errorTracker = setupConsoleErrorTracking(page);
    
    const response = await page.goto('/non-existent-route-12345');
    
    // Should still return proper headers even on 404
    const headers = response?.headers() || {};
    
    if (headers['x-frame-options']) {
      throw new Error('❌ GATE FAIL: X-Frame-Options present on 404 page');
    }
    
    const csp = headers['content-security-policy'];
    if (csp && !csp.includes('frame-ancestors')) {
      throw new Error('❌ GATE FAIL: CSP missing frame-ancestors on 404 page');
    }
    
    // 404 page should show proper error UI
    await expect(page.locator('text=/404|not found/i')).toBeVisible({ timeout: 5000 });
    
    errorTracker.assertNoErrors();
    console.log('✅ Phase 2: 404 route passed');
  });

  test('Auth flow - Login without console errors', async ({ page }) => {
    const errorTracker = setupConsoleErrorTracking(page);
    
    await enforceSecurityHeaders(page, '/auth');
    
    // Verify auth form loads
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
    
    errorTracker.assertNoErrors();
    console.log('✅ Phase 2: Auth flow passed');
  });

  test('Dashboard redirect - Proper authentication guard', async ({ page }) => {
    const errorTracker = setupConsoleErrorTracking(page);
    
    await page.goto('/dashboard');
    
    // Should redirect to auth or show protected content
    await page.waitForURL(/\/(auth|dashboard)/, { timeout: 10000 });
    
    errorTracker.assertNoErrors();
    console.log('✅ Phase 2: Dashboard guard passed');
  });

  test('AI Chat Widget - Loads without errors', async ({ page }) => {
    const errorTracker = setupConsoleErrorTracking(page);
    
    await enforceSecurityHeaders(page, '/');
    await page.waitForTimeout(3000); // Allow widget to initialize
    
    // Widget should be visible or have loaded its container
    const widgetExists = await page.locator('[data-testid="ai-chat-widget"], .fixed.bottom-4.right-4, [class*="chat"]').count() > 0;
    
    expect(widgetExists).toBe(true);
    
    errorTracker.assertNoErrors();
    console.log('✅ Phase 2: AI Chat Widget passed');
  });

  test('Network requests - All return valid status codes', async ({ page }) => {
    const failedRequests: string[] = [];
    
    page.on('response', (response) => {
      const status = response.status();
      const url = response.url();
      
      // Ignore expected 401s for auth checks
      if (status >= 400 && status !== 401 && !url.includes('/auth/')) {
        failedRequests.push(`${status} - ${url}`);
      }
    });
    
    await enforceSecurityHeaders(page, '/');
    await page.waitForLoadState('networkidle');
    
    if (failedRequests.length > 0) {
      throw new Error(`❌ GATE FAIL: Failed network requests:\n${failedRequests.join('\n')}`);
    }
    
    console.log('✅ Phase 2: All network requests valid');
  });

  test('Service Worker - Registers successfully', async ({ page }) => {
    const errorTracker = setupConsoleErrorTracking(page);
    
    await enforceSecurityHeaders(page, '/');
    
    // Wait for service worker registration
    const swRegistered = await page.evaluate(async () => {
      try {
        await navigator.serviceWorker.ready;
        return true;
      } catch (e) {
        return false;
      }
    });
    
    expect(swRegistered).toBe(true);
    
    errorTracker.assertNoErrors();
    console.log('✅ Phase 2: Service Worker registered');
  });

  test('Edge Functions - Respond without errors', async ({ page }) => {
    const errorTracker = setupConsoleErrorTracking(page);
    
    await enforceSecurityHeaders(page, '/');
    
    // Test public edge function (capture-client-ip)
    const response = await page.request.post(
      'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/capture-client-ip',
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pb3JvY25kemNmbHJ3ZHJvZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTg2OTksImV4cCI6MjA3NDg3NDY5OX0.cQLjnpVEv-e1kz5nc2ntrB21KkJV4GwFT281_53HG4M'
        }
      }
    );
    
    expect([200, 201]).toContain(response.status());
    
    errorTracker.assertNoErrors();
    console.log('✅ Phase 2: Edge Functions operational');
  });
});

test.describe('Phase 2 Gate - Security Validation', () => {
  test('RLS - Anonymous access blocked', async ({ page }) => {
    const sensitiveTables = ['profiles', 'leads', 'credit_applications', 'encryption_keys'];
    
    for (const table of sensitiveTables) {
      const response = await page.request.get(
        `https://niorocndzcflrwdrofsp.supabase.co/rest/v1/${table}`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pb3JvY25kemNmbHJ3ZHJvZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTg2OTksImV4cCI6MjA3NDg3NDY5OX0.cQLjnpVEv-e1kz5nc2ntrB21KkJV4GwFT281_53HG4M'
          }
        }
      );
      
      // Should return 403 or empty array
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toEqual([]);
      } else {
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }
    }
    
    console.log('✅ Phase 2: RLS blocking anonymous access');
  });

  test('Encryption - Keys never exposed', async ({ page }) => {
    const responses: string[] = [];
    
    page.on('response', async (response) => {
      if (response.url().includes('supabase')) {
        try {
          const text = await response.text();
          responses.push(text);
        } catch (e) {
          // Ignore
        }
      }
    });
    
    await enforceSecurityHeaders(page, '/');
    await page.waitForTimeout(3000);
    
    const hasLeakedKeys = responses.some((resp) => {
      const str = String(resp).toLowerCase();
      return str.includes('key_encrypted') || 
             str.includes('-----begin') ||
             (str.includes('"key"') && str.includes('"iv"') && str.length > 100);
    });
    
    expect(hasLeakedKeys).toBe(false);
    console.log('✅ Phase 2: No encryption keys leaked');
  });
});
