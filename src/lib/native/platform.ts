/**
 * Platform Detection and Native Initialization
 *
 * Provides utilities for detecting the current platform.
 * Native plugins removed to unblock CI - will be re-added post-App Store approval.
 *
 * @module lib/native/platform
 */

import { Capacitor } from '@capacitor/core';

/**
 * Platform detection helpers
 */
export const platform = {
  /** True if running on iOS or Android native app */
  isNative: () => Capacitor.isNativePlatform(),

  /** True if running on iOS */
  isIOS: () => Capacitor.getPlatform() === 'ios',

  /** True if running on Android */
  isAndroid: () => Capacitor.getPlatform() === 'android',

  /** True if running on web (including PWA) */
  isWeb: () => Capacitor.getPlatform() === 'web',

  /** Get current platform name */
  getName: () => Capacitor.getPlatform(),
};

/**
 * Initialize native platform (no-op without plugins)
 */
export async function initializeNativePlatform(): Promise<void> {
  if (!platform.isNative()) {
    console.info('[Platform] Running on web');
    return;
  }
  console.info(`[Platform] Native platform: ${platform.getName()}`);
}

/**
 * Clean up native platform listeners (no-op without plugins)
 */
export async function cleanupNativePlatform(): Promise<void> {
  // No-op - native plugins removed
}

export default {
  platform,
  initializeNativePlatform,
  cleanupNativePlatform,
};
