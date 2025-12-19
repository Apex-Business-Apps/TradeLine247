/**
 * Magic Heart Splash v2 - Timing Constants
 *
 * ALL timing values are defined here as HARD CONSTANTS.
 * Do not modify these without design approval.
 *
 * Total duration: 2.0s (hard cap)
 * Alberta Innovates logo MUST be visible by 1.0s
 *
 * @module components/splash/constants
 */

/**
 * Timing constants (all values in milliseconds)
 */
export const SPLASH_TIMING = {
  /** Total splash duration (hard cap) */
  TOTAL_DURATION: 2000, // 2.0s

  /** Background visible immediately */
  BACKGROUND_START: 0, // t=0.00

  /** Pixie dust trail draws heart */
  PIXIE_DUST_START: 0, // t=0.00
  PIXIE_DUST_END: 600, // t=0.60
  PIXIE_DUST_DURATION: 600, // 0.60s

  /** APEX logo materializes */
  APEX_LOGO_START: 600, // t=0.60
  APEX_LOGO_END: 900, // t=0.90
  APEX_LOGO_DURATION: 300, // 0.30s

  /** Text appears */
  TEXT_START: 800, // t=0.80

  /** Alberta Innovates logo appears (CRITICAL: must be <=1.0s) */
  ALBERTA_LOGO_START: 1000, // t=1.00
  ALBERTA_LOGO_END: 2000, // t=2.00 (remains until end)

  /** Transition/fade out */
  TRANSITION_START: 2000, // t=2.00
} as const;

/**
 * Animation easing curves
 */
export const SPLASH_EASING = {
  /** Smooth ease-out for pixie dust trail */
  PIXIE_DUST: 'cubic-bezier(0.22, 0.61, 0.36, 1)', // Custom ease-out

  /** Material Design standard easing for logo */
  APEX_LOGO: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Standard easing

  /** Gentle fade-in for text */
  TEXT: 'ease-in',

  /** Quick fade-in for sponsor logo */
  ALBERTA_LOGO: 'ease-out',
} as const;

/**
 * Fallback constants
 */
export const SPLASH_FALLBACK = {
  /** Fallback static display duration if animations fail */
  STATIC_DURATION: 1000, // 1.0s

  /** Fade-out duration for fallback */
  FADE_OUT_DURATION: 200, // 0.2s
} as const;

/**
 * Z-index layers (ensure proper stacking)
 */
export const SPLASH_Z_INDEX = {
  BACKGROUND: 9990,
  PIXIE_DUST: 9991,
  APEX_LOGO: 9992,
  TEXT: 9993,
  ALBERTA_LOGO: 9994,
  OVERLAY: 9999, // Top-most layer
} as const;

/**
 * Quick fade constants (for return users)
 */
export const QUICK_FADE = {
  /** Quick fade duration for return users */
  DURATION: 250, // 250ms
} as const;

/**
 * Accessibility constants
 */
export const SPLASH_A11Y = {
  /** Prefers-reduced-motion: use instant transitions */
  REDUCED_MOTION_DURATION: 0, // Instant

  /** Skip button appears after this delay */
  SKIP_BUTTON_DELAY: 500, // 0.5s
} as const;
