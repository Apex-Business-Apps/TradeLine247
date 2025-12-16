/**
 * Native Services Barrel Export
 *
 * Re-exports all native service utilities for easy importing.
 *
 * Usage:
 *   import { secureStore, hideSplash, platform, initializeNativePlatform } from '@/lib/native';
 *
 * @module lib/native
 */

export { secureStore } from './secureStore';
export { hideSplash, showSplash } from './splashScreen';
export { platform, initializeNativePlatform, cleanupNativePlatform } from './platform';
