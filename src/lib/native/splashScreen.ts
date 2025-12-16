/**
 * Splash Screen Service (No-Op)
 *
 * Native splash plugins removed to unblock CI.
 * Will be re-added post-App Store approval.
 *
 * @module lib/native/splashScreen
 */

/**
 * Hide the splash screen (no-op without plugin)
 */
export async function hideSplash(_fadeOutDuration = 300): Promise<void> {
  // No-op - native plugin removed
}

/**
 * Show the splash screen (no-op without plugin)
 */
export async function showSplash(): Promise<void> {
  // No-op - native plugin removed
}

export default { hideSplash, showSplash };
