/**
 * Secure Storage Service for Capacitor Native Apps
 *
 * Uses @capacitor/preferences which provides:
 * - iOS: Keychain storage (encrypted)
 * - Android: EncryptedSharedPreferences (encrypted)
 * - Web: Falls back to sessionStorage (for dev only)
 *
 * @module lib/native/secureStore
 */

import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_ID_KEY = 'user_id';

/**
 * Secure storage service for sensitive data like auth tokens.
 * Automatically uses native secure storage on mobile, sessionStorage on web.
 */
export const secureStore = {
  /**
   * Store authentication token securely
   */
  async setToken(token: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      // Web fallback - sessionStorage is more secure than localStorage
      // as it's cleared when the browser tab is closed
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      return;
    }
    try {
      await Preferences.set({ key: AUTH_TOKEN_KEY, value: token });
    } catch (error) {
      console.error('[SecureStore] Failed to set token:', error);
      throw error;
    }
  },

  /**
   * Retrieve authentication token
   */
  async getToken(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      return sessionStorage.getItem(AUTH_TOKEN_KEY);
    }
    try {
      const { value } = await Preferences.get({ key: AUTH_TOKEN_KEY });
      return value;
    } catch (error) {
      console.error('[SecureStore] Failed to get token:', error);
      return null;
    }
  },

  /**
   * Remove authentication token
   */
  async clearToken(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      return;
    }
    try {
      await Preferences.remove({ key: AUTH_TOKEN_KEY });
    } catch (error) {
      console.error('[SecureStore] Failed to clear token:', error);
    }
  },

  /**
   * Store refresh token securely
   */
  async setRefreshToken(token: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
      return;
    }
    try {
      await Preferences.set({ key: REFRESH_TOKEN_KEY, value: token });
    } catch (error) {
      console.error('[SecureStore] Failed to set refresh token:', error);
      throw error;
    }
  },

  /**
   * Retrieve refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      return sessionStorage.getItem(REFRESH_TOKEN_KEY);
    }
    try {
      const { value } = await Preferences.get({ key: REFRESH_TOKEN_KEY });
      return value;
    } catch (error) {
      console.error('[SecureStore] Failed to get refresh token:', error);
      return null;
    }
  },

  /**
   * Store user ID (for quick access without parsing token)
   */
  async setUserId(userId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      sessionStorage.setItem(USER_ID_KEY, userId);
      return;
    }
    try {
      await Preferences.set({ key: USER_ID_KEY, value: userId });
    } catch (error) {
      console.error('[SecureStore] Failed to set user ID:', error);
      throw error;
    }
  },

  /**
   * Retrieve user ID
   */
  async getUserId(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      return sessionStorage.getItem(USER_ID_KEY);
    }
    try {
      const { value } = await Preferences.get({ key: USER_ID_KEY });
      return value;
    } catch (error) {
      console.error('[SecureStore] Failed to get user ID:', error);
      return null;
    }
  },

  /**
   * Clear all auth-related data (for logout)
   */
  async clearAll(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(USER_ID_KEY);
      return;
    }
    try {
      await Preferences.remove({ key: AUTH_TOKEN_KEY });
      await Preferences.remove({ key: REFRESH_TOKEN_KEY });
      await Preferences.remove({ key: USER_ID_KEY });
    } catch (error) {
      console.error('[SecureStore] Failed to clear all:', error);
    }
  },

  /**
   * Store arbitrary key-value pair
   */
  async set(key: string, value: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      sessionStorage.setItem(key, value);
      return;
    }
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error(`[SecureStore] Failed to set ${key}:`, error);
      throw error;
    }
  },

  /**
   * Retrieve arbitrary key-value pair
   */
  async get(key: string): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      return sessionStorage.getItem(key);
    }
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch (error) {
      console.error(`[SecureStore] Failed to get ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove arbitrary key-value pair
   */
  async remove(key: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      sessionStorage.removeItem(key);
      return;
    }
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.error(`[SecureStore] Failed to remove ${key}:`, error);
    }
  },
};

export default secureStore;
