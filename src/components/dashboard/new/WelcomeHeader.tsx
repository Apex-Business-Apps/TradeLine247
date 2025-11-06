/**
 * Enhanced Welcome Header with Personalization
 *
 * Features:
 * - Time-based greetings (morning/afternoon/evening)
 * - Personalized name from user preferences or profile
 * - Theme switcher integration
 * - Settings dialog access
 * - Active status indicator
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { errorReporter } from '@/lib/errorReporter';
import { Settings, Home, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/routes/paths';
import { supabase } from '@/integrations/supabase/client';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { useDashboardStore } from '@/stores/dashboardStore';
import { ThemeSwitcher } from '../ThemeSwitcher';
import { DashboardSettingsDialog } from '../DashboardSettingsDialog';
import { Badge } from '@/components/ui/badge';

export const WelcomeHeader: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const currentTime = new Date().getHours();

  const { preferredName, showWelcomeMessage, updateLastLogin } = useUserPreferencesStore();
  const {
    isSettingsDialogOpen,
    setSettingsDialogOpen,
    notificationCount,
    setShowNotifications
  } = useDashboardStore();

  useEffect(() => {
    // Update last login time
    updateLastLogin();

    async function fetchUserName() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        // If there's a JWT error, clear the corrupted session silently
        if (error?.message?.includes('malformed') || error?.message?.includes('invalid')) {
          errorReporter.report({
            type: 'error',
            message: `[WelcomeHeader] Detected malformed token, ignoring: ${error.message}`,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            environment: errorReporter['getEnvironment']()
          });
          return;
        }

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          if (profile?.full_name) {
            setUserName(profile.full_name);
          } else {
            setUserName(user.email?.split('@')[0] || 'there');
          }
        }
      } catch (err) {
        errorReporter.report({
          type: 'error',
          message: `[WelcomeHeader] Error fetching user: ${err instanceof Error ? err.message : String(err)}`,
          stack: err instanceof Error ? err.stack : undefined,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: errorReporter['getEnvironment']()
        });
        setUserName('there');
      }
    }
    fetchUserName();
  }, [updateLastLogin]);

  const getGreeting = () => {
    if (currentTime < 12) return "Good morning";
    if (currentTime < 18) return "Good afternoon";
    return "Good evening";
  };

  // Use preferred name from store if available, otherwise use fetched user name
  const displayName = preferredName || userName;

  if (!showWelcomeMessage) {
    return null;
  }

  return (
    <>
      <header className="space-y-4" data-testid="welcome-header">
        {/* Greeting and Quick Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {getGreeting()}, {displayName || 'there'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Your AI receptionist is working hard for you today
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(true)}
              className="h-9 w-9 hover:bg-accent relative"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Badge>
              )}
            </Button>

            {/* Theme Switcher */}
            <ThemeSwitcher />

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsDialogOpen(true)}
              className="h-9 w-9 hover:bg-accent"
              data-testid="settings-button"
              aria-label="Open settings"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {/* Home */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(paths.home)}
              className="h-9 w-9 hover:bg-accent"
              data-testid="home-button"
              aria-label="Go to homepage"
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-slate-600 dark:text-slate-400">AI receptionist is active</span>
        </div>
      </header>

      {/* Settings Dialog */}
      <DashboardSettingsDialog
        open={isSettingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
      />
    </>
  );
};
