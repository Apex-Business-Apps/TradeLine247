/**
 * Native Services Barrel Export
 *
 * Re-exports all native service utilities for easy importing.
 * Native plugins removed for PWA deployment.
 *
 * Usage:
 *   import { platform, initializeNativePlatform } from '@/lib/native';
 *
 * @module lib/native
 */

export { platform, initializeNativePlatform, cleanupNativePlatform } from './platform';
