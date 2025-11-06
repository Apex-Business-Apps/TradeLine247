-- One-Click Onboarding: Numbers table and RLS policies
-- Creates public.numbers table if it doesn't exist, with tenant_id enforcement

-- Create numbers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  phone_sid TEXT NOT NULL UNIQUE,
  e164 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  subaccount_sid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT numbers_tenant_e164_unique UNIQUE(tenant_id, e164)
);

-- Enable RLS
ALTER TABLE public.numbers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "tenant_insert_numbers" ON public.numbers;
DROP POLICY IF EXISTS "tenant_read_numbers" ON public.numbers;

-- INSERT allowed only when the user belongs to the tenant
CREATE POLICY "tenant_insert_numbers"
ON public.numbers
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.organization_id = numbers.tenant_id
  )
);

-- SELECT allowed only within tenant
CREATE POLICY "tenant_read_numbers"
ON public.numbers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() 
    AND p.organization_id = numbers.tenant_id
  )
);

-- Service role can manage all numbers (for Edge Functions)
CREATE POLICY "service_role_manage_numbers"
ON public.numbers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_numbers_tenant_id ON public.numbers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_numbers_e164 ON public.numbers(e164);
CREATE INDEX IF NOT EXISTS idx_numbers_phone_sid ON public.numbers(phone_sid);

