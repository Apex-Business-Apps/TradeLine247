/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Sync Calendar Event
 *
 * Synchronizes booking appointments with external calendars
 * (Google Calendar, Outlook, iCal).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enterpriseMonitor } from "../_shared/enterprise-monitoring.ts";
import { withSecurity, SecurityContext, successResponse, errorResponse, validateRequest } from "../_shared/security-middleware.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

interface SyncCalendarRequest {
  appointmentId: string;
  action: 'create' | 'update' | 'delete';
}

interface CalendarEvent {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: { email: string }[];
  reminders?: { useDefault: boolean };
}

/**
 * Refresh Google OAuth token
 */
async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error('Google OAuth credentials not configured');
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('Failed to refresh Google token:', error);
    return null;
  }
}

/**
 * Create Google Calendar event
 */
async function createGoogleEvent(
  accessToken: string,
  calendarId: string,
  event: CalendarEvent
): Promise<{ id: string } | null> {
  try {
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
      console.error('Google Calendar API error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create Google Calendar event:', error);
    return null;
  }
}

/**
 * Update Google Calendar event
 */
async function updateGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  event: CalendarEvent
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Failed to update Google Calendar event:', error);
    return false;
  }
}

/**
 * Delete Google Calendar event
 */
async function deleteGoogleEvent(
  accessToken: string,
  calendarId: string,
  eventId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    return response.ok || response.status === 404; // 404 means already deleted
  } catch (error) {
    console.error('Failed to delete Google Calendar event:', error);
    return false;
  }
}

async function handleSyncCalendar(req: Request, ctx: SecurityContext): Promise<Response> {
  const body = await req.json();

  const validation = validateRequest<SyncCalendarRequest>(body, {
    appointmentId: { type: 'uuid', required: true },
    action: { type: 'enum', required: true, allowedValues: ['create', 'update', 'delete'] },
  });

  if (!validation.isValid) {
    return errorResponse(validation.errors.join(', '), 400, ctx.requestId);
  }

  const data = validation.sanitizedData as SyncCalendarRequest;

  // Get appointment with booking details
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select(`
      *,
      bookings(caller_name, caller_email, service_type, service_description)
    `)
    .eq('id', data.appointmentId)
    .single();

  if (fetchError || !appointment) {
    return errorResponse('Appointment not found', 404, ctx.requestId);
  }

  // Get calendar integration for the organization
  const { data: integration } = await supabase
    .from('calendar_integrations')
    .select('*')
    .eq('organization_id', appointment.organization_id)
    .eq('is_connected', true)
    .single();

  if (!integration) {
    return errorResponse('No calendar integration configured', 400, ctx.requestId);
  }

  // Refresh token if needed
  let accessToken = integration.access_token;
  if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
    if (integration.provider === 'google' && integration.refresh_token) {
      accessToken = await refreshGoogleToken(integration.refresh_token);
      if (accessToken) {
        // Update stored token
        await supabase
          .from('calendar_integrations')
          .update({
            access_token: accessToken,
            token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
          })
          .eq('id', integration.id);
      }
    }
  }

  if (!accessToken) {
    return errorResponse('Calendar authentication expired', 401, ctx.requestId);
  }

  // Build calendar event
  const booking = appointment.bookings;
  const startDateTime = new Date(`${appointment.scheduled_date}T${appointment.scheduled_time}`);
  const endDateTime = new Date(startDateTime.getTime() + appointment.duration_minutes * 60000);

  const calendarEvent: CalendarEvent = {
    summary: `${booking.service_type} - ${booking.caller_name}`,
    description: `
Service: ${booking.service_type}
${booking.service_description ? `Details: ${booking.service_description}` : ''}
Customer: ${booking.caller_name}
${booking.caller_email ? `Email: ${booking.caller_email}` : ''}

Booked via TradeLine 24/7 AI Receptionist
    `.trim(),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: appointment.timezone || 'UTC',
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: appointment.timezone || 'UTC',
    },
    reminders: { useDefault: true },
  };

  if (booking.caller_email) {
    calendarEvent.attendees = [{ email: booking.caller_email }];
  }

  let success = false;
  let eventId = appointment.calendar_event_id;

  // Perform action based on provider
  if (integration.provider === 'google') {
    switch (data.action) {
      case 'create': {
        const created = await createGoogleEvent(accessToken, integration.calendar_id, calendarEvent);
        if (created) {
          eventId = created.id;
          success = true;
        }
        break;
      }
      case 'update':
        if (eventId) {
          success = await updateGoogleEvent(accessToken, integration.calendar_id, eventId, calendarEvent);
        }
        break;
      case 'delete':
        if (eventId) {
          success = await deleteGoogleEvent(accessToken, integration.calendar_id, eventId);
          if (success) eventId = null;
        }
        break;
    }
  }

  // Update appointment with sync status
  await supabase
    .from('appointments')
    .update({
      calendar_event_id: eventId,
      calendar_provider: integration.provider,
      calendar_synced: success,
      calendar_sync_error: success ? null : 'Sync failed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.appointmentId);

  // Update integration last sync time
  await supabase
    .from('calendar_integrations')
    .update({
      last_sync_at: new Date().toISOString(),
      sync_error: success ? null : 'Last sync failed',
    })
    .eq('id', integration.id);

  await enterpriseMonitor.logEvent({
    event_type: success ? 'info' : 'warning',
    severity: success ? 'low' : 'medium',
    component: 'calendar-sync',
    operation: `calendar_${data.action}`,
    message: success
      ? `Calendar event ${data.action}d successfully`
      : `Calendar sync failed for action: ${data.action}`,
    metadata: {
      appointment_id: data.appointmentId,
      action: data.action,
      provider: integration.provider,
      event_id: eventId,
    },
    request_id: ctx.requestId,
    user_id: ctx.userId,
  });

  return successResponse({
    success,
    appointmentId: data.appointmentId,
    action: data.action,
    calendarEventId: eventId,
    provider: integration.provider,
  }, success ? 200 : 500, ctx.requestId);
}

serve(withSecurity(handleSyncCalendar, {
  endpoint: 'sync-calendar-event',
  requireAuth: true,
  rateLimit: 100,
}));
