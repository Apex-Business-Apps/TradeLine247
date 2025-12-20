/**
 * Splash Persistence Unit Tests
 *
 * Tests the version-based persistence for splash v2.
 *
 * @module lib/boot/__tests__/splashPersistence.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCurrentAppVersion,
  getLastSeenVersion,
  setLastSeenVersion,
  markSplashV2Seen,
  shouldShowSplashV2ForVersion,
  clearSplashPersistence,
  getSplashPersistenceState,
} from '../splashPersistence';

describe('splashPersistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearSplashPersistence();
    localStorage.clear();
  });

  describe('getCurrentAppVersion', () => {
    it('should return a version string', () => {
      const version = getCurrentAppVersion();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    });

    it('should return dev-local in development when env var not set', () => {
      // In test environment, import.meta.env.DEV is typically true
      const version = getCurrentAppVersion();
      // Should be either a semantic version or 'dev-local'
      expect(version).toMatch(/^(\d+\.\d+\.\d+|dev-local)$/);
    });
  });

  describe('getLastSeenVersion', () => {
    it('should return null when no version has been seen', () => {
      expect(getLastSeenVersion()).toBeNull();
    });

    it('should return stored version after setting', () => {
      setLastSeenVersion('1.0.0');
      expect(getLastSeenVersion()).toBe('1.0.0');
    });
  });

  describe('setLastSeenVersion', () => {
    it('should store version in localStorage', () => {
      setLastSeenVersion('2.0.0');
      expect(localStorage.getItem('splash_v2_last_seen_version')).toBe('2.0.0');
    });

    it('should overwrite previous version', () => {
      setLastSeenVersion('1.0.0');
      setLastSeenVersion('2.0.0');
      expect(getLastSeenVersion()).toBe('2.0.0');
    });
  });

  describe('markSplashV2Seen', () => {
    it('should set last seen version to current version', () => {
      markSplashV2Seen();
      const currentVersion = getCurrentAppVersion();
      expect(getLastSeenVersion()).toBe(currentVersion);
    });
  });

  describe('shouldShowSplashV2ForVersion', () => {
    it('should return true when no version has been seen', () => {
      expect(shouldShowSplashV2ForVersion()).toBe(true);
    });

    it('should return false when current version matches last seen', () => {
      markSplashV2Seen();
      expect(shouldShowSplashV2ForVersion()).toBe(false);
    });

    it('should return true when version changes', () => {
      setLastSeenVersion('0.0.1');
      expect(shouldShowSplashV2ForVersion()).toBe(true);
    });
  });

  describe('clearSplashPersistence', () => {
    it('should remove stored version', () => {
      markSplashV2Seen();
      expect(getLastSeenVersion()).not.toBeNull();

      clearSplashPersistence();
      expect(getLastSeenVersion()).toBeNull();
    });
  });

  describe('getSplashPersistenceState', () => {
    it('should return current state object', () => {
      const state = getSplashPersistenceState();

      expect(state).toHaveProperty('currentVersion');
      expect(state).toHaveProperty('lastSeenVersion');
      expect(state).toHaveProperty('shouldShow');
    });

    it('should reflect correct state after marking seen', () => {
      let state = getSplashPersistenceState();
      expect(state.shouldShow).toBe(true);
      expect(state.lastSeenVersion).toBeNull();

      markSplashV2Seen();

      state = getSplashPersistenceState();
      expect(state.shouldShow).toBe(false);
      expect(state.lastSeenVersion).toBe(state.currentVersion);
    });
  });

  describe('First run vs repeat run vs version bump', () => {
    it('first run: should show splash (no previous version)', () => {
      // Fresh state - no previous version
      expect(getLastSeenVersion()).toBeNull();
      expect(shouldShowSplashV2ForVersion()).toBe(true);
    });

    it('repeat run: should not show splash (same version)', () => {
      // First run - mark as seen
      markSplashV2Seen();
      expect(shouldShowSplashV2ForVersion()).toBe(false);

      // Simulate app restart (values persist)
      expect(shouldShowSplashV2ForVersion()).toBe(false);
    });

    it('version bump: should show splash (different version)', () => {
      // User saw v1.0.0
      setLastSeenVersion('1.0.0');

      // App updated to new version (current version != 1.0.0)
      const current = getCurrentAppVersion();
      if (current !== '1.0.0') {
        expect(shouldShowSplashV2ForVersion()).toBe(true);
      } else {
        // If test version happens to be 1.0.0, force a different scenario
        setLastSeenVersion('0.9.0');
        expect(shouldShowSplashV2ForVersion()).toBe(true);
      }
    });
  });

  describe('localStorage unavailable', () => {
    it('should handle localStorage errors gracefully', () => {
      // Use vi.spyOn to properly mock localStorage methods
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      // Should not throw - functions handle errors gracefully
      expect(() => getLastSeenVersion()).not.toThrow();
      expect(() => setLastSeenVersion('1.0.0')).not.toThrow();
      expect(() => markSplashV2Seen()).not.toThrow();

      // getLastSeenVersion returns null when localStorage fails
      expect(getLastSeenVersion()).toBeNull();

      // shouldShowSplashV2ForVersion returns true because null !== currentVersion
      expect(shouldShowSplashV2ForVersion()).toBe(true);

      // Restore mocks
      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });
});
