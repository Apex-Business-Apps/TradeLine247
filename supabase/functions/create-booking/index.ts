 
/**
 * Create Booking with Payment Authorization - Enterprise Grade
 *
 * This function creates a booking record and handles Stripe payment method
 * authorization for commitment without immediate charging.
 *
 * Enterprise Features:
 * - Comprehensive security monitoring
 * - Rate limiting and abuse prevention
 * - Circuit breaker pattern for fault tolerance
 * - Detailed audit logging
 * - Fraud detection and risk assessment
 * - GDPR compliance and data protection
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.17.0";
import { enterpriseMonitor, withMonitoring } from "../_shared/enterprise-monitoring.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Stripe
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

interface CreateBookingRequest {
  callerName: string;
  callerEmail?: string;
  callerPhone: string;
  serviceType: string;
  serviceDescription?: string;
  preferredDate?: string; // ISO date string
  preferredTime?: string;
  durationMinutes?: number;
  paymentMethodId: string;
  callSid?: string;
}

interface BookingResponse {
  bookingId: string;
  bookingReference: string;
  clientSecret: string;
  appointmentId?: string;
}

// Core booking creation logic with enterprise features
async function createBookingCore(requestData: CreateBookingRequest, req: Request): Promise<BookingResponse> {
  const requestId = crypto.randomUUID();

  // Log security event
  await enterpriseMonitor.logSecurityEvent('data_modification', {
    operation: 'create_booking',
    request_id: requestId,
    user_data: {
      name: requestData.callerName,
      email: requestData.callerEmail,
      phone: requestData.callerPhone
    }
  });

  // Rate limiting check
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimitPassed = await supabase.rpc('check_rate_limit', {
    p_identifier: clientIP,
    p_identifier_type: 'ip',
    p_endpoint: 'create-booking',
    p_window_seconds: 300, // 5 minutes
    p_max_requests: 10 // 10 bookings per 5 minutes per IP
  });

  if (!rateLimitPassed) {
    await enterpriseMonitor.logSecurityEvent('rate_limit_exceeded', {
      endpoint: 'create-booking',
      ip: clientIP,
      request_id: requestId
    }, undefined, 'high');

    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // IP reputation check
  const ipReputationResult = await supabase.rpc('check_ip_reputation', {
    p_ip_address: clientIP
  });
  const ipReputation = (ipReputationResult.data as number) ?? 50;

  if (ipReputation < 20) {
    await enterpriseMonitor.logSecurityEvent('suspicious_activity', {
      reason: 'low_ip_reputation',
      reputation_score: ipReputation,
      ip: clientIP,
      request_id: requestId
    }, undefined, 'critical');

    throw new Error('Access denied due to security policy.');
  }

  // Input validation with enhanced security
  const sanitizedData = {
    callerName: requestData.callerName?.trim().substring(0, 100) || '',
    callerEmail: requestData.callerEmail?.trim().toLowerCase().substring(0, 254) || null,
    callerPhone: requestData.callerPhone?.trim().replace(/[^\d+\-\s()]/g, '').substring(0, 20) || '',
    serviceType: requestData.serviceType?.trim().substring(0, 50) || '',
    serviceDescription: requestData.serviceDescription?.trim().substring(0, 500) || null,
    preferredDate: requestData.preferredDate,
    preferredTime: requestData.preferredTime?.substring(0, 8),
    durationMinutes: Math.min(Math.max(requestData.durationMinutes || 60, 15), 480), // 15min to 8hours
    paymentMethodId: requestData.paymentMethodId?.trim(),
    callSid: requestData.callSid?.trim().substring(0, 50)
  };

  // Enhanced validation
  const requiredFields = ['callerName', 'callerPhone', 'serviceType', 'paymentMethodId'];
  for (const field of requiredFields) {
    if (!sanitizedData[field as keyof typeof sanitizedData]) {
      throw new Error(`Missing or invalid required field: ${field}`);
    }
  }

  // Email validation
  if (sanitizedData.callerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedData.callerEmail)) {
    throw new Error('Invalid email format');
  }

  // Phone validation (basic)
  if (!/^\+?[\d\s\-()]{10,20}$/.test(sanitizedData.callerPhone)) {
    throw new Error('Invalid phone number format');
  }

  // Get organization from request context (enhanced security)
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    throw new Error("Authorization required");
  }

  // For now, we'll use a default organization ID - in production this should come from JWT
  // This is a placeholder until proper organization resolution is implemented
  const organizationId = "00000000-0000-0000-0000-000000000000"; // Replace with actual org resolution

  // Fraud detection
  const fraudIndicators: string[] = [];
  if (ipReputation < 50) fraudIndicators.push('low_ip_reputation');
  if (sanitizedData.callerEmail?.includes('@tempmail.')) fraudIndicators.push('temporary_email');

  if (fraudIndicators.length > 0) {
    await enterpriseMonitor.logSecurityEvent('suspicious_activity', {
      indicators: fraudIndicators,
      ip: clientIP,
      request_id: requestId
    }, undefined, 'high');
  }

  // Create payment intent for authorization (not capture)
  const paymentIntent = await stripe.paymentIntents.create({
    amount: 1, // $0.01 authorization hold
    currency: "usd",
    payment_method: sanitizedData.paymentMethodId,
    capture_method: "manual", // Authorize only, don't capture
    confirm: false, // We'll confirm later in the frontend
    metadata: {
      booking_type: "commitment",
      service_type: sanitizedData.serviceType,
      request_id: requestId,
      fraud_indicators: fraudIndicators.join(',')
    },
  });

  // Store payment method securely with enhanced tracking
  const paymentMethod = await stripe.paymentMethods.retrieve(sanitizedData.paymentMethodId);

  // Create booking record with enhanced audit trail
  const { data: booking, error: bookingError } = await supabase
    .rpc('create_booking_with_reference', {
      p_organization_id: organizationId,
      p_caller_name: sanitizedData.callerName,
      p_caller_email: sanitizedData.callerEmail,
      p_caller_phone: sanitizedData.callerPhone,
      p_service_type: sanitizedData.serviceType,
      p_service_description: sanitizedData.serviceDescription,
      p_preferred_date: sanitizedData.preferredDate ? new Date(sanitizedData.preferredDate) : null,
      p_preferred_time: sanitizedData.preferredTime || null,
      p_duration_minutes: sanitizedData.durationMinutes,
      p_payment_required: true,
    });

  if (bookingError) {
    console.error("Booking creation error:", bookingError);
    await enterpriseMonitor.logEvent({
      event_type: 'error',
      severity: 'high',
      component: 'booking-service',
      operation: 'create_booking_record',
      message: `Booking creation failed: ${bookingError.message}`,
      metadata: { error: bookingError, request_id: requestId },
      request_id: requestId
    });
    throw new Error("Failed to create booking record");
  }

  // Store payment token with enhanced security
  const { error: paymentTokenError } = await supabase
    .from('payment_tokens')
    .insert({
      organization_id: organizationId,
      stripe_payment_method_id: sanitizedData.paymentMethodId,
      stripe_customer_id: paymentIntent.customer as string,
      card_last4: paymentMethod.card?.last4,
      card_brand: paymentMethod.card?.brand,
      card_exp_month: paymentMethod.card?.exp_month,
      card_exp_year: paymentMethod.card?.exp_year,
      token_type: 'booking_commitment',
      booking_id: booking,
    });

  if (paymentTokenError) {
    console.error("Payment token storage error:", paymentTokenError);
    await enterpriseMonitor.logEvent({
      event_type: 'error',
      severity: 'medium',
      component: 'booking-service',
      operation: 'store_payment_token',
      message: `Payment token storage failed: ${paymentTokenError.message}`,
      metadata: { error: paymentTokenError, request_id: requestId },
      request_id: requestId
    });
    // Don't fail the booking for this - payment token can be created later
  }

  // Update booking with call context if provided
  if (sanitizedData.callSid) {
    await supabase
      .from('bookings')
      .update({
        call_sid: sanitizedData.callSid,
        status: 'confirmed'
      })
      .eq('id', booking);
  }

  // Schedule initial confirmation email with business hours validation
  try {
    await supabase.functions.invoke('send-booking-confirmation', {
      body: {
        bookingId: booking,
        confirmationType: 'initial',
        channel: 'both',
      },
    });
  } catch (err: unknown) {
    const emailError = err instanceof Error ? err : new Error(String(err));
    console.error("Email scheduling error:", emailError);
    await enterpriseMonitor.logEvent({
      event_type: 'warning',
      severity: 'medium',
      component: 'booking-service',
      operation: 'schedule_confirmation',
      message: `Email scheduling failed: ${emailError.message}`,
      metadata: { error: emailError.message, booking_id: booking, request_id: requestId },
      request_id: requestId
    });
    // Don't fail booking for email issues
  }

  // Log successful booking creation
  await enterpriseMonitor.logEvent({
    event_type: 'info',
    severity: 'medium',
    component: 'booking-service',
    operation: 'booking_created',
    message: `Booking created successfully: ${booking}`,
    metadata: {
      booking_id: booking,
      service_type: sanitizedData.serviceType,
      payment_method: paymentMethod.card?.brand,
      request_id: requestId
    },
    request_id: requestId
  });

  const response: BookingResponse = {
    bookingId: booking,
    bookingReference: `BK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    clientSecret: paymentIntent.client_secret!,
  };

  return response;
}

// Create monitored booking function
const createBookingWithMonitoring = withMonitoring(
  'create-booking',
  'booking-service',
  createBookingCore
);

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
    // Validate request method
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Parse request body and use monitored booking creation
    const requestData: CreateBookingRequest = await req.json();
    const result = await createBookingWithMonitoring(requestData, req);

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Request-ID": crypto.randomUUID()
        },
      }
    );

  } catch (error) {
    console.error("Create booking error:", error);

    // Enhanced error response with monitoring
    const errorResponse = {
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
      request_id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    // Don't expose sensitive error details in production
    const isDevelopment = Deno.env.get("ENVIRONMENT") === "development";
    if (!isDevelopment && error instanceof Error) {
      // Log detailed error internally but don't expose to client
      await enterpriseMonitor.logEvent({
        event_type: 'error',
        severity: 'high',
        component: 'booking-service',
        operation: 'create_booking_error',
        message: error.message,
        stack_trace: error.stack,
        metadata: { error_type: error.name }
      });

      // Return sanitized error to client
      errorResponse.message = "An unexpected error occurred. Please try again.";
    }

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: error instanceof Error && error.message.includes('Rate limit') ? 429 :
               error instanceof Error && error.message.includes('Authorization') ? 401 : 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Request-ID": errorResponse.request_id
        },
      }
    );
  }
});
