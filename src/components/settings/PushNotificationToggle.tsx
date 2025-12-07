/**
 * Push Notification Toggle Component
 * 
 * Settings UI component for enabling/disabling push notifications.
 * Uses existing design tokens and patterns.
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';

export const PushNotificationToggle: React.FC = () => {
  const {
    isAvailable,
    isEnabled,
    permissionStatus,
    platform,
    error,
    enable,
    disable,
  } = usePushNotifications();

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await enable();
    } else {
      await disable();
    }
  };

  // Don't show on web (not available)
  if (!isAvailable) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-notifications" className="text-sm font-medium">
              Push Notifications
            </Label>
            <p className="text-xs text-muted-foreground">
              Available on iOS and Android mobile apps
            </p>
          </div>
          <Switch id="push-notifications" disabled checked={false} />
        </div>
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-xs text-blue-800 dark:text-blue-300">
            Push notifications are only available in the mobile app
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Determine status text
  const getStatusText = () => {
    if (error) {
      return `Error: ${error}`;
    }
    if (permissionStatus === 'denied') {
      return 'Permission denied - enable in device settings';
    }
    if (permissionStatus === 'prompt') {
      return 'Tap to enable';
    }
    if (isEnabled) {
      return `Enabled on ${platform === 'ios' ? 'iOS' : 'Android'}`;
    }
    return 'Disabled';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="push-notifications" className="text-sm font-medium">
            Push Notifications
          </Label>
          <p className="text-xs text-muted-foreground">
            {getStatusText()}
          </p>
        </div>
        <Switch
          id="push-notifications"
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={permissionStatus === 'denied'}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-xs text-red-800 dark:text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {permissionStatus === 'denied' && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-300">
            Push notifications are disabled in your device settings. Enable them in Settings → TradeLine 24/7 → Notifications
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

