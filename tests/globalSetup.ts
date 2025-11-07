/**
 * Vitest Global Setup
 *
 * This file runs BEFORE any test environment (including JSDOM) is initialized.
 * It ensures that global polyfills are in place for all test workers.
 */

/**
 * Polyfill for structuredClone (Node.js < 17)
 *
 * Required for JSDOM's webidl-conversions module.
 * This is a simplified polyfill suitable for test data.
 *
 * LIMITATIONS (acceptable for tests):
 * - Doesn't handle circular references (will throw)
 * - Doesn't preserve prototypes beyond built-ins
 * - Doesn't clone functions (they're copied by reference)
 * - Map/Set/WeakMap/WeakSet are cloned as empty
 *
 * For production, use native structuredClone or a library like core-js.
 */
function structuredClonePolyfill<T>(obj: T, seen = new WeakMap()): T {
  // Primitives and null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Check for circular references
  if (seen.has(obj as object)) {
    throw new TypeError('Converting circular structure to clone');
  }
  seen.set(obj as object, true);

  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  // Handle RegExp
  if (obj instanceof RegExp) {
    const flags = obj.flags || (
      (obj.global ? 'g' : '') +
      (obj.ignoreCase ? 'i' : '') +
      (obj.multiline ? 'm' : '') +
      (obj.sticky ? 'y' : '') +
      (obj.unicode ? 'u' : '')
    );
    return new RegExp(obj.source, flags) as T;
  }

  // Handle Array
  if (Array.isArray(obj)) {
    return obj.map(item => structuredClonePolyfill(item, seen)) as T;
  }

  // Handle plain Object
  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = structuredClonePolyfill((obj as any)[key], seen);
    }
  }

  return cloned as T;
}

// Install polyfill if structuredClone doesn't exist
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = structuredClonePolyfill;
}

// Also ensure it's on the global object (for different Node.js module contexts)
if (typeof global.structuredClone === 'undefined') {
  (global as any).structuredClone = globalThis.structuredClone;
}

export default function setup() {
  // Verify polyfill is working with a simple test
  try {
    const test = { date: new Date(), arr: [1, 2], nested: { val: 'test' } };
    const cloned = globalThis.structuredClone(test);

    // Verify Date was cloned correctly
    if (!(cloned.date instanceof Date)) {
      throw new Error('structuredClone polyfill failed to clone Date');
    }

    if (process.env.VITEST_LOG_LEVEL === 'verbose') {
      console.log('✓ Global polyfills loaded and verified (structuredClone)');
    }
  } catch (error) {
    console.error('⚠ structuredClone polyfill verification failed:', error);
  }
}
