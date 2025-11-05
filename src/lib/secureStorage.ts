/**
 * Secure Storage Utility
 * 
 * Provides encrypted localStorage wrapper for sensitive data persistence.
 * Features:
 * - AES-GCM encryption for sensitive data (using Web Crypto API - no dependencies)
 * - Automatic key derivation from user session
 * - Fallback to plain storage for non-sensitive data
 * - Data integrity verification
 * 
 * Uses browser's built-in Web Crypto API - no external dependencies required.
 */

const STORAGE_PREFIX = 'tl247_secure_';
const ENCRYPTION_SALT = 'tl247_encryption_salt_v1';

interface StorageOptions {
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
  compress?: boolean;
}

/**
 * Generate encryption key from password using PBKDF2
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(ENCRYPTION_SALT),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get encryption key from user session (if available)
 * Falls back to device-specific key
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  let password: string;
  
  // Try to get user ID from session
  try {
    const session = sessionStorage.getItem('sb-auth-token');
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed?.user?.id) {
        password = ENCRYPTION_SALT + parsed.user.id;
        return deriveKey(password);
      }
    }
  } catch {
    // Fallback to device key
  }
  
  // Device-specific key (less secure but better than nothing)
  const deviceId = localStorage.getItem('device_id') || generateDeviceId();
  localStorage.setItem('device_id', deviceId);
  password = ENCRYPTION_SALT + deviceId;
  return deriveKey(password);
}

function generateDeviceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Encrypt data before storage using Web Crypto API
 */
async function encrypt(data: string, key: CryptoKey): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('[SecureStorage] Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data after retrieval using Web Crypto API
 */
async function decrypt(encrypted: string, key: CryptoKey): Promise<string> {
  try {
    // Convert from base64
    const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('[SecureStorage] Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if data is expired
 */
function isExpired(data: { value: string; expires?: number }): boolean {
  if (!data.expires) return false;
  return Date.now() > data.expires;
}

/**
 * Secure set with encryption and TTL (async for Web Crypto API)
 */
export async function secureSet(key: string, value: any, options: StorageOptions = {}): Promise<boolean> {
  try {
    const { encrypt: shouldEncrypt = false, ttl, compress = false } = options;
    
    let serialized = JSON.stringify(value);
    
    // Compress if requested (simple approach - could use lz-string for better compression)
    if (compress && serialized.length > 1000) {
      // Store compressed flag
      serialized = JSON.stringify({ compressed: true, data: serialized });
    }
    
    const storageData: { value: string; expires?: number; encrypted?: boolean } = {
      value: serialized,
    };
    
    if (ttl) {
      storageData.expires = Date.now() + ttl;
    }
    
    if (shouldEncrypt) {
      const encryptionKey = await getEncryptionKey();
      storageData.value = await encrypt(serialized, encryptionKey);
      storageData.encrypted = true;
    }
    
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(storageData));
    return true;
  } catch (error) {
    console.error('[SecureStorage] Set failed:', error);
    return false;
  }
}

/**
 * Secure get with decryption and expiration check (async for Web Crypto API)
 */
export async function secureGet<T = any>(key: string): Promise<T | null> {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    
    // Check expiration
    if (isExpired(data)) {
      secureRemove(key);
      return null;
    }
    
    let decrypted = data.value;
    
    // Decrypt if needed
    if (data.encrypted) {
      const encryptionKey = await getEncryptionKey();
      decrypted = await decrypt(data.value, encryptionKey);
    }
    
    const parsed = JSON.parse(decrypted);
    
    // Handle compressed data
    if (parsed?.compressed && parsed?.data) {
      return JSON.parse(parsed.data);
    }
    
    return parsed as T;
  } catch (error) {
    console.error('[SecureStorage] Get failed:', error);
    return null;
  }
}

/**
 * Secure remove
 */
export function secureRemove(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch (error) {
    console.error('[SecureStorage] Remove failed:', error);
  }
}

/**
 * Clear all secure storage
 */
export function secureClear(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('[SecureStorage] Clear failed:', error);
  }
}

/**
 * Check if secure storage is available
 */
export function isSecureStorageAvailable(): boolean {
  try {
    const testKey = '__secure_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

