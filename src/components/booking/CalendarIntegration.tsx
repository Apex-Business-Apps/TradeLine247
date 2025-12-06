import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CalendarIntegrationProps {
  bookingId?: string;
  onCalendarSynced?: (eventId: string) => void;
}

interface CalendarConnection {
  id: string;
  provider: 'google' | 'outlook';
  provider_email: string;
  calendar_name: string;
  is_connected: boolean;
  last_sync_at: string | null;
  sync_error: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
}

const CALENDAR_CONFIG = {
  google: {
    name: 'Google Calendar',
    icon: '📅',
    authUrl: 'https://accounts.google.com/oauth/authorize',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },
  outlook: {
    name: 'Outlook Calendar',
    icon: '📧',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    scope: 'Calendars.ReadWrite',
    clientId: process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID,
  },
};

export function CalendarIntegration({ bookingId, onCalendarSynced }: CalendarIntegrationProps) {
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'outlook' | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Fetch user's calendar connections
  const { data: connections, refetch: refetchConnections } = useQuery({
    queryKey: ['calendar-connections'],
    queryFn: async (): Promise<CalendarConnection[]> => {
      const { data, error } = await supabase
        .from('calendar_integrations')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Sync calendar event mutation
  const syncEventMutation = useMutation({
    mutationFn: async ({ connectionId, eventData }: {
      connectionId: string;
      eventData: {
        title: string;
        start: string;
        end: string;
        description?: string;
        location?: string;
      };
    }) => {
      const { data, error } = await supabase.functions.invoke('sync-calendar-event', {
        body: {
          connectionId,
          eventData,
          bookingId,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Appointment added to calendar!');
      onCalendarSynced?.(data.eventId);
      refetchConnections();
    },
    onError: (error) => {
      toast.error('Failed to sync calendar event');
      console.error('Calendar sync error:', error);
    },
  });

  // Handle OAuth authentication
  const handleAuth = async (provider: 'google' | 'outlook') => {
    setSelectedProvider(provider);
    setIsAuthenticating(true);

    try {
      const config = CALENDAR_CONFIG[provider];

      // Generate OAuth URL
      const authUrl = new URL(config.authUrl);
      authUrl.searchParams.set('client_id', config.clientId || '');
      authUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/callback`);
      authUrl.searchParams.set('scope', config.scope);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('state', `calendar-${provider}`);

      // Open OAuth popup
      const popup = window.open(
        authUrl.toString(),
        'calendar-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        toast.error('Popup blocked. Please allow popups for this site.');
        return;
      }

      // Listen for auth completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsAuthenticating(false);
          refetchConnections();
        }
      }, 1000);

    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Authentication failed');
      setIsAuthenticating(false);
    }
  };

  // Sync booking to calendar
  const handleSyncToCalendar = async (connection: CalendarConnection) => {
    if (!bookingId) {
      toast.error('No booking selected');
      return;
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, appointments(*)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      toast.error('Booking not found');
      return;
    }

    const appointment = booking.appointments?.[0];
    if (!appointment) {
      toast.error('No appointment scheduled for this booking');
      return;
    }

    const eventData = {
      title: `${booking.service_type} - ${booking.caller_name}`,
      start: `${appointment.scheduled_date}T${appointment.scheduled_time}`,
      end: new Date(new Date(`${appointment.scheduled_date}T${appointment.scheduled_time}`).getTime() + (appointment.duration_minutes * 60000)).toISOString(),
      description: `Booking Reference: ${booking.booking_reference}\nService: ${booking.service_type}\nDuration: ${appointment.duration_minutes} minutes\n${booking.service_description || ''}`,
      location: appointment.location_type === 'in_person' ? appointment.location_address : 'Virtual Meeting',
    };

    syncEventMutation.mutate({
      connectionId: connection.id,
      eventData,
    });
  };

  const getConnectionStatus = (connection: CalendarConnection) => {
    if (!connection.is_connected) {
      return { status: 'disconnected', color: 'destructive' as const };
    }

    if (connection.sync_error) {
      return { status: 'error', color: 'destructive' as const };
    }

    if (connection.last_sync_at) {
      return { status: 'synced', color: 'default' as const };
    }

    return { status: 'connected', color: 'secondary' as const };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your calendar to automatically sync appointments and never miss a booking.
            </p>

            {/* Available Providers */}
            <div className="grid gap-3">
              {Object.entries(CALENDAR_CONFIG).map(([provider, config]) => (
                <Card key={provider} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <h4 className="font-medium">{config.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Sync appointments automatically
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAuth(provider as 'google' | 'outlook')}
                      disabled={isAuthenticating}
                      variant="outline"
                    >
                      {isAuthenticating && selectedProvider === provider ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Calendars */}
      {connections && connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Calendars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connections.map((connection) => {
                const status = getConnectionStatus(connection);

                return (
                  <div
                    key={connection.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {connection.provider === 'google' ? '📅' : '📧'}
                      </span>
                      <div>
                        <h4 className="font-medium">{connection.calendar_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {connection.provider_email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={status.color} className="text-xs">
                            {status.status === 'synced' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {status.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                          </Badge>
                          {connection.last_sync_at && (
                            <span className="text-xs text-muted-foreground">
                              Last sync: {new Date(connection.last_sync_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {bookingId && (
                        <Button
                          size="sm"
                          onClick={() => handleSyncToCalendar(connection)}
                          disabled={syncEventMutation.isPending || !connection.is_connected}
                        >
                          {syncEventMutation.isPending ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            'Sync Booking'
                          )}
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => refetchConnections()}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {connections.some(c => c.sync_error) && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Some calendars have sync errors. Please check your permissions and try reconnecting.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <h4 className="font-medium text-foreground">How it works:</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Connect your Google or Outlook calendar</li>
              <li>Grant permission to create and modify events</li>
              <li>Bookings will automatically appear in your calendar</li>
              <li>Get reminders and never miss appointments</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}