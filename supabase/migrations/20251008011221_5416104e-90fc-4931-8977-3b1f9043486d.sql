-- Phase 3: Drop duplicate READ policy on usage_counters
-- Remove the broader {public} read policy; retain the explicit {authenticated} one

DROP POLICY IF EXISTS "Users can view their org usage" ON public.usage_counters;