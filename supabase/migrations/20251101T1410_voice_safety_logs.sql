-- Voice Safety Logs Table
-- Tracks safety events and escalations for audit and monitoring

CREATE TABLE IF NOT EXISTS public.voice_safety_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL REFERENCES public.call_logs(call_sid) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('safety_escalation', 'content_blocked', 'sentiment_alert', 'guardrail_triggered')),
  reason TEXT NOT NULL,
  confidence NUMERIC(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  sanitized_text TEXT, -- PII-free text for logging
  sentiment_score NUMERIC(4, 3) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_voice_safety_logs_call_sid ON public.voice_safety_logs(call_sid);
CREATE INDEX IF NOT EXISTS idx_voice_safety_logs_event_type ON public.voice_safety_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_voice_safety_logs_created_at ON public.voice_safety_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.voice_safety_logs ENABLE ROW LEVEL SECURITY;

-- Org members can view safety logs for their org's calls
CREATE POLICY "Org members can view safety logs"
  ON public.voice_safety_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.call_logs cl
      WHERE cl.call_sid = voice_safety_logs.call_sid
      AND is_org_member(cl.organization_id)
    )
  );

-- Service role can insert/update safety logs
CREATE POLICY "Service role can manage safety logs"
  ON public.voice_safety_logs FOR ALL
  USING (auth.role() = 'service_role');

