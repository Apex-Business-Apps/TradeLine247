-- Enterprise Security, Monitoring & Reliability Schema
-- Production-grade features for TradeLine 24/7

-- ==========================================
-- SYSTEM MONITORING & LOGGING
-- ==========================================

CREATE TABLE IF NOT EXISTS public.system_monitoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('error', 'warning', 'info', 'security', 'performance')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  component TEXT NOT NULL,
  operation TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  request_id TEXT,
  duration_ms INTEGER,
  error_code TEXT,
  stack_trace TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System health checks
CREATE TABLE IF NOT EXISTS public.system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  response_time_ms INTEGER NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System alerts
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('error', 'warning', 'info', 'security', 'performance')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  component TEXT NOT NULL,
  operation TEXT,
  error_code TEXT,
  stack_trace TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- SECURITY AUDIT & COMPLIANCE
-- ==========================================

-- Security events audit log
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'auth_attempt', 'auth_success', 'auth_failure', 'auth_logout',
    'data_access', 'data_modification', 'data_deletion',
    'permission_change', 'role_change', 'suspicious_activity',
    'rate_limit_exceeded', 'brute_force_attempt', 'sql_injection_attempt',
    'xss_attempt', 'csrf_attempt', 'unauthorized_access'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  ip_address INET,
  user_agent TEXT,
  location_data JSONB, -- GeoIP data
  request_data JSONB, -- Request details
  response_data JSONB, -- Response details
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  mitigation_action TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data retention and deletion tracking
CREATE TABLE IF NOT EXISTS public.data_retention_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  retention_policy TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  deletion_reason TEXT,
  deleted_by UUID REFERENCES auth.users(id),
  scheduled_deletion_date DATE,
  actual_deletion_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- RATE LIMITING & ABUSE PREVENTION
-- ==========================================

-- Rate limiting counters
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP, user_id, or API key
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('ip', 'user', 'api_key', 'organization')),
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_duration_seconds INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  limit_exceeded BOOLEAN DEFAULT false,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(identifier, identifier_type, endpoint, window_start)
);

-- IP reputation and blocking
CREATE TABLE IF NOT EXISTS public.ip_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reputation_score INTEGER NOT NULL DEFAULT 50 CHECK (reputation_score BETWEEN 0 AND 100),
  total_requests INTEGER NOT NULL DEFAULT 0,
  blocked_requests INTEGER NOT NULL DEFAULT 0,
  suspicious_requests INTEGER NOT NULL DEFAULT 0,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  block_reason TEXT,
  geo_data JSONB, -- Country, city, ISP info
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- BACKUP & DISASTER RECOVERY
-- ==========================================

-- Backup status tracking
CREATE TABLE IF NOT EXISTS public.backup_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'point_in_time')),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  size_bytes BIGINT,
  tables_backed_up TEXT[],
  error_message TEXT,
  storage_location TEXT,
  retention_days INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Configuration backup
CREATE TABLE IF NOT EXISTS public.configuration_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  config_type TEXT NOT NULL CHECK (config_type IN ('voice', 'ai_personality', 'calendar', 'integrations')),
  config_data JSONB NOT NULL,
  version TEXT NOT NULL,
  backup_reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- ADMIN ACTION AUDIT
-- ==========================================

-- Admin action log
CREATE TABLE IF NOT EXISTS public.admin_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- COMPLIANCE & GDPR
-- ==========================================

-- GDPR consent and data processing log
CREATE TABLE IF NOT EXISTS public.gdpr_consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  consent_type TEXT NOT NULL CHECK (consent_type IN ('marketing', 'analytics', 'data_processing', 'voice_recording')),
  consent_given BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  consent_text TEXT NOT NULL,
  withdrawal_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data subject access requests (DSAR)
CREATE TABLE IF NOT EXISTS public.dsar_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'restriction', 'portability', 'objection')),
  requester_email TEXT NOT NULL,
  requester_name TEXT,
  requester_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  request_details TEXT,
  response_data JSONB,
  response_sent_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

