/**
 * Splash V2 Persistence Module
 *
 * Manages splash version tracking to ensure the full splash experience
 * runs only once per app version.
 *
 * Storage key: 'splash_v2_last_seen_version'
 * Value: app version string (e.g., "1.0.1")
 *
 * @module lib/boot/splashPersistence
 */

const STORAGE_KEY = 'splash_v2_last_seen_version';

/**
 * Get the current app version from package.json (injected at build time)
 * Falls back to a build timestamp if version is unavailable
 */
export function getCurrentAppVersion(): string {
  // Vite injects this at build time via define in vite.config
  // Falls back to a timestamp-based version for dev
  try {
    // Access via import.meta.env which Vite provides
    const version = import.meta.env?.VITE_APP_VERSION;
    if (version && typeof version === 'string') {
      return version;
    }
  } catch {
    // Ignore errors
  }

  // Fallback: use build timestamp or hardcoded dev version
  return import.meta.env?.DEV ? 'dev-local' : '1.0.0';
}

/**
 * Get the last seen splash version from localStorage
 * @returns The stored version string, or null if never seen
 */
export function getLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable (private browsing, etc.)
    return null;
  }
}

/**
 * Store the current version as the last seen splash version
 */
export function setLastSeenVersion(version: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, version);
  } catch {
    // localStorage unavailable - splash will show again next time
    console.warn('[SplashPersistence] Unable to persist version');
  }
}

/**
 * Mark the current app version as having seen splash v2
 */
export function markSplashV2Seen(): void {
  setLastSeenVersion(getCurrentAppVersion());
}

/**
 * Check if splash v2 should show for the current app version
 * @returns true if this is a new version that hasn't seen splash
 */
export function shouldShowSplashV2ForVersion(): boolean {
  const currentVersion = getCurrentAppVersion();
  const lastSeenVersion = getLastSeenVersion();

  // Never seen before, or version changed
  return lastSeenVersion !== currentVersion;
}

/**
 * Clear splash persistence (for testing/debug)
 */
export function clearSplashPersistence(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Debug: Get persistence state
 */
export function getSplashPersistenceState(): {
  currentVersion: string;
  lastSeenVersion: string | null;
  shouldShow: boolean;
} {
  return {
    currentVersion: getCurrentAppVersion(),
    lastSeenVersion: getLastSeenVersion(),
    shouldShow: shouldShowSplashV2ForVersion(),
  };
}
