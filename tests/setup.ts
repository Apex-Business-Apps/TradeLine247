/**
 * Vitest Setup File
 *
 * Global test configuration and mocks
 * Note: structuredClone polyfill is now in globalSetup.ts (runs before JSDOM)
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock WebCrypto API with functional implementations for testing
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {
      async generateKey() {
        return {
          type: 'secret',
          extractable: true,
          algorithm: { name: 'AES-GCM', length: 256 },
          usages: ['encrypt', 'decrypt'],
        };
      },
      async encrypt(algorithm: AlgorithmIdentifier, key: CryptoKey, data: BufferSource) {
        // Simple mock encryption for testing (XOR with pattern)
        const dataArray = new Uint8Array(data as ArrayBuffer);
        const encrypted = new Uint8Array(dataArray.length);
        for (let i = 0; i < dataArray.length; i++) {
          encrypted[i] = dataArray[i] ^ 0xAA;
        }
        return encrypted.buffer;
      },
      async decrypt(algorithm: AlgorithmIdentifier, key: CryptoKey, data: BufferSource) {
        // Reverse of encrypt (XOR is symmetric)
        const dataArray = new Uint8Array(data as ArrayBuffer);
        const decrypted = new Uint8Array(dataArray.length);
        for (let i = 0; i < dataArray.length; i++) {
          decrypted[i] = dataArray[i] ^ 0xAA;
        }
        return decrypted.buffer;
      },
      async digest(algorithm: string, data: BufferSource) {
        // Mock SHA-256 hash (deterministic for testing)
        const dataArray = new Uint8Array(data as ArrayBuffer);
        const hash = new Uint8Array(32);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum = (sum + dataArray[i]) % 256;
        }
        for (let i = 0; i < 32; i++) {
          hash[i] = (sum + i) % 256;
        }
        return hash.buffer;
      },
      async importKey() {
        return {
          type: 'secret',
          extractable: true,
          algorithm: { name: 'AES-GCM', length: 256 },
          usages: ['encrypt', 'decrypt'],
        };
      },
      async exportKey() {
        const key = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          key[i] = i;
        }
        return key.buffer;
      },
    }
  },
  writable: true,
  configurable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
  root = null;
  rootMargin = '';
  thresholds = [];
} as unknown as typeof IntersectionObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
