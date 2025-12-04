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
  
  // Add other feature flags here as needed
  ANALYTICS_ENABLED: true,
  ERROR_BOUNDARY_ENABLED: true,
  SMOKE_CHECKS_ENABLED: (typeof import.meta !== 'undefined' && import.meta.env?.MODE) === 'development',
  RCS_ENABLED:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FEATURE_RCS) !== undefined
      ? import.meta.env.VITE_FEATURE_RCS === '1'
      : process.env.FEATURE_RCS === '1',
  WHATSAPP_ENABLED:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FEATURE_WHATSAPP) !== undefined
      ? import.meta.env.VITE_FEATURE_WHATSAPP === '1'
      : process.env.FEATURE_WHATSAPP === '1',
  VOICE_AI_ENABLED:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FEATURE_VOICE_AI) !== undefined
      ? import.meta.env.VITE_FEATURE_VOICE_AI === '1'
      : process.env.FEATURE_VOICE_AI === '1',
} as const;

export type FeatureFlag = keyof typeof featureFlags;

