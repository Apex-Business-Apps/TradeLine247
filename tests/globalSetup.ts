/**
 * Vitest Global Setup
 *
 * This file runs BEFORE any test environment (including JSDOM) is initialized.
 * It ensures that global polyfills are in place for all test workers.
 */

// Polyfill structuredClone for Node.js < 17 (required for JSDOM's webidl-conversions)
// This MUST run before JSDOM initializes in the test worker
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj)) as T;
  };
}

// Also ensure it's on the global object (for different Node.js module contexts)
if (typeof global.structuredClone === 'undefined') {
  (global as any).structuredClone = globalThis.structuredClone;
}

export default function setup() {
  // This function is called once before all tests
  console.log('✓ Global polyfills loaded (structuredClone)');
}
