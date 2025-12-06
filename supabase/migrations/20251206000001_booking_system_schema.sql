-- TradeLine 24/7 Booking System Schema
-- Implements comprehensive booking flow with credit card commitment,
-- confirmation automation, and calendar integration

-- ==========================================
-- BOOKINGS TABLE - Core booking records
-- ==========================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),

  -- Caller Information
  caller_name TEXT NOT NULL,
  caller_email TEXT,
  caller_phone TEXT NOT NULL,

  -- Booking Details
  service_type TEXT NOT NULL, -- e.g., 'consultation', 'appointment', 'meeting'
  service_description TEXT,
  preferred_date DATE,
  preferred_time TIME,
  duration_minutes INTEGER DEFAULT 60,

  -- Booking Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  booking_reference TEXT UNIQUE NOT NULL,

  -- Payment Information
  payment_required BOOLEAN DEFAULT true,
  payment_token_id TEXT, -- Stripe payment method ID
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),

  -- AI Context
  call_sid TEXT REFERENCES public.call_logs(call_sid),
  transcript_summary TEXT,
  emotional_context JSONB DEFAULT '{}'::jsonb, -- Store emotional recognition data

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ==========================================
-- APPOINTMENTS TABLE - Scheduled appointments
-- ==========================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),

  -- Scheduling Details
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  timezone TEXT NOT NULL DEFAULT 'UTC',

  -- Calendar Integration
  calendar_event_id TEXT, -- Google/Outlook calendar event ID
  calendar_provider TEXT CHECK (calendar_provider IN ('google', 'outlook', 'ical')),
  calendar_synced BOOLEAN DEFAULT false,
  calendar_sync_error TEXT,

  -- Location & Virtual Details
  location_type TEXT NOT NULL DEFAULT 'virtual' CHECK (location_type IN ('virtual', 'in_person', 'phone')),
  location_address TEXT,
  virtual_meeting_url TEXT,
  virtual_meeting_id TEXT,
  virtual_meeting_password TEXT,

  -- Staff Assignment
  assigned_staff_id UUID, -- Future: reference to staff table
  assigned_staff_name TEXT,

  -- Reminder Settings
  reminder_sent BOOLEAN DEFAULT false,
  reminder_scheduled_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no_show')),

  -- Notes
  internal_notes TEXT,
  customer_notes TEXT,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- PAYMENT TOKENS - Secure credit card storage
-- ==========================================
CREATE TABLE IF NOT EXISTS public.payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),

  -- Stripe Integration
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,

  -- Card Details (masked for security)
  card_last4 TEXT NOT NULL,
  card_brand TEXT NOT NULL,
  card_exp_month INTEGER NOT NULL,
  card_exp_year INTEGER NOT NULL,

  -- Token Metadata
  token_type TEXT NOT NULL DEFAULT 'booking_commitment' CHECK (token_type IN ('booking_commitment', 'subscription')),
  is_active BOOLEAN DEFAULT true,

  -- Associated Records
  booking_id UUID REFERENCES public.bookings(id),

  -- Security
  encrypted_data JSONB, -- For additional secure storage if needed

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- BOOKING CONFIRMATIONS - Email/SMS tracking
-- ==========================================
CREATE TABLE IF NOT EXISTS public.booking_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  -- Confirmation Details
  confirmation_type TEXT NOT NULL CHECK (confirmation_type IN ('initial', 'reminder', 'followup')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'both')),

  -- Email Details
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  email_delivery_status TEXT CHECK (email_delivery_status IN ('sent', 'delivered', 'failed', 'bounced')),

  -- SMS Details
  sms_sent BOOLEAN DEFAULT false,
  sms_sent_at TIMESTAMPTZ,
  sms_delivery_status TEXT CHECK (sms_delivery_status IN ('sent', 'delivered', 'failed')),

  -- Content
  subject_line TEXT,
  message_content TEXT,

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- CALENDAR INTEGRATIONS - External calendar sync
-- ==========================================
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Provider Details
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'ical')),
  provider_email TEXT NOT NULL,

  -- OAuth Tokens (encrypted)
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMPTZ,

  -- Calendar Settings
  calendar_id TEXT NOT NULL, -- Provider's calendar ID
  calendar_name TEXT,
  default_timezone TEXT DEFAULT 'UTC',

  -- Sync Settings
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_buffer_minutes INTEGER DEFAULT 15, -- Buffer before/after appointments

  -- Status
  is_connected BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- AI PERSONALIZATION PROFILES - From onboarding questionnaire
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ai_personality_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),

  -- Profile Details
  profile_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- Business Context
  business_type TEXT,
  industry TEXT,
  company_size TEXT,
  target_audience TEXT,

  -- Personality Settings
  tone_style TEXT DEFAULT 'professional' CHECK (tone_style IN ('professional', 'friendly', 'formal', 'casual', 'empathetic')),
  communication_style TEXT DEFAULT 'conversational' CHECK (communication_style IN ('direct', 'conversational', 'detailed')),
  empathy_level TEXT DEFAULT 'moderate' CHECK (empathy_level IN ('low', 'moderate', 'high')),

  -- Behavioral Rules
  interruption_allowed BOOLEAN DEFAULT false,
  patience_level TEXT DEFAULT 'moderate' CHECK (patience_level IN ('low', 'moderate', 'high')),
  follow_up_style TEXT DEFAULT 'gentle' CHECK (follow_up_style IN ('aggressive', 'gentle', 'minimal')),

  -- Custom Rules
  custom_instructions JSONB DEFAULT '{}'::jsonb,

  -- Generated Prompt
  system_prompt TEXT NOT NULL,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- ESCALATION LOGS - Admin intervention tracking
