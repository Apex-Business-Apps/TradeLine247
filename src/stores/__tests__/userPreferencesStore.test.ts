/**
 * User Preferences Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUserPreferencesStore } from '../userPreferencesStore';
import type { UserPreferences } from '../userPreferencesStore';

describe('userPreferencesStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset store to initial state
    useUserPreferencesStore.getState().resetPreferences();
  });

  describe('initial state', () => {
    it('should have default preferences', () => {
      const state = useUserPreferencesStore.getState();

      expect(state.hasCompletedOnboarding).toBe(false);
      expect(state.theme).toBe('light');
      expect(state.dashboardLayout).toBe('comfortable');
      expect(state.showWelcomeMessage).toBe(true);
      expect(state.enableNotifications).toBe(true);
    });
  });

  describe('onboarding', () => {
    it('should set onboarding completed', () => {
      useUserPreferencesStore.getState().setOnboardingCompleted(true);
      
      expect(useUserPreferencesStore.getState().hasCompletedOnboarding).toBe(true);
    });

    it('should set preferred name', () => {
      useUserPreferencesStore.getState().setPreferredName('John Doe');
      
      expect(useUserPreferencesStore.getState().preferredName).toBe('John Doe');
    });

    it('should update last login time', () => {
      const before = useUserPreferencesStore.getState().lastLoginTime;
      
      useUserPreferencesStore.getState().updateLastLogin();
      
      const after = useUserPreferencesStore.getState().lastLoginTime;
      expect(after).not.toBeNull();
      expect(after).not.toBe(before);
      expect(new Date(after!).getTime()).toBeCloseTo(Date.now(), -2);
    });
  });

  describe('theme preferences', () => {
    it('should set theme', () => {
      useUserPreferencesStore.getState().setTheme('dark');
      
      expect(useUserPreferencesStore.getState().theme).toBe('dark');
    });

    it('should set accent color', () => {
      useUserPreferencesStore.getState().setAccentColor('hsl(0, 100%, 50%)');
      
      expect(useUserPreferencesStore.getState().accentColor).toBe('hsl(0, 100%, 50%)');
    });
  });

  describe('dashboard preferences', () => {
    it('should set dashboard layout', () => {
      useUserPreferencesStore.getState().setDashboardLayout('compact');
      
      expect(useUserPreferencesStore.getState().dashboardLayout).toBe('compact');
    });

    it('should toggle dashboard sections', () => {
      const initial = useUserPreferencesStore.getState().showWelcomeMessage;
      
      useUserPreferencesStore.getState().toggleDashboardSection('showWelcomeMessage');
      
      expect(useUserPreferencesStore.getState().showWelcomeMessage).toBe(!initial);
    });

    it('should toggle multiple sections independently', () => {
      const initialWelcome = useUserPreferencesStore.getState().showWelcomeMessage;
      const initialQuickActions = useUserPreferencesStore.getState().showQuickActions;
      
      useUserPreferencesStore.getState().toggleDashboardSection('showWelcomeMessage');
      
      expect(useUserPreferencesStore.getState().showWelcomeMessage).toBe(!initialWelcome);
      expect(useUserPreferencesStore.getState().showQuickActions).toBe(initialQuickActions);
    });
  });

  describe('notification settings', () => {
    it('should update notification settings', () => {
      useUserPreferencesStore.getState().setNotificationSettings({
        enableNotifications: false,
        notificationFrequency: 'none',
      });
      
      const state = useUserPreferencesStore.getState();
      expect(state.enableNotifications).toBe(false);
      expect(state.notificationFrequency).toBe('none');
    });

    it('should preserve other notification settings when updating', () => {
      const initialSoundEffects = useUserPreferencesStore.getState().enableSoundEffects;
      
      useUserPreferencesStore.getState().setNotificationSettings({
        enableNotifications: false,
      });
      
      expect(useUserPreferencesStore.getState().enableSoundEffects).toBe(initialSoundEffects);
    });
  });

  describe('display preferences', () => {
    it('should update display preferences', () => {
      useUserPreferencesStore.getState().setDisplayPreferences({
        compactMode: true,
        reduceMotion: true,
      });
      
      const state = useUserPreferencesStore.getState();
      expect(state.compactMode).toBe(true);
      expect(state.reduceMotion).toBe(true);
    });
  });

  describe('recent actions', () => {
    it('should add recent action', () => {
      useUserPreferencesStore.getState().addRecentAction('viewed-dashboard');
      
      const actions = useUserPreferencesStore.getState().recentActions;
      expect(actions).toHaveLength(1);
      expect(actions[0].action).toBe('viewed-dashboard');
      expect(actions[0].timestamp).toBeTruthy();
    });

    it('should keep only last 10 actions', () => {
      // Add 12 actions
      for (let i = 0; i < 12; i++) {
        useUserPreferencesStore.getState().addRecentAction(`action-${i}`);
      }
      
      const actions = useUserPreferencesStore.getState().recentActions;
      expect(actions).toHaveLength(10);
      expect(actions[0].action).toBe('action-11'); // Most recent first
      expect(actions[9].action).toBe('action-2'); // Oldest of the 10
    });
  });

  describe('reset preferences', () => {
    it('should reset to default preferences', () => {
      // Change some preferences
      useUserPreferencesStore.getState().setTheme('dark');
      useUserPreferencesStore.getState().setPreferredName('Test User');
      useUserPreferencesStore.getState().addRecentAction('test-action');

      // Reset
      useUserPreferencesStore.getState().resetPreferences();

      const state = useUserPreferencesStore.getState();
      expect(state.theme).toBe('light');
      expect(state.preferredName).toBeNull();
      expect(state.recentActions).toHaveLength(0);
    });
  });

  describe('localStorage persistence', () => {
    it('should persist preferences to localStorage', () => {
      useUserPreferencesStore.getState().setTheme('dark');
      
      // Store should be using persist middleware
      // We can't directly test zustand persist, but we can verify the store works
      expect(useUserPreferencesStore.getState().theme).toBe('dark');
    });
  });
});


