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

  // Splash v2 (Magic Heart) - OFF by default until fully tested
  // Enable to show the new 2.0s "Magic Heart" splash experience
  SPLASH_V2_ENABLED: import.meta.env?.VITE_SPLASH_V2_ENABLED === 'true' || false,

  // Splash v2 Force Show - Debug override to always show splash (ignore persistence)
  // Useful for testing/demos - overrides "once per version" persistence
  SPLASH_V2_FORCE_SHOW: import.meta.env?.VITE_SPLASH_V2_FORCE_SHOW === 'true' || false,

  // Splash v2 Sound - Enable/disable optional chime sound
  // Respects user's sound preferences and accessibility settings
  SPLASH_V2_SOUND_ENABLED: import.meta.env?.VITE_SPLASH_V2_SOUND_ENABLED !== 'false', // default true

  // Add other feature flags here as needed
  ANALYTICS_ENABLED: true,
  ERROR_BOUNDARY_ENABLED: true,
  SMOKE_CHECKS_ENABLED: import.meta.env?.MODE === 'development',
  RCS_ENABLED: import.meta.env?.VITE_FEATURE_RCS === '1',
  WHATSAPP_ENABLED: import.meta.env?.VITE_FEATURE_WHATSAPP === '1',
  VOICE_AI_ENABLED: import.meta.env?.VITE_FEATURE_VOICE_AI === '1',
} as const;

export type FeatureFlag = keyof typeof featureFlags;
