-- Monitoring and Analytics Views
-- Pre-built queries for dashboards and alerts

-- Active calls view
CREATE OR REPLACE VIEW active_calls AS
SELECT
  call_sid,
  from_e164,
  to_e164,
  mode,
  status,
  consent_given,
  started_at,
  EXTRACT(EPOCH FROM (NOW() - started_at)) AS duration_seconds
FROM call_logs
WHERE status IN ('routing', 'in-progress', 'ringing')
  AND started_at > NOW() - INTERVAL '1 hour'
ORDER BY started_at DESC;

-- Call volume by hour (last 24 hours)
CREATE OR REPLACE VIEW call_volume_hourly AS
SELECT
  DATE_TRUNC('hour', created_at) AS hour,
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE mode = 'sales') AS sales_calls,
  COUNT(*) FILTER (WHERE mode = 'support') AS support_calls,
  COUNT(*) FILTER (WHERE mode = 'voicemail') AS voicemail_calls,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_calls,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_calls,
  AVG(duration_sec) FILTER (WHERE duration_sec IS NOT NULL) AS avg_duration_sec
FROM call_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Recent errors
CREATE OR REPLACE VIEW recent_errors AS
SELECT
  event_type,
  event_data,
  severity,
  created_at
FROM analytics_events
WHERE severity IN ('error', 'critical')
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 50;

-- Rate limit violations (last hour)
CREATE OR REPLACE VIEW rate_limit_violations AS
SELECT
  identifier,
  identifier_type,
  endpoint,
  COUNT(*) AS violation_count,
  MAX(created_at) AS last_violation
FROM rate_limit_requests
WHERE request_count >= (
  CASE endpoint
    WHEN 'voice-frontdoor' THEN 10
    WHEN 'contact-submit' THEN 3
    ELSE 10
  END
)
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY identifier, identifier_type, endpoint
ORDER BY violation_count DESC;

-- Failed transactions
CREATE OR REPLACE VIEW failed_transactions AS
SELECT
  id,
  transaction_type,
  org_id,
  error_message,
  steps_completed,
  started_at,
  completed_at,
  EXTRACT(EPOCH FROM (completed_at - started_at)) AS duration_seconds
FROM telephony_transactions
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Number provisioning status
CREATE OR REPLACE VIEW number_provisioning_status AS
SELECT
  tn.org_id,
  tn.e164_number,
  tn.country,
  ts.business_name,
  ts.subaccount_sid,
  tn.created_at AS provisioned_at,
  (
    SELECT COUNT(*)
    FROM call_logs cl
    WHERE cl.to_e164 = tn.e164_number
      AND cl.created_at > NOW() - INTERVAL '24 hours'
  ) AS calls_last_24h
FROM telephony_numbers tn
LEFT JOIN telephony_subaccounts ts ON tn.org_id = ts.org_id
ORDER BY tn.created_at DESC;

-- Voicemail backlog
CREATE OR REPLACE VIEW voicemail_backlog AS
SELECT
  call_sid,
  from_e164,
  recording_url,
  transcript,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_old
FROM call_logs
WHERE mode = 'voicemail'
  AND status = 'voicemail_received'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at ASC;

-- Call success rate (last 24 hours)
CREATE OR REPLACE VIEW call_success_metrics AS
SELECT
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE status = 'completed') AS completed_calls,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_calls,
  COUNT(*) FILTER (WHERE status IN ('routing', 'in-progress')) AS in_progress_calls,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) AS success_rate_pct,
  AVG(duration_sec) FILTER (WHERE status = 'completed') AS avg_call_duration_sec
FROM call_logs
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Consent opt-out rate
CREATE OR REPLACE VIEW consent_metrics AS
SELECT
  COUNT(*) AS total_calls,
  COUNT(*) FILTER (WHERE consent_given = true) AS consented_calls,
  COUNT(*) FILTER (WHERE consent_given = false) AS opted_out_calls,
  ROUND(
    COUNT(*) FILTER (WHERE consent_given = false)::NUMERIC /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) AS opt_out_rate_pct
FROM call_logs
WHERE created_at > NOW() - INTERVAL '7 days'
  AND consent_given IS NOT NULL;

-- Grant access to views
GRANT SELECT ON active_calls TO service_role, authenticated;
GRANT SELECT ON call_volume_hourly TO service_role, authenticated;
GRANT SELECT ON recent_errors TO service_role, authenticated;
GRANT SELECT ON rate_limit_violations TO service_role;
GRANT SELECT ON failed_transactions TO service_role;
GRANT SELECT ON number_provisioning_status TO service_role, authenticated;
GRANT SELECT ON voicemail_backlog TO service_role, authenticated;
GRANT SELECT ON call_success_metrics TO service_role, authenticated;
GRANT SELECT ON consent_metrics TO service_role, authenticated;

COMMENT ON VIEW active_calls IS 'Currently active phone calls';
COMMENT ON VIEW call_volume_hourly IS 'Hourly call volume statistics';
COMMENT ON VIEW recent_errors IS 'Recent system errors for debugging';
COMMENT ON VIEW rate_limit_violations IS 'Rate limit violations requiring attention';
COMMENT ON VIEW failed_transactions IS 'Failed multi-step operations';
COMMENT ON VIEW number_provisioning_status IS 'Status of provisioned phone numbers';
COMMENT ON VIEW voicemail_backlog IS 'Voicemails requiring follow-up';
COMMENT ON VIEW call_success_metrics IS 'Call success rate and quality metrics';
COMMENT ON VIEW consent_metrics IS 'Recording consent and opt-out statistics';
