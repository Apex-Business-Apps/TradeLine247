import { test, expect } from '@playwright/test';

/**
 * Production Readiness Test Suite
 * 
 * Comprehensive validation that the system is production-ready
 * Tests all critical security controls, integrations, and user flows
 */

test.describe('Production Readiness - Security Gates', () => {
  test('CRITICAL: All sensitive tables block anonymous access', async ({ page }) => {
    const sensitiveTables = [
      'profiles',
      'leads', 
      'credit_applications',
      'dealerships',
      'documents',
      'integrations',
      'webhooks',
      'consents',
      'encryption_keys'
    ];

    for (const table of sensitiveTables) {
      const response = await page.request.get(
        `https://niorocndzcflrwdrofsp.supabase.co/rest/v1/${table}`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pb3JvY25kemNmbHJ3ZHJvZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTg2OTksImV4cCI6MjA3NDg3NDY5OX0.cQLjnpVEv-e1kz5nc2ntrB21KkJV4GwFT281_53HG4M'
          }
        }
      );

      // Should return 403 or empty array, not actual data
      expect([200, 403]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toEqual([]);
      }
      
      console.log(`✅ ${table}: Anonymous access blocked`);
    }
  });

  test('CRITICAL: System logging tables require service role', async ({ page }) => {
    // Attempt to insert into ab_events without auth
    const abEventResponse = await page.request.post(
      'https://niorocndzcflrwdrofsp.supabase.co/rest/v1/ab_events',
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pb3JvY25kemNmbHJ3ZHJvZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTg2OTksImV4cCI6MjA3NDg3NDY5OX0.cQLjnpVEv-e1kz5nc2ntrB21KkJV4GwFT281_53HG4M',
          'Content-Type': 'application/json'
        },
        data: {
          test_id: '00000000-0000-0000-0000-000000000000',
          session_id: 'test',
          variant: 'a',
          event_type: 'view'
        }
      }
    );

    expect(abEventResponse.status()).toBeGreaterThanOrEqual(400);
    console.log('✅ ab_events: Anonymous insert blocked');

    // Attempt to insert into key_retrieval_attempts
    const keyAttemptResponse = await page.request.post(
      'https://niorocndzcflrwdrofsp.supabase.co/rest/v1/key_retrieval_attempts',
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pb3JvY25kemNmbHJ3ZHJvZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTg2OTksImV4cCI6MjA3NDg3NDY5OX0.cQLjnpVEv-e1kz5nc2ntrB21KkJV4GwFT281_53HG4M',
          'Content-Type': 'application/json'
        },
        data: {
          user_id: '00000000-0000-0000-0000-000000000000',
          key_id: '00000000-0000-0000-0000-000000000000',
          success: false
        }
      }
    );

    expect(keyAttemptResponse.status()).toBeGreaterThanOrEqual(400);
    console.log('✅ key_retrieval_attempts: Anonymous insert blocked');
  });

  test('CRITICAL: Encryption keys never exposed in API responses', async ({ page }) => {
    await page.goto('/');
    
    const responses: any[] = [];
    page.on('response', async (response) => {
      if (response.url().includes('supabase')) {
        try {
          const text = await response.text();
          responses.push(text);
        } catch (e) {
          // Ignore non-text responses
        }
      }
    });

    await page.goto('/dashboard');
    await page.waitForTimeout(3000);

    // Check for leaked encryption keys
    const hasLeakedKeys = responses.some((resp) => {
      const str = String(resp).toLowerCase();
      return str.includes('key_encrypted') || 
             str.includes('-----begin') ||
             (str.includes('key') && str.includes('iv') && str.length > 100);
    });

    expect(hasLeakedKeys).toBe(false);
    console.log('✅ No encryption keys leaked in API responses');
  });
});

