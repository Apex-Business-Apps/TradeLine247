/**
 * Dashboard Settings Dialog
 *
 * Comprehensive settings panel for dashboard customization.
 * Features:
 * - Layout preferences
 * - Display options
 * - Notification settings
 * - Privacy controls
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PushNotificationToggle } from '@/components/settings/PushNotificationToggle';

interface DashboardSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DashboardSettingsDialog: React.FC<DashboardSettingsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    dashboardLayout,
    showWelcomeMessage,
    showQuickActions,
    showServiceHealth,
    showRecentActivity,
    enableNotifications,
    enableSoundEffects,
    notificationFrequency,
    showAnimations,
    reduceMotion,
    setDashboardLayout,
    toggleDashboardSection,
    setNotificationSettings,
    setDisplayPreferences,
  } = useUserPreferencesStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription className="text-slate-700 dark:text-slate-300">
            Customize your dashboard experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Layout Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Layout</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Choose your preferred dashboard layout</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={dashboardLayout}
                onValueChange={(value: any) => setDashboardLayout(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="compact" id="layout-compact" />
                  <Label htmlFor="layout-compact" className="cursor-pointer">
                    Compact
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comfortable" id="layout-comfortable" />
                  <Label htmlFor="layout-comfortable" className="cursor-pointer">
                    Comfortable
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spacious" id="layout-spacious" />
                  <Label htmlFor="layout-spacious" className="cursor-pointer">
                    Spacious
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Separator />

          {/* Dashboard Sections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dashboard Sections</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Toggle visibility of dashboard components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="welcome-message" className="cursor-pointer">
                  Welcome Message
                </Label>
                <Switch
                  id="welcome-message"
                  checked={showWelcomeMessage}
                  onCheckedChange={() => toggleDashboardSection('showWelcomeMessage')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="quick-actions" className="cursor-pointer">
                  Quick Actions
                </Label>
                <Switch
                  id="quick-actions"
                  checked={showQuickActions}
                  onCheckedChange={() => toggleDashboardSection('showQuickActions')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="service-health" className="cursor-pointer">
                  Service Health
                </Label>
                <Switch
                  id="service-health"
                  checked={showServiceHealth}
                  onCheckedChange={() => toggleDashboardSection('showServiceHealth')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="recent-activity" className="cursor-pointer">
                  Recent Activity
                </Label>
                <Switch
                  id="recent-activity"
                  checked={showRecentActivity}
                  onCheckedChange={() => toggleDashboardSection('showRecentActivity')}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notifications</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Manage notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Push Notifications (Mobile) */}
              <PushNotificationToggle />

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="enable-notifications" className="cursor-pointer">
                  Enable Notifications
                </Label>
                <Switch
                  id="enable-notifications"
                  checked={enableNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({ enableNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="sound-effects" className="cursor-pointer">
                  Sound Effects
                </Label>
                <Switch
                  id="sound-effects"
                  checked={enableSoundEffects}
                  onCheckedChange={(checked) => setNotificationSettings({ enableSoundEffects: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notification Frequency</Label>
                <RadioGroup
                  value={notificationFrequency}
                  onValueChange={(value: any) => setNotificationSettings({ notificationFrequency: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="freq-all" />
                    <Label htmlFor="freq-all" className="cursor-pointer">
                      All notifications
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="important" id="freq-important" />
                    <Label htmlFor="freq-important" className="cursor-pointer">
                      Important only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="freq-none" />
                    <Label htmlFor="freq-none" className="cursor-pointer">
                      None
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Display Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Display</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">Adjust visual preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="animations" className="cursor-pointer">
                  Animations
                </Label>
                <Switch
                  id="animations"
                  checked={showAnimations}
                  onCheckedChange={(checked) => setDisplayPreferences({ showAnimations: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="reduce-motion" className="cursor-pointer">
                  Reduce Motion
                </Label>
                <Switch
                  id="reduce-motion"
                  checked={reduceMotion}
                  onCheckedChange={(checked) => setDisplayPreferences({ reduceMotion: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
