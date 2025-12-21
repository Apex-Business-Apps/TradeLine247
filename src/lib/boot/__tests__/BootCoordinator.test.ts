/**
 * BootCoordinator Unit Tests
 *
 * Tests the single-source-of-truth splash decision logic.
 *
 * @module lib/boot/__tests__/BootCoordinator.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  makeBootDecision,
  getBootState,
  hasBootDecisionBeenMade,
  onSplashV2Complete,
  getSplashDuration,
  SPLASH_TOTAL_DURATION_MS,
  QUICK_FADE_DURATION_MS,
  _resetBootStateForTesting,
} from '../BootCoordinator';
import { clearSplashPersistence, markSplashV2Seen } from '../splashPersistence';

// Mock feature flags
vi.mock('@/config/featureFlags', () => ({
  featureFlags: {
    SPLASH_V2_ENABLED: false,
    SPLASH_V2_FORCE_SHOW: false,
    SPLASH_V2_SOUND_ENABLED: true,
  },
  getSplashV2Flags: vi.fn(() => ({
    enabled: false,
    forceShow: false,
    soundEnabled: true,
  })),
}));

describe('BootCoordinator', () => {
  beforeEach(() => {
    // Reset boot state before each test
    _resetBootStateForTesting();
    clearSplashPersistence();

    // Reset mocks
    vi.resetModules();
  });

  describe('makeBootDecision', () => {
    it('should return SKIP_SPLASH when SPLASH_V2_ENABLED=false', async () => {
      // Re-import with mocked flags
      const { makeBootDecision } = await import('../BootCoordinator');
      const { getSplashV2Flags } = await import('@/config/featureFlags');

      // Mock the flag to false
      vi.mocked(getSplashV2Flags).mockReturnValue({
        enabled: false,
        forceShow: false,
        soundEnabled: true,
      });

      const state = makeBootDecision();

      expect(state.decision.type).toBe('SKIP_SPLASH');
      expect(state.decision.reason).toContain('SPLASH_V2_ENABLED=false');
    });

    it('should return SHOW_V2_FULL when force show is enabled', async () => {
      _resetBootStateForTesting();
      const { makeBootDecision } = await import('../BootCoordinator');
      const { getSplashV2Flags } = await import('@/config/featureFlags');

      vi.mocked(getSplashV2Flags).mockReturnValue({
        enabled: true,
        forceShow: true,
        soundEnabled: true,
      });

      const state = makeBootDecision();

      expect(state.decision.type).toBe('SHOW_V2_FULL');
      expect(state.decision.reason).toContain('SPLASH_V2_FORCE_SHOW=true');
    });

    it('should return SHOW_V2_FULL for new version', async () => {
      _resetBootStateForTesting();
      clearSplashPersistence();
      const { makeBootDecision } = await import('../BootCoordinator');
      const { getSplashV2Flags } = await import('@/config/featureFlags');

      vi.mocked(getSplashV2Flags).mockReturnValue({
        enabled: true,
        forceShow: false,
        soundEnabled: true,
      });

      const state = makeBootDecision();

      expect(state.decision.type).toBe('SHOW_V2_FULL');
      expect(state.decision.reason).toContain('New version');
    });

    it('should return SHOW_V2_QUICK_FADE when version already seen', async () => {
      // First, mark the version as seen
      markSplashV2Seen();

      _resetBootStateForTesting();
      const { makeBootDecision } = await import('../BootCoordinator');
      const { getSplashV2Flags } = await import('@/config/featureFlags');

      vi.mocked(getSplashV2Flags).mockReturnValue({
        enabled: true,
        forceShow: false,
        soundEnabled: true,
      });

      const state = makeBootDecision();

      expect(state.decision.type).toBe('SHOW_V2_QUICK_FADE');
      expect(state.decision.reason).toContain('already seen');
    });

    it('should return cached decision on subsequent calls', async () => {
      const { makeBootDecision, getBootState } = await import('../BootCoordinator');

      const firstState = makeBootDecision();
      const secondState = makeBootDecision();

      expect(firstState).toBe(secondState);
      expect(getBootState()).toBe(firstState);
    });
  });

  describe('hasBootDecisionBeenMade', () => {
    it('should return false before decision is made', () => {
      _resetBootStateForTesting();
      expect(hasBootDecisionBeenMade()).toBe(false);
    });

    it('should return true after decision is made', () => {
      _resetBootStateForTesting();
      makeBootDecision();
      expect(hasBootDecisionBeenMade()).toBe(true);
    });
  });

  describe('getSplashDuration', () => {
    it('should return 0 when no decision made', () => {
      _resetBootStateForTesting();
      expect(getSplashDuration()).toBe(0);
    });

    it('should return correct duration for SHOW_V2_FULL', async () => {
      _resetBootStateForTesting();
      const { makeBootDecision, getSplashDuration } = await import('../BootCoordinator');
      const { getSplashV2Flags } = await import('@/config/featureFlags');

      vi.mocked(getSplashV2Flags).mockReturnValue({
        enabled: true,
        forceShow: true,
        soundEnabled: true,
      });

      makeBootDecision();
      expect(getSplashDuration()).toBe(SPLASH_TOTAL_DURATION_MS);
    });

    it('should return quick fade duration for repeat visit', async () => {
      markSplashV2Seen();
      _resetBootStateForTesting();

      const { makeBootDecision, getSplashDuration, QUICK_FADE_DURATION_MS } = await import('../BootCoordinator');
      const { getSplashV2Flags } = await import('@/config/featureFlags');

      vi.mocked(getSplashV2Flags).mockReturnValue({
        enabled: true,
        forceShow: false,
        soundEnabled: true,
      });

      makeBootDecision();
      expect(getSplashDuration()).toBe(QUICK_FADE_DURATION_MS);
    });
  });

  describe('onSplashV2Complete', () => {
    it('should persist version after full splash', async () => {
      clearSplashPersistence();
      _resetBootStateForTesting();

      const { makeBootDecision, onSplashV2Complete } = await import('../BootCoordinator');
      const { getLastSeenVersion } = await import('../splashPersistence');
      const { getSplashV2Flags } = await import('@/config/featureFlags');

      vi.mocked(getSplashV2Flags).mockReturnValue({
        enabled: true,
        forceShow: true,
        soundEnabled: true,
      });

      makeBootDecision();
      onSplashV2Complete();

      expect(getLastSeenVersion()).not.toBeNull();
    });
  });

  describe('Hard guard: No duplicate splash', () => {
    it('should prevent both legacy and v2 from running by returning cached decision', async () => {
      _resetBootStateForTesting();
      const { makeBootDecision, hasBootDecisionBeenMade } = await import('../BootCoordinator');

      // First call makes the decision
      const first = makeBootDecision();
      expect(hasBootDecisionBeenMade()).toBe(true);

      // Second call returns same decision (no duplicate splash possible)
      const second = makeBootDecision();
      expect(first).toBe(second);
    });
  });
});

describe('Timing Constants', () => {
  it('should have sponsor visible by 1.0s', async () => {
    const { TIMING } = await import('../BootCoordinator');
    expect(TIMING.SPONSOR_SHOW).toBeLessThanOrEqual(1000);
  });

  it('should have total duration of 2.0s', () => {
    expect(SPLASH_TOTAL_DURATION_MS).toBe(2000);
  });

  it('should have quick fade of 250ms', () => {
    expect(QUICK_FADE_DURATION_MS).toBe(250);
  });
});
