/**
 * Splash Screen Service for Capacitor Native Apps
 *
 * Controls the native splash screen to prevent white flash.
 * Call hideSplash() after first meaningful paint.
 *
 * @module lib/native/splashScreen
 */

import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

/**
 * Hide the native splash screen with a fade animation.
 * Should be called after the app has rendered its first meaningful content.
 *
 * @param fadeOutDuration - Duration of fade animation in ms (default: 300)
 */
export async function hideSplash(fadeOutDuration = 300): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return; // No-op on web
  }

  try {
    await SplashScreen.hide({ fadeOutDuration });
    console.info('[SplashScreen] Hidden successfully');
  } catch (error) {
    // Non-fatal - app still works even if splash screen fails
    console.error('[SplashScreen] Hide failed:', error);
  }
}

/**
 * Show the splash screen programmatically.
 * Useful for app state restoration or major transitions.
 */
export async function showSplash(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await SplashScreen.show({
      autoHide: false,
      fadeInDuration: 200,
      showDuration: 0,
    });
  } catch (error) {
    console.error('[SplashScreen] Show failed:', error);
  }
}

export default { hideSplash, showSplash };
