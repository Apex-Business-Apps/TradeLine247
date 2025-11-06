/**
 * Unit Tests: E2EE Crypto Utilities
 *
 * NOTE: WebCrypto tests are skipped in unit tests (jsdom doesn't fully support WebCrypto).
 * These functions are tested in E2E tests with real browser environment.
 */

import { describe, it, expect } from 'vitest';
import {
  encryptText,
  decryptText,
  generateOTP,
  sha256,
  verifyIntegrity
} from '../../src/lib/crypto';

describe.skip('encryptText and decryptText (requires browser WebCrypto)', () => {
  it('should encrypt and decrypt text successfully', async () => {
    const plaintext = 'Sensitive customer data';

    const encrypted = await encryptText(plaintext);

    // Should return encrypted data, key, and IV
    expect(encrypted.data).toBeDefined();
    expect(encrypted.key).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.data.length).toBeGreaterThan(0);
    expect(encrypted.key.length).toBeGreaterThan(0);
    expect(encrypted.iv.length).toBeGreaterThan(0);

    const decrypted = await decryptText(encrypted.data, encrypted.key, encrypted.iv);

    // Decrypted should match original
    expect(decrypted).toBe(plaintext);
  });

  it('should fail decryption with wrong key', async () => {
    const plaintext = 'Secret message';

    const encrypted = await encryptText(plaintext);

    // Generate a different key
    const wrongEncryption = await encryptText('dummy');
    const wrongKey = wrongEncryption.key;

    // Should throw error
    await expect(decryptText(encrypted.data, wrongKey, encrypted.iv)).rejects.toThrow();
  });

  it('should handle special characters and unicode', async () => {
    const plaintext = 'Spécial chàracters: 你好, مرحبا, שלום!';

    const encrypted = await encryptText(plaintext);
    const decrypted = await decryptText(encrypted.data, encrypted.key, encrypted.iv);

    expect(decrypted).toBe(plaintext);
  });

  it('should handle empty string', async () => {
    const plaintext = '';

    const encrypted = await encryptText(plaintext);
    const decrypted = await decryptText(encrypted.data, encrypted.key, encrypted.iv);

    expect(decrypted).toBe(plaintext);
  });
});

describe('generateOTP', () => {
  it('should generate 32-character hex string by default', () => {
    const otp = generateOTP();

    // Default length is 32 (generates 32-char hex string)
    expect(otp.length).toBe(32);
    expect(/^[0-9a-f]{32}$/.test(otp)).toBe(true);
  });

  it('should generate hex string of custom length', () => {
    const otp = generateOTP(16);

    // Length 16 generates 16-char hex string
    expect(otp.length).toBe(16);
    expect(/^[0-9a-f]{16}$/.test(otp)).toBe(true);
  });

  it('should generate unique OTPs', () => {
    const otp1 = generateOTP();
    const otp2 = generateOTP();
    const otp3 = generateOTP();

    // Should be unique (cryptographically random)
    expect(otp1).not.toBe(otp2);
    expect(otp2).not.toBe(otp3);
    expect(otp1).not.toBe(otp3);
  });
});

describe.skip('sha256 and verifyIntegrity (requires browser WebCrypto)', () => {
  it('should generate consistent hash for same input', async () => {
    const data = 'Test data for hashing';

    const hash1 = await sha256(data);
    const hash2 = await sha256(data);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 produces 64 hex characters
    expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
  });

  it('should generate different hashes for different inputs', async () => {
    const data1 = 'First data';
    const data2 = 'Second data';

    const hash1 = await sha256(data1);
    const hash2 = await sha256(data2);

    expect(hash1).not.toBe(hash2);
  });

  it('should verify data integrity correctly', async () => {
    const data = 'Important document content';
    const hash = await sha256(data);

    const isValid = await verifyIntegrity(data, hash);
    expect(isValid).toBe(true);
  });

  it('should detect data tampering', async () => {
    const originalData = 'Original content';
    const hash = await sha256(originalData);

    const tamperedData = 'Tampered content';
    const isValid = await verifyIntegrity(tamperedData, hash);

    expect(isValid).toBe(false);
  });
});
