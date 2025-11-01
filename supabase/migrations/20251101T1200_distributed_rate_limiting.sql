-- Distributed Rate Limiting Tables
-- Replaces in-memory rate limiting with persistent, distributed solution

-- Rate limit tracking table
CREATE TABLE IF NOT EXISTS rate_limit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- phone number or IP address
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('phone', 'ip')),
  endpoint TEXT NOT NULL, -- voice-frontdoor, contact-submit, etc.
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier
  ON rate_limit_requests(identifier, endpoint, window_end);

CREATE INDEX IF NOT EXISTS idx_rate_limit_window_end
  ON rate_limit_requests(window_end)
  WHERE window_end > NOW();

-- Auto-cleanup old entries (older than 24 hours)
CREATE INDEX IF NOT EXISTS idx_rate_limit_cleanup
  ON rate_limit_requests(created_at)
  WHERE created_at < NOW() - INTERVAL '24 hours';

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_identifier_type TEXT,
  p_endpoint TEXT,
  p_window_seconds INTEGER DEFAULT 60,
  p_max_requests INTEGER DEFAULT 10
) RETURNS JSONB AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
  v_current_count INTEGER;
  v_result JSONB;
BEGIN
  -- Calculate current window
  v_window_start := NOW();
  v_window_end := v_window_start + (p_window_seconds || ' seconds')::INTERVAL;

  -- Get current count for this window
  SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
  FROM rate_limit_requests
  WHERE identifier = p_identifier
    AND identifier_type = p_identifier_type
    AND endpoint = p_endpoint
    AND window_end > NOW()
    AND window_start < v_window_end;

  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'current_count', v_current_count,
      'limit', p_max_requests,
      'retry_after', (SELECT MIN(window_end) FROM rate_limit_requests
                      WHERE identifier = p_identifier
                      AND endpoint = p_endpoint
                      AND window_end > NOW())
    );
  END IF;

  -- Insert or update request count
  INSERT INTO rate_limit_requests (
    identifier,
    identifier_type,
    endpoint,
    request_count,
    window_start,
    window_end
  ) VALUES (
    p_identifier,
    p_identifier_type,
    p_endpoint,
    1,
    v_window_start,
    v_window_end
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN jsonb_build_object(
    'allowed', true,
    'current_count', v_current_count + 1,
    'limit', p_max_requests,
    'remaining', p_max_requests - v_current_count - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function for old entries
CREATE OR REPLACE FUNCTION cleanup_rate_limit_requests() RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_requests
  WHERE window_end < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE rate_limit_requests ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY service_role_all ON rate_limit_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE rate_limit_requests IS 'Distributed rate limiting for Edge Functions';
COMMENT ON FUNCTION check_rate_limit IS 'Check if request is within rate limit and increment counter';
COMMENT ON FUNCTION cleanup_rate_limit_requests IS 'Remove expired rate limit entries';
