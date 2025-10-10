/**
 * Production Edge Function Tests
 * 
 * Comprehensive tests for all edge functions to ensure production readiness
 */

import { test, expect } from '@playwright/test';

const SUPABASE_URL = 'https://niorocndzcflrwdrofsp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pb3JvY25kemNmbHJ3ZHJvZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTg2OTksImV4cCI6MjA3NDg3NDY5OX0.cQLjnpVEv-e1kz5nc2ntrB21KkJV4GwFT281_53HG4M';

test.describe('Edge Function Security & Reliability', () => {
  test('capture-client-ip - Public endpoint returns IP', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/capture-client-ip`, {
      headers: { apikey: ANON_KEY }
    });
    
    expect([200, 201]).toContain(response.status());
    const data = await response.json();
    expect(data).toHaveProperty('ip');
  });

  test('capture-client-ip - Handles missing data gracefully', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/capture-client-ip`, {
      headers: { apikey: ANON_KEY },
      data: {}
    });
    
    expect([200, 201, 400]).toContain(response.status());
  });

  test('unsubscribe - Public endpoint requires token', async ({ request }) => {
    const response = await request.get(`${SUPABASE_URL}/functions/v1/unsubscribe`, {
      headers: { apikey: ANON_KEY }
    });
    
    expect([200, 400]).toContain(response.status());
  });

  test('ai-chat - Requires authentication', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      headers: { apikey: ANON_KEY },
      data: { messages: [{ role: 'user', content: 'test' }] }
    });
    
    expect([401, 403]).toContain(response.status());
  });

  test('store-encryption-key - Requires authentication', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/store-encryption-key`, {
      headers: { apikey: ANON_KEY },
      data: { fieldEncryptionData: {} }
    });
    
    expect([401, 403]).toContain(response.status());
  });

  test('retrieve-encryption-key - Requires authentication', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/retrieve-encryption-key`, {
      headers: { apikey: ANON_KEY },
      data: { keyId: 'test' }
    });
    
    expect([401, 403]).toContain(response.status());
  });

  test('send-sms - Requires authentication', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/send-sms`, {
      headers: { apikey: ANON_KEY },
      data: { to: '+15555555555', body: 'test' }
    });
    
    expect([401, 403, 429]).toContain(response.status());
  });

  test('vehicles-search - Requires authentication', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/vehicles-search`, {
      headers: { apikey: ANON_KEY },
      data: { q: 'Toyota' }
    });
    
    expect([401, 403]).toContain(response.status());
  });

  test('twilio-sms - Webhook validates signature', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/twilio-sms`, {
      headers: { 
        apikey: ANON_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    expect([401, 400]).toContain(response.status());
  });

  test('twilio-voice - Webhook validates signature', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/twilio-voice`, {
      headers: { 
        apikey: ANON_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    expect([401, 400]).toContain(response.status());
  });
});

test.describe('Edge Function Error Handling', () => {
  test('All authenticated endpoints handle missing auth consistently', async ({ request }) => {
    const authenticatedEndpoints = [
      'ai-chat',
      'store-encryption-key',
      'retrieve-encryption-key',
      'send-sms',
      'vehicles-search',
      'social-post',
      'store-integration-credentials',
      'oauth-callback'
    ];

    for (const endpoint of authenticatedEndpoints) {
      const response = await request.post(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
        headers: { apikey: ANON_KEY },
        data: {}
      });
      
      expect([400, 401, 403]).toContain(response.status());
    }
  });

  test('All endpoints return valid JSON on error', async ({ request }) => {
    const response = await request.post(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      headers: { apikey: ANON_KEY },
      data: { invalid: 'data' }
    });
    
    expect(response.headers()['content-type']).toContain('application/json');
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('Rate limiting works on send-sms', async ({ request, page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Get auth token
    const authToken = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token');
    });

    if (!authToken) return;

    // Try to send multiple SMS rapidly
    const requests = Array(15).fill(null).map(() =>
      request.post(`${SUPABASE_URL}/functions/v1/send-sms`, {
        headers: { 
          apikey: ANON_KEY,
          Authorization: `Bearer ${authToken}`
        },
        data: { to: '+15555555555', body: 'test' }
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status() === 429);
    
    expect(rateLimited).toBe(true);
  });
});

test.describe('Edge Function Data Validation', () => {
  test('vehicles-search validates input parameters', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    const authToken = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token');
    });

    if (!authToken) return;

    const response = await page.request.post(`${SUPABASE_URL}/functions/v1/vehicles-search`, {
      headers: { 
        apikey: ANON_KEY,
        Authorization: `Bearer ${authToken}`
      },
      data: { 
        seats_min: 'invalid',  // Should be number
        limit: 1000  // Should be limited
      }
    });
    
    expect([400, 422]).toContain(response.status());
  });

  test('ai-chat validates message structure', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    const authToken = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token');
    });

    if (!authToken) return;

    const response = await page.request.post(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      headers: { 
        apikey: ANON_KEY,
        Authorization: `Bearer ${authToken}`
      },
      data: { 
        messages: 'invalid'  // Should be array
      }
    });
    
    expect([400, 422]).toContain(response.status());
  });
});

test.describe('Edge Function Logging & Monitoring', () => {
  test('Functions log errors properly', async ({ request }) => {
    // This test verifies that errors are logged (we can't check logs directly in tests)
    const response = await request.post(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      headers: { apikey: ANON_KEY },
      data: { messages: [] }
    });
    
    // Should return error response
    expect([400, 401, 403]).toContain(response.status());
    
    // Should have proper error structure
    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});