-- Monitoring indexes
CREATE INDEX idx_monitoring_events_type_severity ON public.system_monitoring_events(event_type, severity);
CREATE INDEX idx_monitoring_events_component ON public.system_monitoring_events(component);
CREATE INDEX idx_monitoring_events_created_at ON public.system_monitoring_events(created_at DESC);
CREATE INDEX idx_monitoring_events_user_id ON public.system_monitoring_events(user_id);

-- Performance metrics indexes
CREATE INDEX idx_performance_operation ON public.performance_metrics(operation);
CREATE INDEX idx_performance_duration ON public.performance_metrics(duration_ms);
CREATE INDEX idx_performance_collected_at ON public.performance_metrics(collected_at DESC);

-- Health checks indexes
CREATE INDEX idx_health_service_status ON public.system_health_checks(service, status);
CREATE INDEX idx_health_checked_at ON public.system_health_checks(checked_at DESC);

-- Security audit indexes
CREATE INDEX idx_security_event_type ON public.security_audit_log(event_type);
CREATE INDEX idx_security_user_id ON public.security_audit_log(user_id);
CREATE INDEX idx_security_organization_id ON public.security_audit_log(organization_id);
CREATE INDEX idx_security_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX idx_security_risk_score ON public.security_audit_log(risk_score);

-- Rate limiting indexes
CREATE INDEX idx_rate_limit_identifier ON public.rate_limit_counters(identifier, identifier_type);
CREATE INDEX idx_rate_limit_window ON public.rate_limit_counters(window_start);
CREATE INDEX idx_rate_limit_endpoint ON public.rate_limit_counters(endpoint);

-- IP reputation indexes
CREATE INDEX idx_ip_reputation_score ON public.ip_reputation(reputation_score);
CREATE INDEX idx_ip_reputation_blocked ON public.ip_reputation(blocked_until) WHERE blocked_until IS NOT NULL;

-- Backup indexes
CREATE INDEX idx_backup_status_type ON public.backup_status(backup_type);
CREATE INDEX idx_backup_status_created_at ON public.backup_status(created_at DESC);

-- Admin action indexes
CREATE INDEX idx_admin_action_user ON public.admin_action_log(user_id);
CREATE INDEX idx_admin_action_org ON public.admin_action_log(organization_id);
CREATE INDEX idx_admin_action_resource ON public.admin_action_log(resource_type, resource_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.system_monitoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuration_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdpr_consent_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dsar_requests ENABLE ROW LEVEL SECURITY;

-- Monitoring events - Service role only (sensitive system data)
CREATE POLICY "Service role can access monitoring events"
  ON public.system_monitoring_events FOR ALL
  USING (auth.role() = 'service_role');

-- Performance metrics - Service role only
CREATE POLICY "Service role can access performance metrics"
  ON public.performance_metrics FOR ALL
  USING (auth.role() = 'service_role');

-- Health checks - Service role only
CREATE POLICY "Service role can access health checks"
  ON public.system_health_checks FOR ALL
  USING (auth.role() = 'service_role');

-- System alerts - Admins only
CREATE POLICY "Admins can view system alerts"
  ON public.system_alerts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR auth.role() = 'service_role');

CREATE POLICY "Admins can update system alerts"
  ON public.system_alerts FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR auth.role() = 'service_role');

-- Security audit log - Admins and service role
CREATE POLICY "Admins and service role can view security audit"
  ON public.security_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR auth.role() = 'service_role');

-- Rate limiting - Service role only
CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limit_counters FOR ALL
  USING (auth.role() = 'service_role');

-- IP reputation - Service role only
CREATE POLICY "Service role can manage IP reputation"
  ON public.ip_reputation FOR ALL
  USING (auth.role() = 'service_role');

-- Backup status - Admins only
CREATE POLICY "Admins can view backup status"
  ON public.backup_status FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR auth.role() = 'service_role');

