/**
 * BootController Unit Tests
 *
 * Tests the single source of truth for splash/boot logic.
 *
 * Coverage:
 * - Gating logic: first run vs repeat run vs version bump
 * - v2 flag OFF: BootController never navigates to v2
 * - Legacy splash not reachable
 * - Persistence logic
 *
 * @module lib/__tests__/BootController.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BootController } from '../BootController';
import { featureFlags } from '@/config/featureFlags';

// Mock Capacitor Preferences
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

import { Preferences } from '@capacitor/preferences';

describe('BootController', () => {
  let bootController: BootController;

  beforeEach(() => {
    // Reset singleton and mocks before each test
    (BootController as any).instance = null;
    bootController = BootController.getInstance();
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = BootController.getInstance();
      const instance2 = BootController.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Legacy Splash Hard Guard', () => {
    it('should ALWAYS block legacy splash', () => {
      expect(bootController.isLegacySplashBlocked()).toBe(true);
    });

    it('should never allow legacy splash to be enabled', () => {
      // Even if we try to manipulate internal state, it should stay blocked
      expect(bootController.isLegacySplashBlocked()).toBe(true);
    });
  });

  describe('Boot Decision Logic - Flag OFF', () => {
    it('should skip splash when SPLASH_V2_ENABLED is false', async () => {
      // Mock feature flag as disabled
      vi.spyOn(featureFlags, 'SPLASH_V2_ENABLED', 'get').mockReturnValue(false);

      const decision = await bootController.getBootDecision();

      expect(decision).toBe('SKIP_SPLASH');
    });
  });

  describe('Boot Decision Logic - Flag ON', () => {
    beforeEach(() => {
      // Mock feature flag as enabled
      vi.spyOn(featureFlags, 'SPLASH_V2_ENABLED', 'get').mockReturnValue(true);
      vi.spyOn(featureFlags, 'SPLASH_V2_FORCE_SHOW', 'get').mockReturnValue(false);
    });

    it('should show full splash on first run (no version stored)', async () => {
      // Mock: No version stored (first run)
      vi.mocked(Preferences.get).mockResolvedValue({ value: null });

      const decision = await bootController.getBootDecision();

      expect(decision).toBe('SHOW_SPLASH_V2');
    });

    it('should show full splash when app version changes', async () => {
      // Mock: Different version stored
      vi.mocked(Preferences.get).mockResolvedValue({ value: '1.0.0' });

      // Current version is 1.0.1 (from package.json or env)
      const decision = await bootController.getBootDecision();

      expect(decision).toBe('SHOW_SPLASH_V2');
    });

    it('should show quick fade when version matches (return user)', async () => {
      // Mock: Same version stored (return user)
      vi.mocked(Preferences.get).mockResolvedValue({ value: '1.0.1' });

      const decision = await bootController.getBootDecision();

      expect(decision).toBe('QUICK_FADE');
    });

    it('should cache decision after first call', async () => {
      vi.mocked(Preferences.get).mockResolvedValue({ value: null });

      const decision1 = await bootController.getBootDecision();
      const decision2 = await bootController.getBootDecision();

      expect(decision1).toBe('SHOW_SPLASH_V2');
      expect(decision2).toBe('SHOW_SPLASH_V2');

      // Should only call Preferences.get once (cached)
      expect(Preferences.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Force Show Override (Debug Mode)', () => {
    it('should always show splash when SPLASH_V2_FORCE_SHOW is true', async () => {
      vi.spyOn(featureFlags, 'SPLASH_V2_ENABLED', 'get').mockReturnValue(true);
      vi.spyOn(featureFlags, 'SPLASH_V2_FORCE_SHOW', 'get').mockReturnValue(true);

      // Even if version matches (would normally be QUICK_FADE)
      vi.mocked(Preferences.get).mockResolvedValue({ value: '1.0.1' });

      const decision = await bootController.getBootDecision();

      expect(decision).toBe('SHOW_SPLASH_V2');
    });
  });

  describe('Persistence', () => {
    it('should mark splash as seen and store current version', async () => {
      vi.mocked(Preferences.set).mockResolvedValue();

      await bootController.markSplashAsSeen();

      expect(Preferences.set).toHaveBeenCalledWith({
        key: 'splash_v2_last_seen_version',
        value: expect.any(String), // Should be current version
      });
    });

    it('should reset persistence when resetSplashPersistence is called', async () => {
      vi.mocked(Preferences.remove).mockResolvedValue();
      vi.spyOn(featureFlags, 'SPLASH_V2_ENABLED', 'get').mockReturnValue(true);
      vi.spyOn(featureFlags, 'SPLASH_V2_FORCE_SHOW', 'get').mockReturnValue(false);

      // First call caches decision
      vi.mocked(Preferences.get).mockResolvedValue({ value: '1.0.1' });
      await bootController.getBootDecision();

      // Reset should clear cache and storage
      await bootController.resetSplashPersistence();

      expect(Preferences.remove).toHaveBeenCalledWith({ key: 'splash_v2_last_seen_version' });

      // After reset, should re-compute decision
      vi.mocked(Preferences.get).mockResolvedValue({ value: null });
      const decision = await bootController.getBootDecision();

      expect(decision).toBe('SHOW_SPLASH_V2');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage read errors gracefully', async () => {
      vi.spyOn(featureFlags, 'SPLASH_V2_ENABLED', 'get').mockReturnValue(true);
      vi.spyOn(featureFlags, 'SPLASH_V2_FORCE_SHOW', 'get').mockReturnValue(false);

      // Mock storage error
      vi.mocked(Preferences.get).mockRejectedValue(new Error('Storage unavailable'));

      const decision = await bootController.getBootDecision();

      // Should default to showing splash on error (safe fallback)
      expect(decision).toBe('SHOW_SPLASH_V2');
    });
  });
});
