-- Compliance Events + Suppressions Tables
-- Idempotent migration for fail-closed compliance middleware
-- DO NOT REMOVE: Part of TL247 enforcement-grade receptionist safety

-- ============================================================================
-- COMPLIANCE EVENTS TABLE
-- Audit log for all compliance-related decisions and blocks
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.compliance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT,  -- References call_logs.call_sid, nullable for system events
  event_type TEXT NOT NULL,  -- recording_blocked, sms_blocked, followup_blocked, consent_denied, etc.
  reason TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL  -- 'compliance_middleware', 'voice_stream', 'manual', etc.
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_compliance_events_call_id ON public.compliance_events(call_id);
CREATE INDEX IF NOT EXISTS idx_compliance_events_type ON public.compliance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_events_created_at ON public.compliance_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.compliance_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for edge functions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'compliance_events' AND policyname = 'Service role full access compliance_events'
  ) THEN
    CREATE POLICY "Service role full access compliance_events"
      ON public.compliance_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- SUPPRESSIONS TABLE (DNC List)
-- Opt-out tracking for voice and SMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.suppressions (
  identifier TEXT PRIMARY KEY,  -- Phone number in E.164 or email
  suppressed_voice BOOLEAN DEFAULT FALSE,
  suppressed_sms BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'unknown',  -- 'voice_opt_out', 'sms_opt_out', 'manual', 'complaint'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for type-specific lookups
CREATE INDEX IF NOT EXISTS idx_suppressions_voice ON public.suppressions(identifier) WHERE suppressed_voice = TRUE;
CREATE INDEX IF NOT EXISTS idx_suppressions_sms ON public.suppressions(identifier) WHERE suppressed_sms = TRUE;

-- Enable RLS
ALTER TABLE public.suppressions ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'suppressions' AND policyname = 'Service role full access suppressions'
  ) THEN
    CREATE POLICY "Service role full access suppressions"
      ON public.suppressions
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- CONSENTS TABLE
-- Explicit consent tracking per contact/purpose
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,  -- Phone number or email
  purpose TEXT NOT NULL,  -- 'recording', 'sms_marketing', 'email_marketing', 'data_processing'
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  source TEXT,  -- 'voice_call', 'web_form', 'sms_reply'
  call_id TEXT,  -- Reference to call where consent was captured
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identifier, purpose)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consents_identifier ON public.consents(identifier);
CREATE INDEX IF NOT EXISTS idx_consents_purpose ON public.consents(purpose);
CREATE INDEX IF NOT EXISTS idx_consents_granted ON public.consents(granted);

-- Enable RLS
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'consents' AND policyname = 'Service role full access consents'
  ) THEN
    CREATE POLICY "Service role full access consents"
      ON public.consents
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- ADD CONSENT FIELDS TO CALL_LOGS IF NOT EXISTS
-- ============================================================================

ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS consent_recording BOOLEAN,
  ADD COLUMN IF NOT EXISTS consent_sms_opt_in BOOLEAN,
  ADD COLUMN IF NOT EXISTS call_category TEXT CHECK (call_category IN ('customer_service', 'lead_capture', 'prospect_call')),
  ADD COLUMN IF NOT EXISTS recording_mode TEXT DEFAULT 'full' CHECK (recording_mode IN ('full', 'no_record')),
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sentiment_avg NUMERIC(4,3) CHECK (sentiment_avg >= -1 AND sentiment_avg <= 1);

-- Index for NO-RECORD calls that need review
CREATE INDEX IF NOT EXISTS idx_call_logs_needs_review ON public.call_logs(needs_review) WHERE needs_review = TRUE;
CREATE INDEX IF NOT EXISTS idx_call_logs_recording_mode ON public.call_logs(recording_mode);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.compliance_events IS 'Audit log for compliance decisions: recording blocks, SMS blocks, consent events';
COMMENT ON TABLE public.suppressions IS 'DNC/Opt-out list for voice and SMS communications';
COMMENT ON TABLE public.consents IS 'Explicit consent records per identifier and purpose';
COMMENT ON COLUMN public.call_logs.recording_mode IS 'full = with transcript, no_record = metadata only';
COMMENT ON COLUMN public.call_logs.consent_recording IS 'Explicit recording consent from caller';
COMMENT ON COLUMN public.call_logs.consent_sms_opt_in IS 'SMS marketing opt-in consent';
