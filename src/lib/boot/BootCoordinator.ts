/**
 * Boot Coordinator - Single Source of Truth for Splash Decisions
 *
 * This module is the ONLY place that decides:
 * - Whether to show Splash v2
 * - Whether to skip splash
 * - When to transition to main app
 *
 * HARD GUARD: It is impossible for both legacy splash and Splash v2
 * to run in the same session when using this coordinator.
 *
 * @module lib/boot/BootCoordinator
 */

import { featureFlags, getSplashV2Flags } from '@/config/featureFlags';
import {
  shouldShowSplashV2ForVersion,
  markSplashV2Seen,
  getSplashPersistenceState,
} from './splashPersistence';

// ============================================================
// TIMING CONSTANTS (Hard-coded, do not change without review)
// ============================================================

/** Total splash duration in milliseconds */
export const SPLASH_TOTAL_DURATION_MS = 2000;

/** Time by which Alberta Innovates logo must be visible */
export const SPONSOR_VISIBLE_BY_MS = 1000;

/** Quick fade duration for skip/repeat visits */
export const QUICK_FADE_DURATION_MS = 250;

// Animation timing (all in milliseconds from t=0)
export const TIMING = {
  /** t=0.00: Background shown */
  BACKGROUND_START: 0,
  /** t=0.00–0.60: Pixie dust draws heart */
  PIXIE_DUST_START: 0,
  PIXIE_DUST_END: 600,
  /** t=0.60–0.90: APEX logo materializes */
  APEX_LOGO_START: 600,
  APEX_LOGO_END: 900,
  /** t=0.80: Show text */
  TEXT_SHOW: 800,
  /** t<=1.00: Alberta Innovates logo appears */
  SPONSOR_SHOW: 1000,
  /** t=2.00: Transition out (no jank) */
  TRANSITION_START: 2000,
} as const;

// ============================================================
// BOOT DECISION TYPES
// ============================================================

export type SplashDecision =
  | { type: 'SHOW_V2_FULL'; reason: string }
  | { type: 'SHOW_V2_QUICK_FADE'; reason: string }
  | { type: 'SKIP_SPLASH'; reason: string }
  | { type: 'FALLBACK_STATIC'; reason: string };

export interface BootState {
  decision: SplashDecision;
  flags: ReturnType<typeof getSplashV2Flags>;
  persistence: ReturnType<typeof getSplashPersistenceState>;
  timestamp: number;
}

// ============================================================
// SINGLETON STATE - Prevents duplicate splash in same session
// ============================================================

let _bootDecisionMade = false;
let _currentBootState: BootState | null = null;

/**
 * HARD GUARD: Check if a boot decision has already been made this session
 */
export function hasBootDecisionBeenMade(): boolean {
  return _bootDecisionMade;
}

/**
 * Get the current boot state (if decision was made)
 */
export function getBootState(): BootState | null {
  return _currentBootState;
}

/**
 * Reset boot state (for testing only)
 * @internal
 */
export function _resetBootStateForTesting(): void {
  _bootDecisionMade = false;
  _currentBootState = null;
}

// ============================================================
// MAIN DECISION LOGIC
// ============================================================

/**
 * Determine what splash behavior to use for this boot.
 *
 * This function can only be called ONCE per session.
 * Subsequent calls will return the cached decision.
 *
 * Decision priority:
 * 1. If V2 disabled -> SKIP_SPLASH
 * 2. If force show flag -> SHOW_V2_FULL
 * 3. If new version -> SHOW_V2_FULL
 * 4. If already seen this version -> SHOW_V2_QUICK_FADE or SKIP_SPLASH
 */
export function makeBootDecision(): BootState {
  // Return cached decision if already made
  if (_bootDecisionMade && _currentBootState) {
    console.info('[BootCoordinator] Returning cached decision:', _currentBootState.decision.type);
    return _currentBootState;
  }

  const flags = getSplashV2Flags();
  const persistence = getSplashPersistenceState();
  const timestamp = Date.now();

  let decision: SplashDecision;

  // Priority 1: Feature flag is OFF - skip entirely
  if (!flags.enabled) {
    decision = {
      type: 'SKIP_SPLASH',
      reason: 'SPLASH_V2_ENABLED=false',
    };
  }
  // Priority 2: Force show flag (debug override)
  else if (flags.forceShow) {
    decision = {
      type: 'SHOW_V2_FULL',
      reason: 'SPLASH_V2_FORCE_SHOW=true',
    };
  }
  // Priority 3: New version that hasn't seen splash
  else if (persistence.shouldShow) {
    decision = {
      type: 'SHOW_V2_FULL',
      reason: `New version: ${persistence.currentVersion} (last seen: ${persistence.lastSeenVersion || 'never'})`,
    };
  }
  // Priority 4: Already seen this version - quick fade
  else {
    decision = {
      type: 'SHOW_V2_QUICK_FADE',
      reason: `Version already seen: ${persistence.currentVersion}`,
    };
  }

  // Lock in the decision
  _bootDecisionMade = true;
  _currentBootState = {
    decision,
    flags,
    persistence,
    timestamp,
  };

  console.info('[BootCoordinator] Boot decision made:', decision);

  return _currentBootState;
}

/**
 * Call this after splash v2 has been fully shown to persist the version
 */
export function onSplashV2Complete(): void {
  if (_currentBootState?.decision.type === 'SHOW_V2_FULL') {
    markSplashV2Seen();
    console.info('[BootCoordinator] Splash v2 marked as seen for version:', _currentBootState.persistence.currentVersion);
  }
}

/**
 * Get splash duration based on decision
 */
export function getSplashDuration(): number {
  if (!_currentBootState) {
    return 0;
  }

  switch (_currentBootState.decision.type) {
    case 'SHOW_V2_FULL':
    case 'FALLBACK_STATIC':
      return SPLASH_TOTAL_DURATION_MS;
    case 'SHOW_V2_QUICK_FADE':
      return QUICK_FADE_DURATION_MS;
    case 'SKIP_SPLASH':
      return 0;
  }
}

/**
 * Check if sound should play (respects flags and accessibility)
 */
export function shouldPlaySplashSound(): boolean {
  if (!_currentBootState) return false;
  if (_currentBootState.decision.type !== 'SHOW_V2_FULL') return false;

  // Check feature flag
  if (!_currentBootState.flags.soundEnabled) return false;

  // Check for reduced motion preference (often correlates with sound sensitivity)
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return false;
  }

  return true;
}

/**
 * Export all constants for external use
 */
export const BOOT_CONSTANTS = {
  SPLASH_TOTAL_DURATION_MS,
  SPONSOR_VISIBLE_BY_MS,
  QUICK_FADE_DURATION_MS,
  TIMING,
} as const;
