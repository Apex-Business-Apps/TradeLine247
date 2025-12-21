/**
 * Boot Module Exports
 *
 * Single-source-of-truth for app boot/splash decisions.
 *
 * @module lib/boot
 */

export {
  // Main coordinator
  makeBootDecision,
  getBootState,
  hasBootDecisionBeenMade,
  onSplashV2Complete,
  getSplashDuration,
  shouldPlaySplashSound,
  // Constants
  SPLASH_TOTAL_DURATION_MS,
  SPONSOR_VISIBLE_BY_MS,
  QUICK_FADE_DURATION_MS,
  TIMING,
  BOOT_CONSTANTS,
  // Types
  type SplashDecision,
  type BootState,
  // Testing
  _resetBootStateForTesting,
} from './BootCoordinator';

export {
  // Persistence
  getCurrentAppVersion,
  getLastSeenVersion,
  markSplashV2Seen,
  shouldShowSplashV2ForVersion,
  clearSplashPersistence,
  getSplashPersistenceState,
} from './splashPersistence';
