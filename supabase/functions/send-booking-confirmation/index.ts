 
/**
 * Send Booking Confirmation Email/SMS
 *
 * Handles automated booking confirmations with business hours validation
 * and personalized messaging.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Email configuration
const SMTP_HOST = Deno.env.get("SMTP_HOST");
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME");
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@tradeline247ai.com";

// Twilio configuration for SMS
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

interface SendConfirmationRequest {
  bookingId: string;
  confirmationType: 'initial' | 'reminder' | 'followup';
  channel: 'email' | 'sms' | 'both';
  customMessage?: string;
  scheduledFor?: string; // ISO timestamp
}

interface BookingDetails {
  id: string;
  booking_reference: string;
  caller_name: string;
  caller_email: string;
  caller_phone: string;
  service_type: string;
  service_description: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  duration_minutes: number;
  status: string;
  organization_id: string;
}

interface OrganizationDetails {
  name: string;
  contact_email: string;
  phone_number: string;
  address: string | null;
}

// Business hours validation
function isWithinBusinessHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  // Convert to minutes since midnight
  const currentMinutes = hour * 60 + minute;

  // Business hours: 8:30 AM (510 minutes) to 11:30 PM (1380 minutes)
  const businessStart = 8.5 * 60; // 8:30 AM
  const businessEnd = 23.5 * 60; // 11:30 PM

  return currentMinutes >= businessStart && currentMinutes <= businessEnd;
}

// Generate personalized email content
function generateEmailContent(
  booking: BookingDetails,
  organization: OrganizationDetails,
  confirmationType: string
): { subject: string; html: string; text: string } {

  const bookingRef = booking.booking_reference;
  const customerName = booking.caller_name.split(' ')[0]; // First name only

  let subject: string;
  let greeting: string;
  let body: string;

  switch (confirmationType) {
    case 'initial':
      subject = `Booking Confirmed: ${bookingRef} - ${organization.name}`;
      greeting = `Dear ${customerName},`;
      body = `
        <p>Thank you for booking with ${organization.name}! Your appointment has been confirmed.</p>

        <h3>Booking Details:</h3>
        <ul>
          <li><strong>Reference:</strong> ${bookingRef}</li>
          <li><strong>Service:</strong> ${booking.service_type}</li>
          ${booking.service_description ? `<li><strong>Description:</strong> ${booking.service_description}</li>` : ''}
          ${booking.preferred_date ? `<li><strong>Date:</strong> ${new Date(booking.preferred_date).toLocaleDateString()}</li>` : ''}
          ${booking.preferred_time ? `<li><strong>Time:</strong> ${booking.preferred_time}</li>` : ''}
          <li><strong>Duration:</strong> ${booking.duration_minutes} minutes</li>
        </ul>

        <p><strong>Payment:</strong> Your card has been authorized but will not be charged until your appointment.</p>

        <p>If you need to make any changes or have questions, please contact us at ${organization.contact_email} or ${organization.phone_number}.</p>
      `;
      break;

    case 'reminder':
      subject = `Appointment Reminder: ${bookingRef} - Tomorrow`;
      greeting = `Hi ${customerName},`;
      body = `
        <p>This is a friendly reminder about your upcoming appointment with ${organization.name}.</p>

        <h3>Your Appointment:</h3>
        <ul>
          <li><strong>When:</strong> ${booking.preferred_date ? new Date(booking.preferred_date).toLocaleDateString() : 'To be confirmed'} at ${booking.preferred_time || 'TBD'}</li>
          <li><strong>Service:</strong> ${booking.service_type}</li>
          <li><strong>Duration:</strong> ${booking.duration_minutes} minutes</li>
        </ul>

        <p>We look forward to seeing you! If you need to reschedule, please call us at ${organization.phone_number}.</p>
      `;
      break;

    default:
      subject = `Update: ${bookingRef} - ${organization.name}`;
      greeting = `Hello ${customerName},`;
      body = `<p>This is an update regarding your booking (${bookingRef}) with ${organization.name}.</p>`;
  }

  const signature = `
    <p>Best regards,<br>
    The ${organization.name} Team<br>
    ${organization.contact_email}<br>
    ${organization.phone_number}</p>
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF6B35, #CC4A1F); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .booking-ref { background: #e3f2fd; padding: 10px; border-radius: 4px; font-family: monospace; }
        ul { background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #FF6B35; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${organization.name}</h1>
          <p>Booking Confirmation</p>
        </div>
        <div class="content">
          <p class="booking-ref"><strong>Booking Reference:</strong> ${bookingRef}</p>
          ${greeting}
          ${body}
          ${signature}
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${organization.name} - Booking Confirmation

${greeting}

${body.replace(/<[^>]*>/g, '')}

Best regards,
The ${organization.name} Team
${organization.contact_email}
${organization.phone_number}

Booking Reference: ${bookingRef}
  `;

  return { subject, html, text };
}

// Send email function
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<boolean> {
  try {
    if (!SMTP_HOST || !SMTP_USERNAME || !SMTP_PASSWORD) {
      console.error("SMTP configuration missing");
      return false;
    }

    const client = new SmtpClient();

    await client.connect({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USERNAME,
      password: SMTP_PASSWORD,
    });

    await client.send({
      from: FROM_EMAIL,
      to,
      subject,
      content: html,
      html: html,
    });

    await client.close();
    return true;
  } catch (error) {
    console.error("Email sending error:", error);
    return false;
  }
}

// Send SMS function
async function sendSMS(to: string, message: string): Promise<boolean> {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      console.error("Twilio configuration missing");
      return false;
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: to,
          Body: message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio SMS error:", result);
      return false;
    }

    return true;
  } catch (error) {
    console.error("SMS sending error:", error);
    return false;
  }
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
    // Business hours validation
    if (!isWithinBusinessHours()) {
      return new Response(
        JSON.stringify({
          error: "Outside business hours",
          message: "Confirmations are only sent between 8:30 AM and 11:30 PM"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const requestData: SendConfirmationRequest = await req.json();

    // Validate required fields
    if (!requestData.bookingId || !requestData.confirmationType || !requestData.channel) {
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

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', requestData.bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Get organization details (placeholder - need to implement organizations table)
    const organization: OrganizationDetails = {
      name: "TradeLine 24/7",
      contact_email: "support@tradeline247ai.com",
      phone_number: "+1-555-0123",
      address: null,
    };

    // Generate content
    const { subject, html, text } = generateEmailContent(booking, organization, requestData.confirmationType);

    let emailSent = false;
    let smsSent = false;

    // Send email if requested
    if (requestData.channel === 'email' || requestData.channel === 'both') {
      if (booking.caller_email) {
        emailSent = await sendEmail(booking.caller_email, subject, html, text);
      }
    }

    // Send SMS if requested
    if (requestData.channel === 'sms' || requestData.channel === 'both') {
      const smsMessage = `Hi ${booking.caller_name.split(' ')[0]}! Your booking (${booking.booking_reference}) with ${organization.name} is confirmed. ${booking.preferred_date ? `Scheduled for ${new Date(booking.preferred_date).toLocaleDateString()}` : 'We\'ll contact you to schedule.'} Reply to this message or call ${organization.phone_number} with questions.`;

      smsSent = await sendSMS(booking.caller_phone, smsMessage);
    }

    // Record the confirmation attempt
    const { error: confirmationError } = await supabase
      .from('booking_confirmations')
      .insert({
        booking_id: requestData.bookingId,
        confirmation_type: requestData.confirmationType,
        channel: requestData.channel,
        email_sent: emailSent,
        email_sent_at: emailSent ? new Date().toISOString() : null,
        email_delivery_status: emailSent ? 'sent' : 'failed',
        sms_sent: smsSent,
        sms_sent_at: smsSent ? new Date().toISOString() : null,
        sms_delivery_status: smsSent ? 'sent' : 'failed',
        subject_line: subject,
        message_content: requestData.channel === 'email' ? html : smsMessage,
        scheduled_for: requestData.scheduledFor || new Date().toISOString(),
        sent_at: new Date().toISOString(),
      });

    if (confirmationError) {
      console.error("Confirmation logging error:", confirmationError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailSent,
        smsSent,
        bookingReference: booking.booking_reference,
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
    console.error("Send confirmation error:", error);

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
