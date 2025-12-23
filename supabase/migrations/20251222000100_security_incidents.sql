-- Security incidents log (fail-closed safety)
CREATE TABLE IF NOT EXISTS public.security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  call_sid TEXT,
  severity TEXT,
  details JSONB
);

ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service role full access security_incidents"
  ON public.security_incidents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

