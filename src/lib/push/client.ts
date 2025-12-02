/**
 * Push Notifications Client Library
 * 
 * Framework-agnostic wrapper around Capacitor Push Notifications plugin.
 * Provides functions for requesting permissions, registering tokens, and handling notifications.
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export type PushPlatform = 'ios' | 'android';

export interface PushRegistrationResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface PushPermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

/**
 * Check if push notifications are available on the current platform
 */
export function isPushAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Request push notification permissions
 * Returns permission status
 */
export async function requestPushPermissions(): Promise<PushPermissionStatus> {
  if (!isPushAvailable()) {
    return { granted: false, denied: false, prompt: false };
  }

  try {
    const result = await PushNotifications.requestPermissions();
    return {
      granted: result.receive === 'granted',
      denied: result.receive === 'denied',
      prompt: result.receive === 'prompt',
    };
  } catch (error) {
    console.error('[Push] Failed to request permissions:', error);
    return { granted: false, denied: true, prompt: false };
  }
}

/**
 * Check current permission status
 */
export async function checkPushPermissions(): Promise<PushPermissionStatus> {
  if (!isPushAvailable()) {
    return { granted: false, denied: false, prompt: false };
  }

  try {
    const result = await PushNotifications.checkPermissions();
    return {
      granted: result.receive === 'granted',
      denied: result.receive === 'denied',
      prompt: result.receive === 'prompt',
    };
  } catch (error) {
    console.error('[Push] Failed to check permissions:', error);
    return { granted: false, denied: false, prompt: false };
  }
}

/**
 * Register push notification listeners
 * Returns cleanup function to remove listeners
 */
export function registerPushListeners(
  onRegistration: (token: string) => void,
  onRegistrationError: (error: Error) => void,
  onNotificationReceived: (notification: any) => void,
  onNotificationActionPerformed: (action: any) => void
): () => void {
  if (!isPushAvailable()) {
    return () => {}; // No-op cleanup
  }

  // Registration success listener
  const registrationListener = PushNotifications.addListener(
    'registration',
    (token) => {
      console.info('[Push] Device registered:', token.value);
      onRegistration(token.value);
    }
  );

  // Registration error listener
  const registrationErrorListener = PushNotifications.addListener(
    'registrationError',
    (error) => {
      console.error('[Push] Registration error:', error);
      onRegistrationError(new Error(error.error));
    }
  );

  // Notification received listener
  const notificationReceivedListener = PushNotifications.addListener(
    'pushNotificationReceived',
    (notification) => {
      console.info('[Push] Notification received:', notification);
      onNotificationReceived(notification);
    }
  );

  // Notification action listener
  const notificationActionListener = PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (action) => {
      console.info('[Push] Notification action performed:', action);
      onNotificationActionPerformed(action);
    }
  );

  // Return cleanup function
  return () => {
    registrationListener.remove();
    registrationErrorListener.remove();
    notificationReceivedListener.remove();
    notificationActionListener.remove();
  };
}

/**
 * Get the current platform (ios/android)
 */
export function getPlatform(): PushPlatform | null {
  if (!isPushAvailable()) {
    return null;
  }

  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return null;
}

/**
 * Register device with push notifications
 * This should be called after permissions are granted
 */
export async function registerDevice(): Promise<PushRegistrationResult> {
  if (!isPushAvailable()) {
    return { success: false, error: 'Push notifications not available on this platform' };
  }

  try {
    // Check permissions first
    const permissions = await checkPushPermissions();
    if (!permissions.granted) {
      return { success: false, error: 'Push notification permissions not granted' };
    }

    // Register with Capacitor
    await PushNotifications.register();
    
    // Token will be received via listener (registerPushListeners)
    return { success: true };
  } catch (error) {
    console.error('[Push] Failed to register device:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

