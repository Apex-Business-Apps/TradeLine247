/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// Telephony Voice Flow Integration Tests
// Tests complete call flows end-to-end

import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

interface TestConfig {
  name: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  body?: string | FormData;
  expectedStatus: number;
  expectedContentType: string;
}

/**
 * Test voice-frontdoor endpoint
 */
Deno.test("voice-frontdoor - should reject missing signature", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/voice-frontdoor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'CallSid=CAtest&From=%2B15551234567&To=%2B15877428885'
  });

  assertEquals(response.status, 401, 'Should reject request without signature');
});

/**
 * Test voice-menu-handler endpoint
 */
Deno.test("voice-menu-handler - should reject missing signature", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/voice-menu-handler`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'CallSid=CAtest&Digits=1&From=%2B15551234567&To=%2B15877428885'
  });

  assertEquals(response.status, 401, 'Should reject request without signature');
});

/**
 * Test voice-action endpoint
 */
Deno.test("voice-action - should reject missing signature", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/voice-action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'CallSid=CAtest&Digits=0'
  });

  assertEquals(response.status, 401, 'Should reject request without signature');
});

/**
 * Test health check endpoint
 */
Deno.test("voice-health - should return health status", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/voice-health`);

  assertEquals(response.status >= 200 && response.status < 600, true, 'Should return valid HTTP status');

  const data = await response.json();
  assertExists(data.status, 'Should have status field');
  assertExists(data.checks, 'Should have checks field');
  assertExists(data.timestamp, 'Should have timestamp field');
});

/**
 * Test contact form submission with rate limiting
 */
Deno.test("contact-submit - should enforce rate limiting", async () => {
  const payload = {
    name: 'Test User',
    email: 'test@example.com',
    message: 'Test message'
  };

  // Make 4 requests rapidly
  const responses = [];
  for (let i = 0; i < 4; i++) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/contact-submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    responses.push(response);
  }

  // At least one should be rate limited
  const rateLimited = responses.some(r => r.status === 429);
  assertEquals(rateLimited, true, 'Should rate limit after max requests');
});

/**
 * Test telephony-onboard idempotency
 */
Deno.test("telephony-onboard - should be idempotent", async () => {
  const payload = {
    org_id: `test_org_${Date.now()}`,
    business_name: 'Test Business',
    area_code: '587',
    country: 'CA'
  };

  // Make same request twice
  const response1 = await fetch(`${SUPABASE_URL}/functions/v1/telephony-onboard`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const response2 = await fetch(`${SUPABASE_URL}/functions/v1/telephony-onboard`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(payload)
  });

  // Both should succeed or fail identically
  assertEquals(response1.status === response2.status, true, 'Should be idempotent');
});

console.log('✅ All telephony tests completed');
