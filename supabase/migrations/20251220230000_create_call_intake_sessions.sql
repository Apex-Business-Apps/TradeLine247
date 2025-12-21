-- Migration: Create call_intake_sessions table for PII capture state machine
-- Purpose: Track consent and PII collection across webhook hops for demo hotline
-- PIPEDA Compliance: Stores consent timestamp + captured data with retention metadata

CREATE TABLE IF NOT EXISTS public.call_intake_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL UNIQUE,
  to_e164 TEXT NOT NULL,
  from_e164 TEXT NOT NULL,
  
  -- PIPEDA: Consent tracking
  consent BOOLEAN DEFAULT NULL,
  consent_at TIMESTAMPTZ,
  
  -- PII Capture fields
  name TEXT,
  name_confirmed BOOLEAN DEFAULT FALSE,
  phone_e164 TEXT,
  phone_confirmed BOOLEAN DEFAULT FALSE,
  email TEXT,
  email_confirmed BOOLEAN DEFAULT FALSE,
  
  -- State machine
  capture_step TEXT DEFAULT 'consent', -- consent | name | phone | email | complete
  attempts JSONB DEFAULT '{}'::JSONB, -- track retry counts per field
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- PIPEDA: Retention - flag for deletion after transcript sent + 30 days
  retention_delete_after TIMESTAMPTZ
);

-- Index for fast CallSid lookups
CREATE INDEX idx_call_intake_sessions_call_sid ON public.call_intake_sessions(call_sid);
CREATE INDEX idx_call_intake_sessions_to_e164 ON public.call_intake_sessions(to_e164);

-- RLS Policies (admin-only access)
ALTER TABLE public.call_intake_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage call intake sessions"
  ON public.call_intake_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_call_intake_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_call_intake_sessions_updated_at
  BEFORE UPDATE ON public.call_intake_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_call_intake_sessions_updated_at();

-- Grant permissions
GRANT ALL ON public.call_intake_sessions TO service_role;
GRANT SELECT ON public.call_intake_sessions TO authenticated;

COMMENT ON TABLE public.call_intake_sessions IS 'Tracks PII consent and capture for demo hotline (+15877428885) - PIPEDA compliant';
COMMENT ON COLUMN public.call_intake_sessions.consent IS 'NULL=pending, TRUE=consented, FALSE=declined';
COMMENT ON COLUMN public.call_intake_sessions.retention_delete_after IS 'Auto-delete date per PIPEDA data minimization';
