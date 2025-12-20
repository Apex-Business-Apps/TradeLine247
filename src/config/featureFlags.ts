/**
 * Feature Flags Configuration
 *
 * Centralized feature toggles to safely disable/enable features
 * without code removal or database changes.
 */

export const featureFlags = {
  // A/B Testing System - DISABLED to prevent DB errors
  // Set to false to short-circuit all A/B test logic
  AB_ENABLED: false,

  // React Error #310 Hardening - Runtime guards for hook violations
  // Set to true to enable dev-mode telemetry and enhanced boot checks
  H310_HARDENING: false,

  // ============================================================
  // SPLASH V2 FLAGS
  // ============================================================

  /**
   * SPLASH_V2_ENABLED - Master toggle for Splash V2 "Magic Heart" experience
   *
   * When false (default): Legacy boot flow, no animated splash
   * When true: Full Splash V2 with pixie dust animation
   *
   * @default false
   */
  SPLASH_V2_ENABLED: import.meta.env?.VITE_SPLASH_V2_ENABLED === 'true' || false,

  /**
   * SPLASH_V2_FORCE_SHOW - Debug override to force splash on every load
   *
   * When true: Always show full splash, ignore version persistence
   * For development/testing only
   *
   * @default false
   */
  SPLASH_V2_FORCE_SHOW: import.meta.env?.VITE_SPLASH_V2_FORCE_SHOW === 'true' || false,

  /**
   * SPLASH_V2_SOUND_ENABLED - Toggle for optional chime sound
   *
   * When true: Play subtle chime (respects device mute/accessibility)
   * When false: Silent splash animation
   *
   * @default true
   */
  SPLASH_V2_SOUND_ENABLED: import.meta.env?.VITE_SPLASH_V2_SOUND_ENABLED !== 'false',

  // ============================================================
  // OTHER FEATURE FLAGS
  // ============================================================

  ANALYTICS_ENABLED: true,
  ERROR_BOUNDARY_ENABLED: true,
  SMOKE_CHECKS_ENABLED: import.meta.env?.MODE === 'development',
  RCS_ENABLED: import.meta.env?.VITE_FEATURE_RCS === '1',
  WHATSAPP_ENABLED: import.meta.env?.VITE_FEATURE_WHATSAPP === '1',
  VOICE_AI_ENABLED: import.meta.env?.VITE_FEATURE_VOICE_AI === '1',
} as const;

export type FeatureFlag = keyof typeof featureFlags;

/**
 * Type-safe feature flag getter
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return Boolean(featureFlags[flag]);
}

/**
 * Get all splash v2 related flags as an object
 */
export function getSplashV2Flags() {
  return {
    enabled: featureFlags.SPLASH_V2_ENABLED,
    forceShow: featureFlags.SPLASH_V2_FORCE_SHOW,
    soundEnabled: featureFlags.SPLASH_V2_SOUND_ENABLED,
  };
}
