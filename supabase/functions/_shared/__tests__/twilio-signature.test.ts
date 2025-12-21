import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";

// Twilio signature validation function (copied from voice-status)
async function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): Promise<boolean> {
  // Build signature validation string
  let signatureString = url;
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    signatureString += key + params[key];
  }

  // Compute expected signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(authToken);
  const messageData = encoder.encode(signatureString);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  // Compare signatures (constant-time comparison)
  return expectedSignature === signature;
}

// Test data
const TEST_AUTH_TOKEN = 'test_auth_token_12345';
const TEST_URL = 'https://example.supabase.co/functions/v1/voice-status';

Deno.test('Twilio Signature Validation - Valid Signature', async () => {
  const params = {
    CallSid: 'CA12345678901234567890123456789012',
    CallStatus: 'completed',
    CallDuration: '45',
    From: '+15551234567',
    To: '+15559876543'
  };

  // Generate valid signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(TEST_AUTH_TOKEN);
  let signatureString = TEST_URL;
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    signatureString += key + params[key];
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(signatureString));
  const validSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  const isValid = await validateTwilioSignature(TEST_URL, params, validSignature, TEST_AUTH_TOKEN);
  assertEquals(isValid, true);
});

Deno.test('Twilio Signature Validation - Invalid Signature', async () => {
  const params = {
    CallSid: 'CA12345678901234567890123456789012',
    CallStatus: 'completed',
    From: '+15551234567'
  };

  const invalidSignature = 'invalid_signature_12345';
  const isValid = await validateTwilioSignature(TEST_URL, params, invalidSignature, TEST_AUTH_TOKEN);
  assertEquals(isValid, false);
});

Deno.test('Twilio Signature Validation - Tampered Parameters', async () => {
  const originalParams = {
    CallSid: 'CA12345678901234567890123456789012',
    CallStatus: 'completed',
    From: '+15551234567'
  };

  // Generate signature for original params
  const encoder = new TextEncoder();
  const keyData = encoder.encode(TEST_AUTH_TOKEN);
  let signatureString = TEST_URL;
  const sortedKeys = Object.keys(originalParams).sort();
  for (const key of sortedKeys) {
    signatureString += key + originalParams[key];
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(signatureString));
  const validSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  // Test with tampered parameters
  const tamperedParams = {
    ...originalParams,
    CallStatus: 'failed' // Changed from 'completed' to 'failed'
  };

  const isValid = await validateTwilioSignature(TEST_URL, tamperedParams, validSignature, TEST_AUTH_TOKEN);
  assertEquals(isValid, false);
});

Deno.test('Twilio Signature Validation - Wrong Auth Token', async () => {
  const params = {
    CallSid: 'CA12345678901234567890123456789012',
    CallStatus: 'completed',
    From: '+15551234567'
  };

  // Generate signature with correct token
  const encoder = new TextEncoder();
  const keyData = encoder.encode(TEST_AUTH_TOKEN);
  let signatureString = TEST_URL;
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    signatureString += key + params[key];
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(signatureString));
  const validSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  // Validate with wrong token
  const isValid = await validateTwilioSignature(TEST_URL, params, validSignature, 'wrong_token_123');
  assertEquals(isValid, false);
});

Deno.test('Twilio Signature Validation - Empty Parameters', async () => {
  const params: Record<string, string> = {};

  const signature = 'some_signature';
  const isValid = await validateTwilioSignature(TEST_URL, params, signature, TEST_AUTH_TOKEN);
  assertEquals(isValid, false);
});

Deno.test('Twilio Signature Validation - Special Characters in Parameters', async () => {
  const params = {
    CallSid: 'CA12345678901234567890123456789012',
    Message: 'Hello & goodbye!',
    From: '+1 (555) 123-4567'
  };

  // Generate valid signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(TEST_AUTH_TOKEN);
  let signatureString = TEST_URL;
  const sortedKeys = Object.keys(params).sort();
  for (const key of sortedKeys) {
    signatureString += key + params[key];
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(signatureString));
  const validSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

  const isValid = await validateTwilioSignature(TEST_URL, params, validSignature, TEST_AUTH_TOKEN);
  assertEquals(isValid, true);
});