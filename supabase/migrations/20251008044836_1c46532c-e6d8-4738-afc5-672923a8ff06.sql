-- ====================================================================
-- TELEPHONY & MESSAGING TABLES
-- ====================================================================

-- Phone numbers table
CREATE TABLE IF NOT EXISTS public.phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'twilio',
  capabilities JSONB DEFAULT '{"voice": true, "sms": true}'::jsonb,
  forwarding_number TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Call logs table
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id UUID REFERENCES public.phone_numbers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL,
  duration_seconds INTEGER,
  recording_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SMS messages table
CREATE TABLE IF NOT EXISTS public.sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id UUID REFERENCES public.phone_numbers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OAuth tokens table (secure storage)
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  token_type TEXT DEFAULT 'Bearer',
  user_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider)
);

-- Enable RLS
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for phone_numbers
CREATE POLICY "Users can view org phone numbers"
  ON public.phone_numbers FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Org admins can manage phone numbers"
  ON public.phone_numbers FOR ALL
  TO authenticated
  USING (
    organization_id = get_user_organization(auth.uid()) 
    AND has_role(auth.uid(), 'org_admin'::user_role)
  );

-- RLS Policies for call_logs
CREATE POLICY "Users can view org call logs"
  ON public.call_logs FOR SELECT
  TO authenticated
  USING (
    phone_number_id IN (
      SELECT id FROM public.phone_numbers 
      WHERE organization_id = get_user_organization(auth.uid())
    )
  );

CREATE POLICY "Service role can log calls"
  ON public.call_logs FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- RLS Policies for sms_messages
CREATE POLICY "Users can view org SMS messages"
  ON public.sms_messages FOR SELECT
  TO authenticated
  USING (
    phone_number_id IN (
      SELECT id FROM public.phone_numbers 
      WHERE organization_id = get_user_organization(auth.uid())
    )
  );

CREATE POLICY "Users can send SMS"
  ON public.sms_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    phone_number_id IN (
      SELECT id FROM public.phone_numbers 
      WHERE organization_id = get_user_organization(auth.uid())
    )
  );

-- RLS Policies for oauth_tokens
CREATE POLICY "Users can view org OAuth tokens"
  ON public.oauth_tokens FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization(auth.uid()));

CREATE POLICY "Org admins can manage OAuth tokens"
  ON public.oauth_tokens FOR ALL
  TO authenticated
  USING (
    organization_id = get_user_organization(auth.uid()) 
    AND has_role(auth.uid(), 'org_admin'::user_role)
  );

-- Indexes for performance
CREATE INDEX idx_phone_numbers_org ON public.phone_numbers(organization_id);
CREATE INDEX idx_call_logs_phone ON public.call_logs(phone_number_id);
CREATE INDEX idx_call_logs_lead ON public.call_logs(lead_id);
CREATE INDEX idx_call_logs_created ON public.call_logs(created_at DESC);
CREATE INDEX idx_sms_messages_phone ON public.sms_messages(phone_number_id);
CREATE INDEX idx_sms_messages_lead ON public.sms_messages(lead_id);
CREATE INDEX idx_sms_messages_created ON public.sms_messages(created_at DESC);
CREATE INDEX idx_oauth_tokens_org_provider ON public.oauth_tokens(organization_id, provider);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_phone_numbers_updated_at
    BEFORE UPDATE ON public.phone_numbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at
    BEFORE UPDATE ON public.oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();