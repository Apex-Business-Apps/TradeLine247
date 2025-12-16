/**
 * Platform Detection
 *
 * Provides utilities for detecting the current platform.
 * Native plugins removed for PWA deployment.
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
 * Initialize platform-specific settings.
 * Call this once when the app starts, after first render.
 * Native plugins removed for PWA deployment.
 */
export async function initializeNativePlatform(): Promise<void> {
  console.info(`[Platform] Running on platform: ${platform.getName()}`);
  // No native plugins to initialize - PWA only
}

/**
 * Clean up platform listeners.
 * Call this when the app is unmounting (though typically not needed).
 */
export async function cleanupNativePlatform(): Promise<void> {
  // No native listeners to clean up - PWA only
}

export default {
  platform,
  initializeNativePlatform,
  cleanupNativePlatform,
};
