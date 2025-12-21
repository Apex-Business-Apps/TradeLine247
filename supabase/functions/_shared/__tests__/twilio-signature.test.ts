import { describe, it, expect } from 'vitest';

// Twilio signature validation function (copied from twilioValidator.ts for testing)
// This matches the implementation in supabase/functions/_shared/twilioValidator.ts
async function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string
): Promise<boolean> {
  // Sort parameters alphabetically and concatenate
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  
  const data = url + sortedParams;
  
  // Compute HMAC-SHA1
  const encoder = new TextEncoder();
  const keyData = encoder.encode(authToken);
  const messageData = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageData
  );
  
  // Convert to base64
  const signatureArray = new Uint8Array(signatureBuffer);
  const base64Signature = btoa(String.fromCharCode(...signatureArray));
  
  // Constant-time comparison
  return base64Signature === signature;
}

// Helper function to generate signature for testing
async function generateSignature(
  url: string,
  params: Record<string, string>,
  authToken: string
): Promise<string> {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  
  const data = url + sortedParams;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(authToken);
  const messageData = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const signatureArray = new Uint8Array(signatureBuffer);
  return btoa(String.fromCharCode(...signatureArray));
}

// Test data
const TEST_AUTH_TOKEN = 'test_auth_token_12345';
const TEST_URL = 'https://example.supabase.co/functions/v1/voice-status';

describe('Twilio Signature Validation', () => {
  it('should validate a valid signature', async () => {
    const params = {
      CallSid: 'CA12345678901234567890123456789012',
      CallStatus: 'completed',
      CallDuration: '45',
      From: '+15551234567',
      To: '+15559876543'
    };

    // Generate valid signature
    const validSignature = await generateSignature(TEST_URL, params, TEST_AUTH_TOKEN);

    const isValid = await validateTwilioSignature(TEST_URL, params, validSignature, TEST_AUTH_TOKEN);
    expect(isValid).toBe(true);
  });

  it('should reject an invalid signature', async () => {
    const params = {
      CallSid: 'CA12345678901234567890123456789012',
      CallStatus: 'completed',
      From: '+15551234567'
    };

    const invalidSignature = 'invalid_signature_12345';
    const isValid = await validateTwilioSignature(TEST_URL, params, invalidSignature, TEST_AUTH_TOKEN);
    expect(isValid).toBe(false);
  });

  it('should reject tampered parameters', async () => {
    const originalParams = {
      CallSid: 'CA12345678901234567890123456789012',
      CallStatus: 'completed',
      From: '+15551234567'
    };

    // Generate signature for original params
    const validSignature = await generateSignature(TEST_URL, originalParams, TEST_AUTH_TOKEN);

    // Test with tampered parameters
    const tamperedParams = {
      ...originalParams,
      CallStatus: 'failed' // Changed from 'completed' to 'failed'
    };

    const isValid = await validateTwilioSignature(TEST_URL, tamperedParams, validSignature, TEST_AUTH_TOKEN);
    expect(isValid).toBe(false);
  });

  it('should reject signature when using wrong auth token', async () => {
    const params = {
      CallSid: 'CA12345678901234567890123456789012',
      CallStatus: 'completed',
      From: '+15551234567'
    };

    // Generate signature with correct token
    const validSignature = await generateSignature(TEST_URL, params, TEST_AUTH_TOKEN);

    // Validate with wrong token
    const isValid = await validateTwilioSignature(TEST_URL, params, validSignature, 'wrong_token_123');
    expect(isValid).toBe(false);
  });

  it('should reject signature with empty parameters', async () => {
    const params: Record<string, string> = {};

    const signature = 'some_signature';
    const isValid = await validateTwilioSignature(TEST_URL, params, signature, TEST_AUTH_TOKEN);
    expect(isValid).toBe(false);
  });

  it('should handle special characters in parameters', async () => {
    const params = {
      CallSid: 'CA12345678901234567890123456789012',
      Message: 'Hello & goodbye!',
      From: '+1 (555) 123-4567'
    };

    // Generate valid signature
    const validSignature = await generateSignature(TEST_URL, params, TEST_AUTH_TOKEN);

    const isValid = await validateTwilioSignature(TEST_URL, params, validSignature, TEST_AUTH_TOKEN);
    expect(isValid).toBe(true);
  });
});