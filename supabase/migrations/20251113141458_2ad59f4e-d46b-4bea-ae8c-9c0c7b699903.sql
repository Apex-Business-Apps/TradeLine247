-- Transcription analytics tables for call quality monitoring
-- Phase 4: Analytics infrastructure

-- Store call transcriptions
CREATE TABLE IF NOT EXISTS public.call_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL UNIQUE,
  tenant_id UUID REFERENCES public.organizations(id),
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  transcript_text TEXT,
  transcript_confidence NUMERIC(3,2),
  duration_seconds INTEGER,
  call_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Store analytics metrics
CREATE TABLE IF NOT EXISTS public.call_analytics_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL REFERENCES public.call_transcriptions(call_sid),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metric_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_tenant 
  ON public.call_transcriptions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_call_transcriptions_created 
  ON public.call_transcriptions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_analytics_call_sid 
  ON public.call_analytics_metrics(call_sid);

CREATE INDEX IF NOT EXISTS idx_call_analytics_metric_name 
  ON public.call_analytics_metrics(metric_name);

-- Enable RLS
ALTER TABLE public.call_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_analytics_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view transcriptions in their org"
  ON public.call_transcriptions
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT org_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to transcriptions"
  ON public.call_transcriptions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view metrics for their org calls"
  ON public.call_analytics_metrics
  FOR SELECT
  USING (
    call_sid IN (
      SELECT call_sid FROM public.call_transcriptions
      WHERE tenant_id IN (
        SELECT org_id FROM public.organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Service role full access to metrics"
  ON public.call_analytics_metrics
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Function to get analytics summary
CREATE OR REPLACE FUNCTION public.get_call_analytics_summary(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  total_calls BIGINT,
  avg_duration_seconds NUMERIC,
  avg_confidence NUMERIC,
  total_minutes NUMERIC,
  inbound_calls BIGINT,
  outbound_calls BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_calls,
    ROUND(AVG(duration_seconds)::NUMERIC, 2) as avg_duration_seconds,
    ROUND(AVG(transcript_confidence)::NUMERIC, 2) as avg_confidence,
    ROUND(SUM(duration_seconds) / 60.0, 2) as total_minutes,
    COUNT(*) FILTER (WHERE direction = 'inbound')::BIGINT as inbound_calls,
    COUNT(*) FILTER (WHERE direction = 'outbound')::BIGINT as outbound_calls
  FROM public.call_transcriptions
  WHERE tenant_id = p_tenant_id
    AND created_at > NOW() - (p_days || ' days')::INTERVAL;
END;
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_call_transcriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_call_transcriptions_updated_at
  BEFORE UPDATE ON public.call_transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_call_transcriptions_updated_at();