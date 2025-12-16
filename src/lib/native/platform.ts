/**
 * Platform Detection and Native Initialization
 *
 * Provides utilities for detecting the current platform and initializing
 * native plugins when running on iOS or Android.
 *
 * @module lib/native/platform
 */

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { hideSplash } from './splashScreen';

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
 * Initialize native plugins and platform-specific settings.
 * Call this once when the app starts, after first render.
 */
export async function initializeNativePlatform(): Promise<void> {
  if (!platform.isNative()) {
    console.info('[Platform] Running on web - skipping native initialization');
    return;
  }

  console.info(`[Platform] Initializing native platform: ${platform.getName()}`);

  try {
    // Configure status bar for edge-to-edge
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });

    // Make status bar transparent for edge-to-edge design
    if (platform.isAndroid()) {
      await StatusBar.setBackgroundColor({ color: '#00000000' });
    }

    console.info('[Platform] Status bar configured');
  } catch (error) {
    console.error('[Platform] Status bar configuration failed:', error);
  }

  try {
    // Set up keyboard listeners for input focusing
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.classList.add('keyboard-open');
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
      document.body.style.removeProperty('--keyboard-height');
    });

    console.info('[Platform] Keyboard listeners configured');
  } catch (error) {
    console.error('[Platform] Keyboard configuration failed:', error);
  }

  // Hide splash screen after initialization
  await hideSplash();
}

/**
 * Clean up native platform listeners.
 * Call this when the app is unmounting (though typically not needed).
 */
export async function cleanupNativePlatform(): Promise<void> {
  if (!platform.isNative()) {
    return;
  }

  try {
    await Keyboard.removeAllListeners();
    console.info('[Platform] Cleaned up native listeners');
  } catch (error) {
    console.error('[Platform] Cleanup failed:', error);
  }
}

export default {
  platform,
  initializeNativePlatform,
  cleanupNativePlatform,
};
