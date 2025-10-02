-- Add referral tracking and free tier support

-- Create referrals table for viral growth tracking
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_email TEXT NOT NULL,
  referred_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, signed_up, converted
  referral_code TEXT NOT NULL UNIQUE,
  reward_granted BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'signed_up', 'converted'))
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals
CREATE POLICY "Users can view their own referrals"
ON public.referrals
FOR SELECT
TO authenticated
USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());

-- Users can create referrals
CREATE POLICY "Users can create referrals"
ON public.referrals
FOR INSERT
TO authenticated
WITH CHECK (referrer_id = auth.uid());

-- Add referral tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID,
ADD COLUMN IF NOT EXISTS referral_credits INTEGER DEFAULT 0;

-- Create index for faster referral lookups
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);

-- Add widget usage tracking
CREATE TABLE public.widget_installs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  dealership_id UUID NOT NULL,
  widget_code TEXT NOT NULL UNIQUE,
  domain TEXT,
  install_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_impression_at TIMESTAMP WITH TIME ZONE,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for widget tracking
ALTER TABLE public.widget_installs ENABLE ROW LEVEL SECURITY;

-- Users can view widgets for their organization
CREATE POLICY "Users can view org widgets"
ON public.widget_installs
FOR SELECT
TO authenticated
USING (
  organization_id = get_user_organization(auth.uid())
);

-- Users can create widgets for their dealerships
CREATE POLICY "Users can create widgets"
ON public.widget_installs
FOR INSERT
TO authenticated
WITH CHECK (
  dealership_id IN (
    SELECT id FROM public.dealerships
    WHERE organization_id = get_user_organization(auth.uid())
  )
);

-- Add A/B testing support
CREATE TABLE public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  variants JSONB NOT NULL, -- {variant_a: {name, config}, variant_b: {name, config}}
  traffic_split JSONB NOT NULL DEFAULT '{"a": 50, "b": 50}', -- percentage split
  status TEXT NOT NULL DEFAULT 'draft', -- draft, running, paused, completed
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  winner TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_ab_status CHECK (status IN ('draft', 'running', 'paused', 'completed'))
);

-- A/B test events tracking
CREATE TABLE public.ab_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  variant TEXT NOT NULL,
  user_id UUID,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- impression, click, conversion
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for A/B testing
CREATE INDEX idx_ab_events_test_id ON public.ab_events(test_id);
CREATE INDEX idx_ab_events_session ON public.ab_events(session_id);
CREATE INDEX idx_ab_events_type ON public.ab_events(event_type);

-- Enable RLS for A/B testing
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_events ENABLE ROW LEVEL SECURITY;

-- Super admins can manage A/B tests
CREATE POLICY "Admins can manage ab tests"
ON public.ab_tests
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Anyone can view active tests (for frontend)
CREATE POLICY "Anyone can view active tests"
ON public.ab_tests
FOR SELECT
TO authenticated
USING (status = 'running');

-- System can log A/B events
CREATE POLICY "System can log ab events"
ON public.ab_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create trigger for updating ab_tests updated_at
CREATE TRIGGER update_ab_tests_updated_at
BEFORE UPDATE ON public.ab_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();