-- Configuration backups - Org members can view their own
CREATE POLICY "Org members can view their config backups"
  ON public.configuration_backups FOR SELECT
  USING (organization_id IN (
    SELECT org_id FROM public.organization_members
    WHERE user_id = auth.uid()
  ));

-- Admin action log - Admins only
CREATE POLICY "Admins can view admin actions"
  ON public.admin_action_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR auth.role() = 'service_role');

-- GDPR consent - Users can view their own
CREATE POLICY "Users can view their GDPR consent"
  ON public.gdpr_consent_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their GDPR consent"
  ON public.gdpr_consent_log FOR ALL
  USING (user_id = auth.uid());

-- DSAR requests - Users can view their own, admins can manage all
CREATE POLICY "Users can view their DSAR requests"
  ON public.dsar_requests FOR SELECT
  USING (requester_id = auth.uid());

CREATE POLICY "Admins can manage DSAR requests"
  ON public.dsar_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR auth.role() = 'service_role');

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_system_alerts_updated_at
  BEFORE UPDATE ON public.system_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_updated_at
  BEFORE UPDATE ON public.data_retention_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_updated_at
  BEFORE UPDATE ON public.rate_limit_counters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ip_reputation_updated_at
  BEFORE UPDATE ON public.ip_reputation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backup_status_updated_at
  BEFORE UPDATE ON public.backup_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gdpr_consent_updated_at
  BEFORE UPDATE ON public.gdpr_consent_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dsar_requests_updated_at
  BEFORE UPDATE ON public.dsar_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_endpoint TEXT,
  p_window_seconds INTEGER DEFAULT 60,
  p_max_requests INTEGER DEFAULT 100
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  window_start TIMESTAMPTZ;
  current_count INTEGER;
BEGIN
  window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  -- Get current count
  SELECT COALESCE(SUM(request_count), 0)
  INTO current_count
  FROM public.rate_limit_counters
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND endpoint = p_endpoint
    AND window_start >= window_start;

  -- Check if limit exceeded
  IF current_count >= p_max_requests THEN
    -- Update blocked status
    UPDATE public.rate_limit_counters
    SET limit_exceeded = true,
        blocked_until = NOW() + '1 hour'::INTERVAL,
        updated_at = NOW()
    WHERE identifier = p_identifier
      AND identifier_type = p_identifier_type
      AND endpoint = p_endpoint
      AND window_start >= window_start;

    -- Log rate limit violation
    INSERT INTO public.security_audit_log (
      event_type, severity, user_id, ip_address,
      request_data, risk_score, mitigation_action
    ) VALUES (
      'rate_limit_exceeded', 'medium', auth.uid(), inet_client_addr(),
      jsonb_build_object('endpoint', p_endpoint, 'identifier', p_identifier),
      30, 'Request blocked for 1 hour'
    );

    RETURN false;
  END IF;

  -- Increment counter
  INSERT INTO public.rate_limit_counters (
    identifier, identifier_type, endpoint,
    window_start, window_duration_seconds, request_count
  ) VALUES (
    p_identifier, p_identifier_type, p_endpoint,
    date_trunc('second', NOW()), p_window_seconds, 1
  )
  ON CONFLICT (identifier, identifier_type, endpoint, window_start)
  DO UPDATE SET
    request_count = rate_limit_counters.request_count + 1,
    updated_at = NOW();

  RETURN true;
END;
$$;

-- Function for IP reputation checking
CREATE OR REPLACE FUNCTION check_ip_reputation(p_ip_address INET)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reputation_score INTEGER;
  is_blocked BOOLEAN;
BEGIN
  SELECT reputation_score, (blocked_until > NOW())
  INTO reputation_score, is_blocked
  FROM public.ip_reputation
  WHERE ip_address = p_ip_address;

  -- If IP not in database, assume neutral reputation
  IF reputation_score IS NULL THEN
    reputation_score := 50;
  END IF;

  -- If IP is blocked, return 0 (bad reputation)
  IF is_blocked THEN
    reputation_score := 0;
  END IF;

  RETURN reputation_score;
END;
$$;

