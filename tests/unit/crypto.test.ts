/**
 * Unit Tests: E2EE Crypto Utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  encryptText, 
  decryptText, 
  generateOTP, 
  sha256, 
  verifyIntegrity 
} from '../../src/lib/crypto';

describe('encryptText and decryptText', () => {
  it('should encrypt and decrypt text successfully', async () => {
    const plaintext = 'Sensitive customer data';
    const password = 'SecurePassword123!';

    const encrypted = await encryptText(plaintext, password);
    
    // Encrypted should be different from plaintext
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.length).toBeGreaterThan(0);

    const decrypted = await decryptText(encrypted, password);
    
    // Decrypted should match original
    expect(decrypted).toBe(plaintext);
  });

  it('should fail decryption with wrong password', async () => {
    const plaintext = 'Secret message';
    const password = 'CorrectPassword';
    const wrongPassword = 'WrongPassword';

    const encrypted = await encryptText(plaintext, password);

    // Should throw error or return null
    await expect(decryptText(encrypted, wrongPassword)).rejects.toThrow();
  });

  it('should handle special characters and unicode', async () => {
    const plaintext = 'Spécial chàracters: 你好, مرحبا, שלום!';
    const password = 'Password123';

    const encrypted = await encryptText(plaintext, password);
    const decrypted = await decryptText(encrypted, password);

    expect(decrypted).toBe(plaintext);
  });

  it('should handle empty string', async () => {
    const plaintext = '';
    const password = 'Password123';

    const encrypted = await encryptText(plaintext, password);
    const decrypted = await decryptText(encrypted, password);

    expect(decrypted).toBe(plaintext);
  });
});

describe('generateOTP', () => {
  it('should generate 6-digit OTP by default', () => {
    const otp = generateOTP();
    
    expect(otp.length).toBe(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('should generate OTP of custom length', () => {
    const otp = generateOTP(8);
    
    expect(otp.length).toBe(8);
    expect(/^\d{8}$/.test(otp)).toBe(true);
  });

  it('should generate unique OTPs', () => {
    const otp1 = generateOTP();
    const otp2 = generateOTP();
    const otp3 = generateOTP();

    // Statistically unlikely to generate same OTP (1 in 1,000,000)
    expect(otp1).not.toBe(otp2);
    expect(otp2).not.toBe(otp3);
  });
});

describe('sha256 and verifyIntegrity', () => {
  it('should generate consistent hash for same input', async () => {
    const data = 'Test data for hashing';

    const hash1 = await sha256(data);
    const hash2 = await sha256(data);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBeGreaterThan(0);
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
