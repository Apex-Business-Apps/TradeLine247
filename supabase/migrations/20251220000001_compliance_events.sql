-- Compliance Events Table for Audit Trail
-- Tracks all compliance-related events: consent, recording, SMS, suppression, quiet hours
-- This table is append-only for audit purposes

CREATE TABLE IF NOT EXISTS public.compliance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT REFERENCES public.call_logs(call_sid) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'consent_captured',
    'consent_denied',
    'recording_blocked',
    'recording_started',
    'sms_blocked',
    'sms_sent',
    'quiet_hours_adjusted',
    'suppression_applied',
    'opt_out_received',
    'vision_anchor_detected',
    'owner_notified',
    'fail_closed_triggered'
  )),
  consent_state TEXT CHECK (consent_state IN ('pending', 'granted', 'denied', 'unknown')),
  recording_mode TEXT CHECK (recording_mode IN ('full', 'no_record', 'unknown')),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_compliance_events_call_sid ON public.compliance_events(call_sid);
CREATE INDEX IF NOT EXISTS idx_compliance_events_event_type ON public.compliance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_events_created_at ON public.compliance_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.compliance_events ENABLE ROW LEVEL SECURITY;

-- Org members can view compliance events for their org's calls
CREATE POLICY "Org members can view compliance events"
  ON public.compliance_events FOR SELECT
  USING (
    call_sid IS NULL OR EXISTS (
      SELECT 1 FROM public.call_logs cl
      WHERE cl.call_sid = compliance_events.call_sid
      AND is_org_member(cl.organization_id)
    )
  );

-- Service role can insert compliance events (for webhooks and functions)
CREATE POLICY "Service role can manage compliance events"
  ON public.compliance_events FOR ALL
  USING (auth.role() = 'service_role');

-- Add call_category and consent fields to call_logs if not exists
ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS call_category TEXT CHECK (call_category IN ('customer_service', 'lead_capture', 'prospect_call')),
  ADD COLUMN IF NOT EXISTS recording_mode TEXT DEFAULT 'unknown' CHECK (recording_mode IN ('full', 'no_record', 'unknown')),
  ADD COLUMN IF NOT EXISTS sms_opt_in TEXT DEFAULT 'unknown' CHECK (sms_opt_in IN ('pending', 'opted_in', 'opted_out', 'unknown')),
  ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS earliest_followup TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS redacted_summary TEXT;

-- Create suppression_list table for DNC (Do Not Contact)
CREATE TABLE IF NOT EXISTS public.suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- E.164 phone or email
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('phone', 'email')),
  suppression_type TEXT NOT NULL CHECK (suppression_type IN ('voice', 'sms', 'all')),
  reason TEXT,
  source TEXT CHECK (source IN ('user_request', 'opt_out', 'complaint', 'manual', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = permanent
  UNIQUE(identifier, identifier_type, suppression_type)
);

-- Indexes for suppression lookups
CREATE INDEX IF NOT EXISTS idx_suppression_list_identifier ON public.suppression_list(identifier);
CREATE INDEX IF NOT EXISTS idx_suppression_list_type ON public.suppression_list(suppression_type);

-- Enable RLS
ALTER TABLE public.suppression_list ENABLE ROW LEVEL SECURITY;

-- Admins can view suppression list
CREATE POLICY "Admins can view suppression list"
  ON public.suppression_list FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can manage suppression list
CREATE POLICY "Service role can manage suppression list"
  ON public.suppression_list FOR ALL
  USING (auth.role() = 'service_role');

-- Create vision_anchor_logs table for MMS/image handling audit
CREATE TABLE IF NOT EXISTS public.vision_anchor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT REFERENCES public.call_logs(call_sid) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL, -- Private storage path (no public URLs)
  analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  warranty_risk_detected BOOLEAN DEFAULT FALSE,
  analysis_result JSONB,
  owner_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vision_anchor_logs_call_sid ON public.vision_anchor_logs(call_sid);
CREATE INDEX IF NOT EXISTS idx_vision_anchor_logs_status ON public.vision_anchor_logs(analysis_status);
CREATE INDEX IF NOT EXISTS idx_vision_anchor_logs_warranty ON public.vision_anchor_logs(warranty_risk_detected) WHERE warranty_risk_detected = TRUE;

-- Enable RLS
ALTER TABLE public.vision_anchor_logs ENABLE ROW LEVEL SECURITY;

-- Org members can view their vision anchor logs
CREATE POLICY "Org members can view vision anchor logs"
  ON public.vision_anchor_logs FOR SELECT
  USING (
    call_sid IS NULL OR EXISTS (
      SELECT 1 FROM public.call_logs cl
      WHERE cl.call_sid = vision_anchor_logs.call_sid
      AND is_org_member(cl.organization_id)
    )
  );

-- Service role can manage vision anchor logs
CREATE POLICY "Service role can manage vision anchor logs"
  ON public.vision_anchor_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Comment for documentation
COMMENT ON TABLE public.compliance_events IS 'Append-only audit trail for all compliance-related events (consent, recording, SMS, suppression). Supports DSAR and regulatory compliance.';
COMMENT ON TABLE public.suppression_list IS 'DNC (Do Not Contact) list for voice and SMS suppression.';
COMMENT ON TABLE public.vision_anchor_logs IS 'Audit log for Vision Anchor MMS/image handling. Uses private storage paths only (no public URLs).';