-- Function for automated data retention enforcement
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
  retention_record RECORD;
BEGIN
  -- Process bookings older than retention policy
  FOR retention_record IN
    SELECT DISTINCT ON (table_name)
      table_name,
      retention_days,
      record_id
    FROM public.data_retention_log
    WHERE status = 'scheduled'
      AND scheduled_deletion_date <= CURRENT_DATE
    ORDER BY table_name, scheduled_deletion_date
  LOOP
    -- Mark as processing
    UPDATE public.data_retention_log
    SET status = 'processing', updated_at = NOW()
    WHERE table_name = retention_record.table_name
      AND record_id = retention_record.record_id;

    -- Execute deletion based on table
    CASE retention_record.table_name
      WHEN 'call_logs' THEN
        DELETE FROM public.call_logs WHERE id = retention_record.record_id::UUID;
      WHEN 'call_transcriptions' THEN
        DELETE FROM public.call_transcriptions WHERE id = retention_record.record_id::UUID;
      WHEN 'bookings' THEN
        DELETE FROM public.bookings WHERE id = retention_record.record_id::UUID;
      WHEN 'escalation_logs' THEN
        DELETE FROM public.escalation_logs WHERE id = retention_record.record_id::UUID;
      WHEN 'security_audit_log' THEN
        DELETE FROM public.security_audit_log WHERE id = retention_record.record_id::UUID;
      ELSE
        -- Skip unknown tables
        CONTINUE;
    END CASE;

    -- Mark as completed
    UPDATE public.data_retention_log
    SET status = 'completed',
        actual_deletion_date = NOW(),
        updated_at = NOW()
    WHERE table_name = retention_record.table_name
      AND record_id = retention_record.record_id;

    deleted_count := deleted_count + 1;
  END LOOP;

  RETURN deleted_count;
END;
$$;

-- Function for comprehensive security audit
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type TEXT,
  p_severity TEXT DEFAULT 'medium',
  p_details JSONB DEFAULT '{}'::jsonb,
  p_risk_score INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    event_type, severity, user_id, organization_id,
    ip_address, user_agent, location_data,
    request_data, risk_score
  ) VALUES (
    p_event_type, p_severity, auth.uid(),
    (SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1),
    inet_client_addr(), current_setting('request.headers', true)::jsonb->>'user-agent',
    NULL, -- GeoIP lookup would be done here in production
    p_details, p_risk_score
  );
END;
$$;

-- ==========================================
-- SCHEDULED TASKS (REQUIRES PG_CRON)
-- ==========================================

-- Note: These would be set up with pg_cron in production
-- Example scheduled tasks:

-- Clean up old monitoring events (keep 90 days)
-- SELECT cron.schedule('cleanup-monitoring-events', '0 2 * * *', $$
--   DELETE FROM system_monitoring_events WHERE created_at < NOW() - INTERVAL '90 days'
-- $$);

-- Enforce data retention policies daily
-- SELECT cron.schedule('enforce-data-retention', '0 3 * * *', $$
--   SELECT enforce_data_retention()
-- $$);

-- Clean up expired rate limit counters
-- SELECT cron.schedule('cleanup-rate-limits', '*/30 * * * *', $$
--   DELETE FROM rate_limit_counters WHERE window_start < NOW() - INTERVAL '1 hour'
-- $$);

-- Update IP reputation scores
-- SELECT cron.schedule('update-ip-reputation', '0 */4 * * *', $$
--   UPDATE ip_reputation SET reputation_score = GREATEST(0, reputation_score - 1)
--   WHERE last_activity < NOW() - INTERVAL '24 hours' AND reputation_score > 0
-- $$);

-- ==========================================
-- GRANTS AND PERMISSIONS
-- ==========================================

GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION check_ip_reputation(INET) TO authenticated;
GRANT EXECUTE ON FUNCTION enforce_data_retention() TO service_role;
GRANT EXECUTE ON FUNCTION log_security_event(TEXT, TEXT, JSONB, INTEGER) TO authenticated;