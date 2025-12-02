/**
 * React Hook for Push Notifications
 * 
 * Manages push notification state, permissions, and registration.
 * Integrates with backend API for token registration.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  isPushAvailable,
  requestPushPermissions,
  checkPushPermissions,
  registerPushListeners,
  registerDevice,
  getPlatform,
  type PushPlatform,
} from '@/lib/push/client';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PushNotificationState {
  isAvailable: boolean;
  isEnabled: boolean;
  isRegistered: boolean;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  platform: PushPlatform | null;
  error: string | null;
}

// Use relative URL for same-origin requests, or absolute URL if provided
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Register device token with backend
 */
async function registerTokenWithBackend(
  token: string,
  platform: PushPlatform,
  appVersion?: string
): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('[Push] No session available for token registration');
      return false;
    }

    const url = API_BASE_URL ? `${API_BASE_URL}/api/push/register` : '/api/push/register';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        platform,
        token,
        appVersion: appVersion || '1.0.1',
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to register token');
    }

    return true;
  } catch (error) {
    console.error('[Push] Failed to register token with backend:', error);
    return false;
  }
}

/**
 * Unregister device token from backend
 */
async function unregisterTokenFromBackend(token: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return false;
    }

    const url = API_BASE_URL ? `${API_BASE_URL}/api/push/unregister` : '/api/push/unregister';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ token }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Push] Failed to unregister token:', error);
    return false;
  }
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isAvailable: isPushAvailable(),
    isEnabled: false,
    isRegistered: false,
    permissionStatus: 'unknown',
    platform: getPlatform(),
    error: null,
  });

  const currentTokenRef = useRef<string | null>(null);
  const listenersCleanupRef = useRef<(() => void) | null>(null);

  // Check initial permission status
  useEffect(() => {
    if (!state.isAvailable) return;

    checkPushPermissions().then((permissions) => {
      setState((prev) => ({
        ...prev,
        permissionStatus: permissions.granted ? 'granted' : permissions.denied ? 'denied' : 'prompt',
        isEnabled: permissions.granted,
      }));
    });
  }, [state.isAvailable]);

  // Register listeners when available and user is authenticated
  useEffect(() => {
    if (!state.isAvailable || !user) {
      return;
    }

    // Cleanup previous listeners
    if (listenersCleanupRef.current) {
      listenersCleanupRef.current();
    }

    // Register new listeners
    const cleanup = registerPushListeners(
      // On registration success
      async (token: string) => {
        currentTokenRef.current = token;
        const platform = getPlatform();
        if (!platform) return;

        const success = await registerTokenWithBackend(token, platform);
        setState((prev) => ({
          ...prev,
          isRegistered: success,
          isEnabled: success,
          error: success ? null : 'Failed to register with backend',
        }));

        if (success) {
          toast.success('Push notifications enabled');
        } else {
          toast.error('Failed to enable push notifications');
        }
      },
      // On registration error
      (error: Error) => {
        setState((prev) => ({
          ...prev,
          error: error.message,
          isRegistered: false,
        }));
        toast.error(`Push notification error: ${error.message}`);
      },
      // On notification received
      (notification: any) => {
        console.info('[Push] Notification received:', notification);
        // Handle notification display if needed
      },
      // On notification action
      (action: any) => {
        console.info('[Push] Notification action:', action);
        // Handle notification actions if needed
      }
    );

    listenersCleanupRef.current = cleanup;

    return cleanup;
  }, [state.isAvailable, user]);

  // Request permissions and register
  const enable = useCallback(async () => {
    if (!state.isAvailable) {
      setState((prev) => ({ ...prev, error: 'Push notifications not available' }));
      return false;
    }

    try {
      const permissions = await requestPushPermissions();
      
      if (permissions.denied) {
        setState((prev) => ({
          ...prev,
          permissionStatus: 'denied',
          isEnabled: false,
          error: 'Push notification permissions denied',
        }));
        toast.error('Push notification permissions denied');
        return false;
      }

      if (!permissions.granted) {
        setState((prev) => ({
          ...prev,
          permissionStatus: 'prompt',
          error: 'Permissions not granted',
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        permissionStatus: 'granted',
        isEnabled: true,
        error: null,
      }));

      // Register device (token will be received via listener)
      const result = await registerDevice();
      if (!result.success) {
        setState((prev) => ({
          ...prev,
          error: result.error || 'Failed to register device',
        }));
        return false;
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState((prev) => ({ ...prev, error: message }));
      toast.error(`Failed to enable push notifications: ${message}`);
      return false;
    }
  }, [state.isAvailable]);

  // Disable push notifications
  const disable = useCallback(async () => {
    if (currentTokenRef.current) {
      await unregisterTokenFromBackend(currentTokenRef.current);
      currentTokenRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isEnabled: false,
      isRegistered: false,
    }));

    toast.success('Push notifications disabled');
  }, []);

  return {
    ...state,
    enable,
    disable,
  };
}

