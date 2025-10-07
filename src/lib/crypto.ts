/**
 * End-to-End Encryption Utilities (WebCrypto AES-GCM)
 * 
 * SECURITY NOTES:
 * - AES-GCM provides authenticated encryption
 * - Keys are 256-bit
 * - IV (nonce) is 96-bit (12 bytes), randomly generated per encryption
 * - Never reuse an IV with the same key
 * 
 * USAGE:
 * const encrypted = await encryptFile(file);
 * // Store encrypted.data on server, share encrypted.key via secure channel (OTP link)
 * const decrypted = await decryptFile(encrypted.data, encrypted.key, encrypted.iv);
 */

// Helper: Convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper: Generate random hex string for OTP tokens
export function generateOTP(length: number = 32): string {
  const array = new Uint8Array(length / 2);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt a file using AES-GCM
 * @param file - File to encrypt
 * @returns Encrypted data, key, and IV (all base64-encoded)
 */
export async function encryptFile(file: File): Promise<{
  data: string;      // Encrypted file data (base64)
  key: string;       // Encryption key (base64)
  iv: string;        // Initialization vector (base64)
  filename: string;  // Original filename
  mimeType: string;  // Original MIME type
}> {
  // Generate encryption key
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,  // extractable
    ['encrypt', 'decrypt']
  );

  // Generate random IV (96-bit for AES-GCM)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer();

  // Encrypt
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBuffer
  );

  // Export key for storage/sharing
  const exportedKey = await window.crypto.subtle.exportKey('raw', key);

  return {
    data: arrayBufferToBase64(encrypted),
    key: arrayBufferToBase64(exportedKey),
    iv: arrayBufferToBase64(iv.buffer),
    filename: file.name,
    mimeType: file.type,
  };
}

/**
 * Decrypt a file using AES-GCM
 * @param encryptedData - Encrypted data (base64)
 * @param keyBase64 - Encryption key (base64)
 * @param ivBase64 - Initialization vector (base64)
 * @returns Decrypted ArrayBuffer
 */
export async function decryptFile(
  encryptedData: string,
  keyBase64: string,
  ivBase64: string
): Promise<ArrayBuffer> {
  // Convert base64 to ArrayBuffer
  const encrypted = base64ToArrayBuffer(encryptedData);
  const keyBuffer = base64ToArrayBuffer(keyBase64);
  const iv = base64ToArrayBuffer(ivBase64);

  // Import key
  const key = await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    'AES-GCM',
    false,  // not extractable
    ['decrypt']
  );

  // Decrypt
  return await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    encrypted
  );
}

/**
 * Encrypt text string
 * @param text - Plain text to encrypt
 * @returns Encrypted text, key, and IV
 */
export async function encryptText(text: string): Promise<{
  data: string;
  key: string;
  iv: string;
}> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const exportedKey = await window.crypto.subtle.exportKey('raw', key);

  return {
    data: arrayBufferToBase64(encrypted),
    key: arrayBufferToBase64(exportedKey),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt text string
 * @param encryptedData - Encrypted data (base64)
 * @param keyBase64 - Encryption key (base64)
 * @param ivBase64 - Initialization vector (base64)
 * @returns Decrypted plain text
 */
export async function decryptText(
  encryptedData: string,
  keyBase64: string,
  ivBase64: string
): Promise<string> {
  const decrypted = await decryptFile(encryptedData, keyBase64, ivBase64);
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Hash data using SHA-256
 * @param data - Data to hash
 * @returns Hash (hex string)
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify integrity of encrypted data
 * @param data - Data to verify
 * @param expectedHash - Expected hash
 * @returns True if data is intact
 */
export async function verifyIntegrity(data: string, expectedHash: string): Promise<boolean> {
  const actualHash = await sha256(data);
  return actualHash === expectedHash;
}

// Export types for TypeScript
export interface EncryptedFile {
  data: string;
  key: string;
  iv: string;
  filename: string;
  mimeType: string;
}

export interface EncryptedText {
  data: string;
  key: string;
  iv: string;
}

/**
 * TODO: Server-side envelope encryption (Supabase Edge Function)
 * 
 * The client-side key should be encrypted with a master key on the server
 * using libsodium sealed boxes for additional security.
 * 
 * Example implementation:
 * 
 * ```typescript
 * // supabase/functions/seal-key/index.ts
 * import { crypto_box_seal } from 'https://deno.land/x/sodium/mod.ts';
 * 
 * const MASTER_PUBLIC_KEY = Deno.env.get('MASTER_PUBLIC_KEY');
 * 
 * export async function sealKey(dataKey: Uint8Array): Promise<Uint8Array> {
 *   return crypto_box_seal(dataKey, base64ToUint8Array(MASTER_PUBLIC_KEY));
 * }
 * ```
 * 
 * This would allow:
 * 1. Client encrypts file with random DEK (Data Encryption Key)
 * 2. Client sends DEK to server for sealing
 * 3. Server encrypts DEK with KEK (Key Encryption Key)
 * 4. Server stores sealed DEK with encrypted file
 * 5. Only server can unseal DEK for authorized access
 */
