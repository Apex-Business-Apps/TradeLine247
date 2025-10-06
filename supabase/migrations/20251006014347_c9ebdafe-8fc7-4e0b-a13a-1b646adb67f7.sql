-- CRITICAL SECURITY FIX: Restrict system logging tables to authenticated service role only
-- Fixes: Analytics Data Poisoning & Security Audit Log Manipulation

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "System can log ab events" ON ab_events;
DROP POLICY IF EXISTS "System can log key retrieval attempts" ON key_retrieval_attempts;

-- Create strict service-role-only policies
-- ab_events: Only authenticated service role can insert A/B test events
CREATE POLICY "Service role can log ab events"
  ON ab_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- key_retrieval_attempts: Only authenticated service role can log key retrieval attempts
CREATE POLICY "Service role can log key retrieval attempts"
  ON key_retrieval_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Add SELECT policies for admins to view these security-critical tables
CREATE POLICY "Admins can view ab events"
  ON ab_events
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'));

-- Block all other operations on these tables
CREATE POLICY "Block anonymous ab events access"
  ON ab_events
  FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Block anonymous key attempts access"
  ON key_retrieval_attempts
  FOR ALL
  TO anon
  USING (false);

-- Add audit event for this security hardening
INSERT INTO audit_events (
  event_type,
  action,
  resource_type,
  metadata
) VALUES (
  'SECURITY_HARDENING',
  'UPDATE',
  'RLS_POLICIES',
  '{"description": "Restricted system logging tables to service role only", "tables": ["ab_events", "key_retrieval_attempts"], "severity": "CRITICAL"}'::jsonb
);