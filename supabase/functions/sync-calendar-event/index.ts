/**
 * Sync Calendar Event
 *
 * Handles OAuth authentication and calendar event synchronization
 * for Google Calendar and Outlook Calendar integrations.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// OAuth Configuration
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")!;
const OUTLOOK_CLIENT_ID = Deno.env.get("OUTLOOK_CALENDAR_CLIENT_ID")!;
const OUTLOOK_CLIENT_SECRET = Deno.env.get("OUTLOOK_CALENDAR_CLIENT_SECRET")!;

interface SyncEventRequest {
  connectionId: string;
  eventData: {
    title: string;
    start: string; // ISO timestamp
    end: string;   // ISO timestamp
    description?: string;
    location?: string;
  };
  bookingId?: string;
}

interface CalendarConnection {
  id: string;
  user_id: string;
  organization_id: string;
  provider: 'google' | 'outlook';
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string;
  calendar_id: string;
}

// Refresh OAuth token if expired
async function refreshToken(connection: CalendarConnection): Promise<string> {
  const now = new Date();
  const expiresAt = new Date(connection.token_expires_at);

  // Return current token if still valid (with 5 minute buffer)
  if (expiresAt.getTime() > now.getTime() + 5 * 60 * 1000) {
    return connection.access_token;
  }

  let tokenUrl: string;
  let requestBody: Record<string, string>;

  if (connection.provider === 'google') {
    tokenUrl = 'https://oauth2.googleapis.com/token';
    requestBody = {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: connection.refresh_token!,
      grant_type: 'refresh_token',
    };
  } else {
    tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
    requestBody = {
      client_id: OUTLOOK_CLIENT_ID,
      client_secret: OUTLOOK_CLIENT_SECRET,
      refresh_token: connection.refresh_token!,
      grant_type: 'refresh_token',
      scope: 'Calendars.ReadWrite',
    };
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json();

  // Update stored tokens
  const newExpiresAt = new Date(now.getTime() + (data.expires_in * 1000));

  await supabase
    .from('calendar_integrations')
    .update({
      access_token: data.access_token,
      token_expires_at: newExpiresAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', connection.id);

  return data.access_token;
}

// Create Google Calendar event
async function createGoogleEvent(accessToken: string, calendarId: string, eventData: SyncEventRequest['eventData']): Promise<string> {
  const event = {
    summary: eventData.title,
    description: eventData.description,
    start: {
      dateTime: eventData.start,
      timeZone: 'UTC',
    },
    end: {
      dateTime: eventData.end,
      timeZone: 'UTC',
    },
    location: eventData.location,
    reminders: {
      useDefault: true,
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Calendar API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.id;
}

// Create Outlook Calendar event
async function createOutlookEvent(accessToken: string, calendarId: string, eventData: SyncEventRequest['eventData']): Promise<string> {
  const event = {
    subject: eventData.title,
    body: {
      contentType: 'text',
      content: eventData.description || '',
    },
    start: {
      dateTime: eventData.start,
      timeZone: 'UTC',
    },
    end: {
      dateTime: eventData.end,
      timeZone: 'UTC',
    },
    location: {
      displayName: eventData.location || 'TBD',
    },
    isReminderOn: true,
    reminderMinutesBeforeStart: 15,
  };

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Outlook Calendar API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.id;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const requestData: SyncEventRequest = await req.json();

    // Validate required fields
    if (!requestData.connectionId || !requestData.eventData) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get calendar connection
    const { data: connection, error: connectionError } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('id', requestData.connectionId)
      .single();

    if (connectionError || !connection) {
      return new Response(
        JSON.stringify({ error: "Calendar connection not found" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    if (!connection.is_connected) {
      return new Response(
        JSON.stringify({ error: "Calendar connection is not active" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Refresh token if needed
    const accessToken = await refreshToken(connection);

    // Create calendar event
    let eventId: string;
    try {
      if (connection.provider === 'google') {
        eventId = await createGoogleEvent(accessToken, connection.calendar_id, requestData.eventData);
      } else {
        eventId = await createOutlookEvent(accessToken, connection.calendar_id, requestData.eventData);
      }
    } catch (apiError) {
      console.error('Calendar API error:', apiError);

      // Update connection with error
      await supabase
        .from('calendar_integrations')
        .update({
          sync_error: apiError instanceof Error ? apiError.message : 'Unknown API error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);

      throw apiError;
    }

    // Update appointment with calendar event ID
    if (requestData.bookingId) {
      await supabase
        .from('appointments')
        .update({
          calendar_event_id: eventId,
          calendar_provider: connection.provider,
          calendar_synced: true,
          calendar_sync_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('booking_id', requestData.bookingId);
    }

    // Update connection sync status
    await supabase
      .from('calendar_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        sync_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    return new Response(
      JSON.stringify({
        success: true,
        eventId,
        provider: connection.provider,
        syncedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );

  } catch (error) {
    console.error("Sync calendar event error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});