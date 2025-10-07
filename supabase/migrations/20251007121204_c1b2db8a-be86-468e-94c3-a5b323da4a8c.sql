-- ============================================================================
-- CRITICAL SECURITY FIXES - Production Readiness
-- Fixes: vehicles policies, usage_counters policy, public exposure documentation
-- ============================================================================

-- ============================================================================
-- FIX 1: Add missing RLS policies for vehicles table
-- ISSUE: vehicles table only has SELECT policy, missing INSERT/UPDATE/DELETE
-- RISK: Any authenticated user could manipulate vehicle listings
-- ============================================================================

CREATE POLICY "Users can insert vehicles in their dealerships"
ON vehicles FOR INSERT
TO authenticated
WITH CHECK (
  dealership_id IN (
    SELECT id FROM dealerships 
    WHERE organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Users can update vehicles in their dealerships"
ON vehicles FOR UPDATE
TO authenticated
USING (
  dealership_id IN (
    SELECT id FROM dealerships 
    WHERE organization_id = get_user_organization(auth.uid())
  )
)
WITH CHECK (
  dealership_id IN (
    SELECT id FROM dealerships 
    WHERE organization_id = get_user_organization(auth.uid())
  )
);

CREATE POLICY "Admins can delete vehicles in their dealerships"
ON vehicles FOR DELETE
TO authenticated
USING (
  dealership_id IN (
    SELECT id FROM dealerships 
    WHERE organization_id = get_user_organization(auth.uid())
  )
  AND (
    has_role(auth.uid(), 'org_admin') OR 
    has_role(auth.uid(), 'super_admin')
  )
);

-- ============================================================================
-- FIX 2: Replace overly permissive usage_counters policy
-- ISSUE: Policy allows ANY authenticated user to modify billing counters
-- RISK: Users can manipulate usage tracking and reduce billing charges
-- ============================================================================

DROP POLICY IF EXISTS "System can update usage counters" ON usage_counters;

-- Restrict to service role only (backend operations)
CREATE POLICY "Service role can manage usage counters"
ON usage_counters FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to view their org usage (read-only)
CREATE POLICY "Users can view their org usage counters"
ON usage_counters FOR SELECT
TO authenticated
USING (organization_id = get_user_organization(auth.uid()));

-- ============================================================================
-- FIX 3: Add comments documenting intentional public access
-- ISSUE: pricing_tiers and ab_tests are publicly readable
-- JUSTIFICATION: Business requirement for marketing landing pages
-- ============================================================================

COMMENT ON POLICY "Anyone can view active pricing tiers" ON pricing_tiers IS 
'BUSINESS JUSTIFICATION: Pricing information displayed on public marketing pages for lead generation. Only active tiers are exposed. Sensitive internal pricing data (cost, margins) not included in public schema.';

COMMENT ON POLICY "Anyone can view active tests" ON ab_tests IS 
'BUSINESS JUSTIFICATION: A/B test variant assignment requires public read access for anonymous visitors. Test names and descriptions are intentionally generic to prevent competitive intelligence leakage. Detailed analytics restricted to admin access.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify vehicles policies exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vehicles' 
    AND policyname = 'Users can insert vehicles in their dealerships'
  ) THEN
    RAISE EXCEPTION 'vehicles INSERT policy not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vehicles' 
    AND policyname = 'Users can update vehicles in their dealerships'
  ) THEN
    RAISE EXCEPTION 'vehicles UPDATE policy not created';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vehicles' 
    AND policyname = 'Admins can delete vehicles in their dealerships'
  ) THEN
    RAISE EXCEPTION 'vehicles DELETE policy not created';
  END IF;
END $$;

-- Verify usage_counters policy replaced
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usage_counters' 
    AND policyname = 'System can update usage counters'
  ) THEN
    RAISE EXCEPTION 'Old usage_counters policy still exists - should be dropped';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usage_counters' 
    AND policyname = 'Service role can manage usage counters'
  ) THEN
    RAISE EXCEPTION 'New usage_counters service role policy not created';
  END IF;
END $$;