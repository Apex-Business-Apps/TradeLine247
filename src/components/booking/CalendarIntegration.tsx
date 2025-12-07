/**
 * Calendar Integration Component
 *
 * Manages OAuth connections to external calendars (Google, Outlook)
 * and displays sync status for booking appointments.
 */

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Calendar,
  Check,
  X,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CalendarProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  lastSync?: string;
  syncError?: string;
  calendars?: { id: string; name: string; primary: boolean }[];
  selectedCalendar?: string;
}

interface CalendarIntegrationProps {
  organizationId: string;
  onConnect?: (provider: string) => void;
  onDisconnect?: (provider: string) => void;
  onSyncNow?: (provider: string) => void;
}

const OAUTH_ENDPOINTS: Record<string, string> = {
  google: '/api/auth/google-calendar',
  outlook: '/api/auth/outlook-calendar',
};

export function CalendarIntegration({
  organizationId,
  onConnect,
  onDisconnect,
  onSyncNow,
}: CalendarIntegrationProps) {
  const [providers, setProviders] = useState<CalendarProvider[]>([
    {
      id: 'google',
      name: 'Google Calendar',
      icon: <GoogleIcon className="h-5 w-5" />,
      connected: false,
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      icon: <OutlookIcon className="h-5 w-5" />,
      connected: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(true);

  useEffect(() => {
    fetchIntegrations();
  }, [organizationId]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch(`/api/calendar-integrations?organizationId=${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setProviders(prev => prev.map(provider => {
          const integration = data.integrations?.find((i: any) => i.provider === provider.id);
          if (integration) {
            return {
              ...provider,
              connected: integration.is_connected,
              lastSync: integration.last_sync_at,
              syncError: integration.sync_error,
              calendars: integration.calendars,
              selectedCalendar: integration.calendar_id,
            };
          }
          return provider;
        }));
        setAutoSync(data.autoSync ?? true);
      }
    } catch (error) {
      console.error('Failed to fetch calendar integrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (providerId: string) => {
    const authUrl = `${OAUTH_ENDPOINTS[providerId]}?organizationId=${organizationId}`;
    window.location.href = authUrl;
    onConnect?.(providerId);
  };

  const handleDisconnect = async (providerId: string) => {
    try {
      await fetch(`/api/calendar-integrations/${providerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      setProviders(prev => prev.map(p =>
        p.id === providerId
          ? { ...p, connected: false, lastSync: undefined, syncError: undefined }
          : p
      ));
      onDisconnect?.(providerId);
    } catch (error) {
      console.error('Failed to disconnect calendar:', error);
    }
  };

  const handleSyncNow = async (providerId: string) => {
    setSyncInProgress(providerId);
    try {
      const response = await fetch('/api/sync-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, provider: providerId }),
      });

      if (response.ok) {
        setProviders(prev => prev.map(p =>
          p.id === providerId
            ? { ...p, lastSync: new Date().toISOString(), syncError: undefined }
            : p
        ));
      } else {
        const error = await response.json();
        setProviders(prev => prev.map(p =>
          p.id === providerId
            ? { ...p, syncError: error.message }
            : p
        ));
      }
      onSyncNow?.(providerId);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncInProgress(null);
    }
  };

  const handleCalendarSelect = async (providerId: string, calendarId: string) => {
    try {
      await fetch(`/api/calendar-integrations/${providerId}/calendar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, calendarId }),
      });

      setProviders(prev => prev.map(p =>
        p.id === providerId ? { ...p, selectedCalendar: calendarId } : p
      ));
    } catch (error) {
      console.error('Failed to update calendar selection:', error);
    }
  };

  const formatLastSync = (date: string | undefined) => {
    if (!date) return 'Never synced';
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Integration
        </CardTitle>
        <CardDescription>
          Connect your calendar to automatically sync booked appointments.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-sync">Auto-sync appointments</Label>
            <p className="text-xs text-muted-foreground">
              Automatically sync new bookings to your calendar
            </p>
          </div>
          <Switch
            id="auto-sync"
            checked={autoSync}
            onCheckedChange={setAutoSync}
          />
        </div>

        <div className="space-y-4">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={cn(
                "flex items-center justify-between rounded-lg border p-4",
                provider.connected && "bg-muted/30"
              )}
            >
              <div className="flex items-center gap-3">
                {provider.icon}
                <div>
                  <p className="font-medium">{provider.name}</p>
                  {provider.connected && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatLastSync(provider.lastSync)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {provider.connected ? (
                  <>
                    <Badge variant="outline" className="gap-1">
                      <Check className="h-3 w-3 text-green-500" />
                      Connected
                    </Badge>

                    {provider.calendars && provider.calendars.length > 0 && (
                      <Select
                        value={provider.selectedCalendar}
                        onValueChange={(v) => handleCalendarSelect(provider.id, v)}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Select calendar" />
                        </SelectTrigger>
                        <SelectContent>
                          {provider.calendars.map((cal) => (
                            <SelectItem key={cal.id} value={cal.id}>
                              {cal.name} {cal.primary && '(Primary)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSyncNow(provider.id)}
                      disabled={syncInProgress === provider.id}
                    >
                      <RefreshCw className={cn(
                        "h-4 w-4",
                        syncInProgress === provider.id && "animate-spin"
                      )} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(provider.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConnect(provider.id)}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {providers.some(p => p.syncError) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Sync error: {providers.find(p => p.syncError)?.syncError}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function OutlookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.159.152-.357.228-.595.228h-8.16v-6.14l1.06.82c.124.094.266.14.424.14.16 0 .3-.046.424-.14l6.085-4.71v-.252c0-.086-.03-.16-.088-.224-.058-.064-.134-.098-.228-.098h-5.3l-2.377 1.83V2.76h8.16c.238 0 .436.076.595.228.158.152.237.346.237.576v3.823zM7.676 3.524c1.024 0 1.95.242 2.78.726.83.484 1.487 1.148 1.968 1.992.482.844.723 1.784.723 2.82 0 1.036-.24 1.98-.723 2.832-.48.852-1.138 1.52-1.968 2.004-.83.484-1.756.726-2.78.726-1.024 0-1.95-.242-2.78-.726-.83-.484-1.49-1.152-1.98-2.004-.49-.852-.734-1.796-.734-2.832 0-1.036.244-1.976.734-2.82.49-.844 1.15-1.508 1.98-1.992.83-.484 1.756-.726 2.78-.726zm.012 2.1c-.59 0-1.12.148-1.59.442-.47.294-.84.706-1.108 1.236-.268.53-.402 1.13-.402 1.8 0 .67.134 1.27.402 1.8.268.53.637.942 1.108 1.236.47.294 1 .442 1.59.442.59 0 1.12-.148 1.59-.442.47-.294.84-.706 1.108-1.236.268-.53.402-1.13.402-1.8 0-.67-.134-1.27-.402-1.8-.268-.53-.637-.942-1.108-1.236-.47-.294-1-.442-1.59-.442z"/>
    </svg>
  );
}

export default CalendarIntegration;