-- ==========================================
CREATE TABLE IF NOT EXISTS public.escalation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),

  -- Escalation Context
  call_sid TEXT REFERENCES public.call_logs(call_sid),
  booking_id UUID REFERENCES public.bookings(id),

  -- Escalation Details
  escalation_type TEXT NOT NULL CHECK (escalation_type IN ('emergency', 'complex_business', 'technical_issue', 'policy_violation')),
  severity_level TEXT NOT NULL DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),

  -- Content
  trigger_reason TEXT NOT NULL,
  transcript_snippet TEXT,
  ai_analysis TEXT,

  -- Resolution
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'escalated')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Bookings indexes
CREATE INDEX idx_bookings_org_id ON public.bookings(organization_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_call_sid ON public.bookings(call_sid);
CREATE INDEX idx_bookings_reference ON public.bookings(booking_reference);
CREATE INDEX idx_bookings_created_at ON public.bookings(created_at DESC);

-- Appointments indexes
CREATE INDEX idx_appointments_booking_id ON public.appointments(booking_id);
CREATE INDEX idx_appointments_org_id ON public.appointments(organization_id);
CREATE INDEX idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_calendar_event_id ON public.appointments(calendar_event_id);

-- Payment tokens indexes
CREATE INDEX idx_payment_tokens_org_id ON public.payment_tokens(organization_id);
CREATE INDEX idx_payment_tokens_stripe_method_id ON public.payment_tokens(stripe_payment_method_id);
CREATE INDEX idx_payment_tokens_booking_id ON public.payment_tokens(booking_id);

-- Booking confirmations indexes
CREATE INDEX idx_booking_confirmations_booking_id ON public.booking_confirmations(booking_id);
CREATE INDEX idx_booking_confirmations_type ON public.booking_confirmations(confirmation_type);
CREATE INDEX idx_booking_confirmations_scheduled_for ON public.booking_confirmations(scheduled_for);

-- Calendar integrations indexes
CREATE INDEX idx_calendar_integrations_org_id ON public.calendar_integrations(organization_id);
CREATE INDEX idx_calendar_integrations_user_id ON public.calendar_integrations(user_id);
CREATE INDEX idx_calendar_integrations_provider ON public.calendar_integrations(provider);

-- AI profiles indexes
CREATE INDEX idx_ai_profiles_org_id ON public.ai_personality_profiles(organization_id);
CREATE INDEX idx_ai_profiles_active ON public.ai_personality_profiles(is_active);

-- Escalation logs indexes
CREATE INDEX idx_escalation_logs_org_id ON public.escalation_logs(organization_id);
CREATE INDEX idx_escalation_logs_call_sid ON public.escalation_logs(call_sid);
CREATE INDEX idx_escalation_logs_status ON public.escalation_logs(status);
CREATE INDEX idx_escalation_logs_type ON public.escalation_logs(escalation_type);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_personality_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_logs ENABLE ROW LEVEL SECURITY;

-- Bookings RLS Policies
CREATE POLICY "Org members can view bookings"
  ON public.bookings FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Org admins can manage bookings"
  ON public.bookings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_org_member(organization_id));

CREATE POLICY "Service role full access to bookings"
  ON public.bookings FOR ALL
  USING (auth.role() = 'service_role');

-- Appointments RLS Policies
CREATE POLICY "Org members can view appointments"
  ON public.appointments FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Org admins can manage appointments"
  ON public.appointments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_org_member(organization_id));

CREATE POLICY "Service role full access to appointments"
  ON public.appointments FOR ALL
  USING (auth.role() = 'service_role');

-- Payment tokens RLS Policies (sensitive data)
CREATE POLICY "Service role only for payment tokens"
  ON public.payment_tokens FOR ALL
  USING (auth.role() = 'service_role');

