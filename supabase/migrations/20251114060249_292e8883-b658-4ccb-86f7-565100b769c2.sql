-- Create pre-computed answers cache table
CREATE TABLE IF NOT EXISTS public.rag_precomputed_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  question_pattern TEXT NOT NULL,
  question_normalized TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  answer_html TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  source_refs JSONB DEFAULT '[]'::jsonb,
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMP WITH TIME ZONE,
  confidence_score NUMERIC(3,2) DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for fast lookups
CREATE INDEX idx_rag_precomputed_answers_org ON public.rag_precomputed_answers(organization_id) WHERE enabled = true;
CREATE INDEX idx_rag_precomputed_answers_normalized ON public.rag_precomputed_answers(question_normalized) WHERE enabled = true;
CREATE INDEX idx_rag_precomputed_answers_priority ON public.rag_precomputed_answers(priority DESC, hit_count DESC) WHERE enabled = true;
CREATE INDEX idx_rag_precomputed_answers_hit_count ON public.rag_precomputed_answers(hit_count DESC) WHERE enabled = true;

-- Create full-text search index for question matching
CREATE INDEX idx_rag_precomputed_answers_fts ON public.rag_precomputed_answers 
USING gin(to_tsvector('english', question_pattern || ' ' || question_normalized)) 
WHERE enabled = true;

-- Enable RLS
ALTER TABLE public.rag_precomputed_answers ENABLE ROW LEVEL SECURITY;

-- Service role can manage everything
CREATE POLICY "Service role can manage precomputed answers"
ON public.rag_precomputed_answers
FOR ALL
USING (auth.role() = 'service_role');

-- Org members can view their org's answers
CREATE POLICY "Org members can view precomputed answers"
ON public.rag_precomputed_answers
FOR SELECT
USING (
  organization_id IS NULL OR 
  is_org_member(organization_id)
);

-- Admins can create/update org answers
CREATE POLICY "Admins can manage org precomputed answers"
ON public.rag_precomputed_answers
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) AND 
  (organization_id IS NULL OR is_org_member(organization_id))
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND 
  (organization_id IS NULL OR is_org_member(organization_id))
);

-- Create function to normalize questions for matching
CREATE OR REPLACE FUNCTION normalize_question(question TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN lower(trim(regexp_replace(question, '[^\w\s]', '', 'g')));
END;
$$;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_rag_precomputed_answers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_rag_precomputed_answers_updated_at
BEFORE UPDATE ON public.rag_precomputed_answers
FOR EACH ROW
EXECUTE FUNCTION update_rag_precomputed_answers_updated_at();

COMMENT ON TABLE public.rag_precomputed_answers IS 'Pre-computed answers for frequently asked questions to bypass vector search';
COMMENT ON COLUMN public.rag_precomputed_answers.question_pattern IS 'Pattern or exact question text to match';
COMMENT ON COLUMN public.rag_precomputed_answers.question_normalized IS 'Normalized version for fuzzy matching';
COMMENT ON COLUMN public.rag_precomputed_answers.hit_count IS 'Number of times this answer was served';
COMMENT ON COLUMN public.rag_precomputed_answers.confidence_score IS 'Confidence score 0-1 for answer quality';
COMMENT ON COLUMN public.rag_precomputed_answers.priority IS 'Higher priority answers matched first';