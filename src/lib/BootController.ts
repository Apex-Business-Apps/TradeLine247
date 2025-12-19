/**
 * BootController - Single Source of Truth for App Splash/Boot Flow
 *
 * CRITICAL DESIGN RULE: This is the ONLY place that decides:
 * - Whether to show Splash v2
 * - Whether to skip splash
 * - When to transition to main app
 *
 * HARD GUARD: It is impossible for both legacy splash and Splash v2 to run
 * in the same session. Only ONE splash experience can be active.
 *
 * @module lib/BootController
 */

import { featureFlags } from '@/config/featureFlags';
import { Preferences } from '@capacitor/preferences';

// Storage keys
const STORAGE_KEY_SPLASH_VERSION = 'splash_v2_last_seen_version';

/**
 * Boot decisions that BootController can make
 */
export type BootDecision =
  | 'SHOW_SPLASH_V2' // Show full Magic Heart splash v2 (2.0s)
  | 'SKIP_SPLASH'    // Skip splash entirely (repeat visit, flag off, etc.)
  | 'QUICK_FADE';    // Quick fade transition (<250ms) for return users

/**
 * BootController class - manages all splash/boot logic
 */
export class BootController {
  private static instance: BootController | null = null;
  private decision: BootDecision | null = null;
  private _isLegacySplashBlocked = true; // HARD GUARD: Legacy splash always blocked

  /**
   * Singleton accessor
   */
  static getInstance(): BootController {
    if (!BootController.instance) {
      BootController.instance = new BootController();
    }
    return BootController.instance;
  }

  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {
    // Initialize decision on construction
    this.decision = null;
  }

  /**
   * HARD GUARD: Legacy splash is ALWAYS blocked
   * This prevents any possibility of stacked/duplicate splash screens
   */
  isLegacySplashBlocked(): boolean {
    return this._isLegacySplashBlocked;
  }

  /**
   * Main decision function: Determines what splash experience to show
   * Called ONCE at app start, result is cached
   */
  async getBootDecision(): Promise<BootDecision> {
    // Return cached decision if already computed
    if (this.decision !== null) {
      return this.decision;
    }

    // Compute decision
    this.decision = await this._computeBootDecision();
    return this.decision;
  }

  /**
   * Internal: Compute the boot decision based on flags and persistence
   */
  private async _computeBootDecision(): Promise<BootDecision> {
    // 1. Check if Splash v2 is enabled via feature flag
    if (!featureFlags.SPLASH_V2_ENABLED) {
      console.info('[BootController] Splash v2 disabled via feature flag');
      return 'SKIP_SPLASH';
    }

    // 2. Check force-show override (debug/demo mode)
    if (featureFlags.SPLASH_V2_FORCE_SHOW) {
      console.info('[BootController] Splash v2 force-show enabled (debug mode)');
      return 'SHOW_SPLASH_V2';
    }

    // 3. Check persistence: Has user seen splash for this app version?
    const currentVersion = await this._getCurrentAppVersion();
    const lastSeenVersion = await this._getLastSeenSplashVersion();

    if (lastSeenVersion === currentVersion) {
      console.info('[BootController] Splash v2 already seen for version', currentVersion);
      return 'QUICK_FADE';
    }

    // 4. Show full splash for first-time or version-bump users
    console.info('[BootController] Showing Splash v2 for version', currentVersion);
    return 'SHOW_SPLASH_V2';
  }

  /**
   * Mark splash as seen for current version
   * Called after splash v2 completes successfully
   */
  async markSplashAsSeen(): Promise<void> {
    const currentVersion = await this._getCurrentAppVersion();
    await Preferences.set({
      key: STORAGE_KEY_SPLASH_VERSION,
      value: currentVersion,
    });
    console.info('[BootController] Marked splash v2 as seen for version', currentVersion);
  }

  /**
   * Reset splash persistence (for testing/debug)
   */
  async resetSplashPersistence(): Promise<void> {
    await Preferences.remove({ key: STORAGE_KEY_SPLASH_VERSION });
    this.decision = null; // Reset cached decision
    console.info('[BootController] Splash persistence reset');
  }

  /**
   * Get current app version from package.json
   */
  private async _getCurrentAppVersion(): Promise<string> {
    // In production builds, version might be injected via build process
    // For now, use a hardcoded version that we'll update with each release
    // TODO: Inject this from package.json during build
    return import.meta.env?.VITE_APP_VERSION || '1.0.1';
  }

  /**
   * Get last seen splash version from persistent storage
   */
  private async _getLastSeenSplashVersion(): Promise<string | null> {
    try {
      const result = await Preferences.get({ key: STORAGE_KEY_SPLASH_VERSION });
      return result.value || null;
    } catch (error) {
      console.warn('[BootController] Failed to read splash version from storage:', error);
      return null;
    }
  }
}

/**
 * Singleton accessor for convenience
 */
export const bootController = BootController.getInstance();