-- Booking confirmations RLS Policies
CREATE POLICY "Org members can view confirmations"
  ON public.booking_confirmations FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
      WHERE organization_id IN (
        SELECT org_id FROM public.organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role full access to confirmations"
  ON public.booking_confirmations FOR ALL
  USING (auth.role() = 'service_role');

-- Calendar integrations RLS Policies
CREATE POLICY "Users can manage their calendar integrations"
  ON public.calendar_integrations FOR ALL
  USING (user_id = auth.uid() AND is_org_member(organization_id));

CREATE POLICY "Service role full access to calendar integrations"
  ON public.calendar_integrations FOR ALL
  USING (auth.role() = 'service_role');

-- AI personality profiles RLS Policies
CREATE POLICY "Org members can view AI profiles"
  ON public.ai_personality_profiles FOR SELECT
  USING (is_org_member(organization_id));

CREATE POLICY "Org admins can manage AI profiles"
  ON public.ai_personality_profiles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_org_member(organization_id));

CREATE POLICY "Service role full access to AI profiles"
  ON public.ai_personality_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Escalation logs RLS Policies
CREATE POLICY "Org admins can view escalation logs"
  ON public.escalation_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) AND is_org_member(organization_id));

CREATE POLICY "Service role full access to escalation logs"
  ON public.escalation_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to generate booking reference numbers
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  ref TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    -- Generate format: BK-YYYYMMDD-XXXX (e.g., BK-20231206-A1B2)
    ref := 'BK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE booking_reference = ref) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN ref;
END;
$$;

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_tokens_updated_at
  BEFORE UPDATE ON public.payment_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_confirmations_updated_at
  BEFORE UPDATE ON public.booking_confirmations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_integrations_updated_at
  BEFORE UPDATE ON public.calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION update_calendar_integrations_updated_at();

CREATE TRIGGER update_ai_profiles_updated_at
  BEFORE UPDATE ON public.ai_personality_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escalation_logs_updated_at
  BEFORE UPDATE ON public.escalation_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create booking with default reference
CREATE OR REPLACE FUNCTION create_booking_with_reference(
  p_organization_id UUID,
  p_caller_name TEXT,
  p_caller_email TEXT,
  p_caller_phone TEXT,
  p_service_type TEXT,
  p_service_description TEXT DEFAULT NULL,
  p_preferred_date DATE DEFAULT NULL,
  p_preferred_time TIME DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT 60,
  p_payment_required BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_id UUID;
BEGIN
  INSERT INTO public.bookings (
    organization_id,
    caller_name,
    caller_email,
    caller_phone,
    service_type,
    service_description,
    preferred_date,
    preferred_time,
    duration_minutes,
    booking_reference,
    payment_required
  ) VALUES (
    p_organization_id,
    p_caller_name,
    p_caller_email,
    p_caller_phone,
    p_service_type,
    p_service_description,
    p_preferred_date,
    p_preferred_time,
    p_duration_minutes,
    generate_booking_reference(),
    p_payment_required
  )
  RETURNING id INTO booking_id;

  RETURN booking_id;
END;
$$;

-- Function to schedule reminder confirmations
CREATE OR REPLACE FUNCTION schedule_booking_reminder(
  p_booking_id UUID,
  p_reminder_hours_before INTEGER DEFAULT 6
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  appointment_record RECORD;
  reminder_time TIMESTAMPTZ;
BEGIN
  -- Get appointment details
  SELECT * INTO appointment_record
  FROM public.appointments
  WHERE booking_id = p_booking_id AND status = 'scheduled'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No scheduled appointment found for booking %', p_booking_id;
  END IF;

  -- Calculate reminder time
  reminder_time := (appointment_record.scheduled_date || ' ' || appointment_record.scheduled_time)::TIMESTAMPTZ - (p_reminder_hours_before || ' hours')::INTERVAL;

  -- Only schedule if reminder time is in the future
  IF reminder_time > NOW() THEN
    -- Update appointment with reminder info
    UPDATE public.appointments
    SET reminder_scheduled_at = reminder_time,
        reminder_sent = false
    WHERE id = appointment_record.id;

    -- Insert confirmation record
    INSERT INTO public.booking_confirmations (
      booking_id,
      confirmation_type,
      channel,
      scheduled_for
    ) VALUES (
      p_booking_id,
      'reminder',
      'both', -- email and SMS
      reminder_time
    );
  END IF;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_booking_reference() TO authenticated;
GRANT EXECUTE ON FUNCTION create_booking_with_reference(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TIME, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_booking_reminder(UUID, INTEGER) TO authenticated;