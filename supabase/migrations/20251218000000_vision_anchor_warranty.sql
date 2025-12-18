-- Vision Anchor + Warranty Gatekeeper
-- Idempotent migration for MMS visual analysis

-- Create private storage bucket for inbound MMS media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inbound-mms-media',
  'inbound-mms-media',
  false, -- PRIVATE
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Visual analysis logs table
CREATE TABLE IF NOT EXISTS public.visual_analysis_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES public.calls(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  analysis_result JSONB, -- {brand, model, est_age_years, visible_risks[], confidence}
  warranty_status TEXT, -- 'valid', 'expired', 'unknown'
  warranty_warning TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  analyzed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_visual_analysis_call_id ON public.visual_analysis_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_visual_analysis_created_at ON public.visual_analysis_logs(created_at DESC);

-- Warranty rules table
CREATE TABLE IF NOT EXISTS public.warranty_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL UNIQUE,
  max_warranty_years INTEGER NOT NULL CHECK (max_warranty_years > 0),
  warning_message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_warranty_rules_brand ON public.warranty_rules(LOWER(brand_name));

-- RLS Policies: Only service role and edge functions can access
ALTER TABLE public.visual_analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_rules ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY IF NOT EXISTS "Service role full access visual_analysis_logs"
  ON public.visual_analysis_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role full access warranty_rules"
  ON public.warranty_rules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Storage policies: Only service role can access inbound-mms-media bucket
CREATE POLICY IF NOT EXISTS "Service role can upload to inbound-mms-media"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'inbound-mms-media');

CREATE POLICY IF NOT EXISTS "Service role can read from inbound-mms-media"
  ON storage.objects
  FOR SELECT
  TO service_role
  USING (bucket_id = 'inbound-mms-media');

-- Seed default warranty rules
INSERT INTO public.warranty_rules (brand_name, max_warranty_years, warning_message)
VALUES
  ('Carrier', 5, '⚠️ Unit may be out of warranty (>5 years)'),
  ('Trane', 5, '⚠️ Unit may be out of warranty (>5 years)'),
  ('Lennox', 5, '⚠️ Unit may be out of warranty (>5 years)'),
  ('York', 5, '⚠️ Unit may be out of warranty (>5 years)'),
  ('Rheem', 5, '⚠️ Unit may be out of warranty (>5 years)'),
  ('Goodman', 5, '⚠️ Unit may be out of warranty (>5 years)'),
  ('American Standard', 5, '⚠️ Unit may be out of warranty (>5 years)'),
  ('Bryant', 5, '⚠️ Unit may be out of warranty (>5 years)')
ON CONFLICT (brand_name) DO NOTHING;

-- Grant execute permissions on storage functions to service role
GRANT EXECUTE ON FUNCTION storage.foldername(text) TO service_role;
GRANT EXECUTE ON FUNCTION storage.filename(text) TO service_role;
GRANT EXECUTE ON FUNCTION storage.extension(text) TO service_role;

COMMENT ON TABLE public.visual_analysis_logs IS 'Logs of AI visual analysis from MMS images';
COMMENT ON TABLE public.warranty_rules IS 'Warranty period rules by brand for automated risk assessment';
COMMENT ON COLUMN public.visual_analysis_logs.analysis_result IS 'JSON: {brand, model, est_age_years, visible_risks[], confidence}';
