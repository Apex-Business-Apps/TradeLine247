/**
 * User Preferences Store
 *
 * Manages user-specific preferences with persistence to localStorage.
 * Features:
 * - Theme preferences (light/dark/system)
 * - Dashboard layout customization
 * - Notification settings
 * - Display preferences
 * - First-time user onboarding state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface UserPreferences {
  // Onboarding & personalization
  hasCompletedOnboarding: boolean;
  preferredName: string | null;
  lastLoginTime: string | null;

  // Theme preferences
  theme: 'light' | 'dark' | 'system';
  accentColor: string;

  // Dashboard preferences
  dashboardLayout: 'compact' | 'comfortable' | 'spacious';
  showWelcomeMessage: boolean;
  showQuickActions: boolean;
  showServiceHealth: boolean;
  showRecentActivity: boolean;

  // Notification preferences
  enableNotifications: boolean;
  enableSoundEffects: boolean;
  notificationFrequency: 'all' | 'important' | 'none';

  // Display preferences
  compactMode: boolean;
  showAnimations: boolean;
  reduceMotion: boolean;

  // Analytics & tracking consent
  analyticsEnabled: boolean;

  // Translation preferences
  translationsEnabled: boolean;

  // Recent activity tracking
  recentActions: Array<{
    action: string;
    timestamp: string;
  }>;
}

interface UserPreferencesStore extends UserPreferences {
  // Actions
  setOnboardingCompleted: (completed: boolean) => void;
  setPreferredName: (name: string) => void;
  updateLastLogin: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAccentColor: (color: string) => void;
  setDashboardLayout: (layout: 'compact' | 'comfortable' | 'spacious') => void;
  toggleDashboardSection: (section: keyof Pick<UserPreferences, 'showWelcomeMessage' | 'showQuickActions' | 'showServiceHealth' | 'showRecentActivity'>) => void;
  setNotificationSettings: (settings: Partial<Pick<UserPreferences, 'enableNotifications' | 'enableSoundEffects' | 'notificationFrequency'>>) => void;
  setDisplayPreferences: (preferences: Partial<Pick<UserPreferences, 'compactMode' | 'showAnimations' | 'reduceMotion'>>) => void;
  setTranslationsEnabled: (enabled: boolean) => void;
  addRecentAction: (action: string) => void;
  resetPreferences: () => void;
}

const defaultPreferences: UserPreferences = {
  hasCompletedOnboarding: false,
  preferredName: null,
  lastLoginTime: null,
  theme: 'light', // Default to light mode instead of system preference
  accentColor: 'hsl(217, 91%, 60%)', // blue-500 equivalent in HSL
  dashboardLayout: 'comfortable',
  showWelcomeMessage: true,
  showQuickActions: true,
  showServiceHealth: true,
  showRecentActivity: true,
  enableNotifications: true,
  enableSoundEffects: false,
  notificationFrequency: 'important',
  compactMode: false,
  showAnimations: true,
  reduceMotion: false,
  analyticsEnabled: true,
  translationsEnabled: false, // Default: English only, translations must be activated
  recentActions: [],
};

export const useUserPreferencesStore = create<UserPreferencesStore>()(
  persist(
    (set) => ({
      ...defaultPreferences,

      setOnboardingCompleted: (completed) =>
        set({ hasCompletedOnboarding: completed }),

      setPreferredName: (name) =>
        set({ preferredName: name }),

      updateLastLogin: () =>
        set({ lastLoginTime: new Date().toISOString() }),

      setTheme: (theme) =>
        set({ theme }),

      setAccentColor: (color) =>
        set({ accentColor: color }),

      setDashboardLayout: (layout) =>
        set({ dashboardLayout: layout }),

      toggleDashboardSection: (section) =>
        set((state) => ({ [section]: !state[section] })),

      setNotificationSettings: (settings) =>
        set((state) => ({ ...state, ...settings })),

      setDisplayPreferences: (preferences) =>
        set((state) => ({ ...state, ...preferences })),

      setTranslationsEnabled: (enabled) =>
        set({ translationsEnabled: enabled }),

      addRecentAction: (action) =>
        set((state) => ({
          recentActions: [
            { action, timestamp: new Date().toISOString() },
            ...state.recentActions.slice(0, 9), // Keep last 10 actions
          ],
        })),

      resetPreferences: () =>
        set(defaultPreferences),
    }),
    {
      name: 'user-preferences',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