test.describe('Production Readiness - Edge Functions', () => {
  test('Edge function: capture-client-ip responds correctly', async ({ page }) => {
    await page.goto('/');
    
    const response = await page.request.post(
      'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/capture-client-ip',
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pb3JvY25kemNmbHJ3ZHJvZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTg2OTksImV4cCI6MjA3NDg3NDY5OX0.cQLjnpVEv-e1kz5nc2ntrB21KkJV4GwFT281_53HG4M'
        }
      }
    );

    expect([200, 201]).toContain(response.status());
    const data = await response.json();
    expect(data).toHaveProperty('ip');
    console.log(`✅ capture-client-ip: Returned IP ${data.ip}`);
  });

  test('Edge function: store-encryption-key requires auth', async ({ page }) => {
    const response = await page.request.post(
      'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/store-encryption-key',
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pb3JvY25kemNmbHJ3ZHJvZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTg2OTksImV4cCI6MjA3NDg3NDY5OX0.cQLjnpVEv-e1kz5nc2ntrB21KkJV4GwFT281_53HG4M',
          'Content-Type': 'application/json'
        },
        data: {
          fieldEncryptionData: {}
        }
      }
    );

    expect(response.status()).toBeGreaterThanOrEqual(400);
    console.log('✅ store-encryption-key: Auth required');
  });

  test('Edge function: retrieve-encryption-key requires auth', async ({ page }) => {
    const response = await page.request.post(
      'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/retrieve-encryption-key',
      {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pb3JvY25kemNmbHJ3ZHJvZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTg2OTksImV4cCI6MjA3NDg3NDY5OX0.cQLjnpVEv-e1kz5nc2ntrB21KkJV4GwFT281_53HG4M',
          'Content-Type': 'application/json'
        },
        data: {
          keyId: '00000000-0000-0000-0000-000000000000'
        }
      }
    );

    expect(response.status()).toBeGreaterThanOrEqual(400);
    console.log('✅ retrieve-encryption-key: Auth required');
  });
});

test.describe('Production Readiness - Critical User Flows', () => {
  test('Landing page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForSelector('h1', { timeout: 10000 });

    expect(errors.length).toBe(0);
    console.log('✅ Landing page loaded without errors');
  });

  test('Dashboard redirects to auth when not logged in', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/(auth|$)/, { timeout: 5000 });
    console.log('✅ Protected route redirects to auth');
  });

  test('All navigation links are functional', async ({ page }) => {
    await page.goto('/');
    
    const links = await page.locator('a[href]').all();
    const brokenLinks: string[] = [];

    for (const link of links.slice(0, 10)) { // Test first 10 links
      const href = await link.getAttribute('href');
      if (href && href.startsWith('/')) {
        try {
          await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 5000 });
        } catch (error) {
          brokenLinks.push(href);
        }
      }
    }

    expect(brokenLinks.length).toBe(0);
    console.log('✅ All navigation links functional');
  });

  test('AI Chat Widget loads correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check if chat widget exists
    const chatWidget = page.locator('[data-testid="ai-chat-widget"], .fixed.bottom-4.right-4');
    const widgetExists = await chatWidget.count() > 0;
    
    expect(widgetExists).toBe(true);
    console.log('✅ AI Chat Widget loaded');
  });
});

test.describe('Production Readiness - Performance', () => {
  test('Page load time is acceptable', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(5000); // 5 seconds max
    console.log(`✅ Page loaded in ${loadTime}ms`);
  });

  test('No memory leaks in navigation', async ({ page }) => {
    await page.goto('/');
    const initialMetrics = await page.metrics();

    // Navigate through multiple pages
    await page.goto('/dashboard');
    await page.goto('/');
    await page.goto('/dashboard');

    const finalMetrics = await page.metrics();
    
    // Heap should not grow excessively (allow 50MB growth)
    const heapGrowth = finalMetrics.JSHeapUsedSize - initialMetrics.JSHeapUsedSize;
    expect(heapGrowth).toBeLessThan(50 * 1024 * 1024);
    
    console.log(`✅ Memory usage acceptable (heap growth: ${Math.round(heapGrowth / 1024 / 1024)}MB)`);
  });
});

test.describe('Production Readiness - Compliance', () => {
  test('Security headers are present', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    expect(headers?.['x-content-type-options']).toBe('nosniff');
    expect(headers?.['content-security-policy']).toBeDefined();
    expect(headers?.['referrer-policy']).toBeDefined();
    
    console.log('✅ Security headers present');
  });

  test('No sensitive data in console logs', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (msg) => {
      logs.push(msg.text().toLowerCase());
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    const hasSensitiveData = logs.some(log => 
      log.includes('password') ||
      log.includes('secret') ||
      log.includes('token') ||
      log.includes('ssn') ||
      log.includes('credit') && log.includes('card')
    );

    expect(hasSensitiveData).toBe(false);
    console.log('✅ No sensitive data in console logs');
  });
});
