-- Phase 1: Critical PII Protection - Add explicit anonymous denial policies

-- Block anonymous access to all sensitive tables
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

CREATE POLICY "Block anonymous access to leads"
ON public.leads
FOR ALL
TO anon
USING (false);

CREATE POLICY "Block anonymous access to credit_applications"
ON public.credit_applications
FOR ALL
TO anon
USING (false);

CREATE POLICY "Block anonymous access to dealerships"
ON public.dealerships
FOR ALL
TO anon
USING (false);

CREATE POLICY "Block anonymous access to documents"
ON public.documents
FOR ALL
TO anon
USING (false);

CREATE POLICY "Block anonymous access to integrations"
ON public.integrations
FOR ALL
TO anon
USING (false);

CREATE POLICY "Block anonymous access to webhooks"
ON public.webhooks
FOR ALL
TO anon
USING (false);

CREATE POLICY "Block anonymous access to consents"
ON public.consents
FOR ALL
TO anon
USING (false);

CREATE POLICY "Block anonymous access to encryption_keys"
ON public.encryption_keys
FOR ALL
TO anon
USING (false);

-- Update leads RLS policies for granular access control
-- Drop existing broad policy
DROP POLICY IF EXISTS "Users can view leads in their dealerships" ON public.leads;

-- Sales reps see only assigned leads, managers see all dealership leads
CREATE POLICY "Sales reps can view assigned leads"
ON public.leads
FOR SELECT
TO authenticated
USING (
  (assigned_to = auth.uid()) OR
  (
    dealership_id IN (
      SELECT dealerships.id
      FROM dealerships
      WHERE dealerships.organization_id = get_user_organization(auth.uid())
    ) AND (
      has_role(auth.uid(), 'org_admin'::user_role) OR
      has_role(auth.uid(), 'super_admin'::user_role)
    )
  )
);

-- Phase 2: Encryption System - Create proper key storage

-- Create encryption keys table for secure key storage
CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_encrypted text NOT NULL,
  iv text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  rotated_at timestamp with time zone,
  access_count integer DEFAULT 0,
  last_accessed_at timestamp with time zone,
  purpose text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on encryption keys
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;

-- Only service role and key owner can access
CREATE POLICY "Users can access their own encryption keys"
ON public.encryption_keys
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create encryption keys"
ON public.encryption_keys
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can access keys for their org users
CREATE POLICY "Admins can access org encryption keys"
ON public.encryption_keys
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT profiles.id
    FROM profiles
    WHERE profiles.organization_id = get_user_organization(auth.uid())
  ) AND (
    has_role(auth.uid(), 'super_admin'::user_role) OR
    has_role(auth.uid(), 'org_admin'::user_role)
  )
);

-- Add index for performance
CREATE INDEX idx_encryption_keys_user_id ON public.encryption_keys(user_id);
CREATE INDEX idx_encryption_keys_purpose ON public.encryption_keys(purpose);

-- Add rate limiting table for key retrieval
CREATE TABLE IF NOT EXISTS public.key_retrieval_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_id uuid NOT NULL,
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  success boolean NOT NULL,
  ip_address text
);

-- Enable RLS
ALTER TABLE public.key_retrieval_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view attempts
CREATE POLICY "Admins can view key retrieval attempts"
ON public.key_retrieval_attempts
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::user_role) OR
  has_role(auth.uid(), 'org_admin'::user_role)
);

-- System can insert attempts
CREATE POLICY "System can log key retrieval attempts"
ON public.key_retrieval_attempts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for rate limiting queries
CREATE INDEX idx_key_retrieval_attempts_user_time 
ON public.key_retrieval_attempts(user_id, attempted_at DESC);

-- Function to check rate limit (max 10 attempts per minute)
CREATE OR REPLACE FUNCTION check_key_retrieval_rate_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count integer;
BEGIN
  SELECT COUNT(*)
  INTO attempt_count
  FROM key_retrieval_attempts
  WHERE user_id = p_user_id
    AND attempted_at > NOW() - INTERVAL '1 minute';
  
  RETURN attempt_count < 10;
END;
$$;