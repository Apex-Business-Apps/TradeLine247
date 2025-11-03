-- Idempotency Keys for Critical Operations
-- Prevents duplicate operations from race conditions or retries

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  operation_type TEXT NOT NULL, -- 'number_purchase', 'subaccount_create', etc.
  request_hash TEXT NOT NULL, -- Hash of request parameters
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  result JSONB, -- Operation result
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_idempotency_key
  ON idempotency_keys(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires
  ON idempotency_keys(expires_at)
  WHERE expires_at > NOW();

-- Function to check/create idempotency key
CREATE OR REPLACE FUNCTION check_idempotency_key(
  p_key TEXT,
  p_operation_type TEXT,
  p_request_hash TEXT
) RETURNS JSONB AS $$
DECLARE
  v_existing RECORD;
  v_result JSONB;
BEGIN
  -- Check for existing key
  SELECT * INTO v_existing
  FROM idempotency_keys
  WHERE idempotency_key = p_key
    AND expires_at > NOW();

  IF FOUND THEN
    -- Key exists
    IF v_existing.status = 'completed' THEN
      -- Return cached result
      RETURN jsonb_build_object(
        'is_duplicate', true,
        'status', 'completed',
        'result', v_existing.result
      );
    ELSIF v_existing.status = 'processing' THEN
      -- Operation in progress
      RETURN jsonb_build_object(
        'is_duplicate', true,
        'status', 'processing',
        'message', 'Operation already in progress'
      );
    ELSE
      -- Failed previously, allow retry
      UPDATE idempotency_keys
      SET status = 'processing',
          updated_at = NOW()
      WHERE idempotency_key = p_key;

      RETURN jsonb_build_object(
        'is_duplicate', false,
        'is_retry', true
      );
    END IF;
  ELSE
    -- New operation
    INSERT INTO idempotency_keys (
      idempotency_key,
      operation_type,
      request_hash,
      status
    ) VALUES (
      p_key,
      p_operation_type,
      p_request_hash,
      'processing'
    );

    RETURN jsonb_build_object(
      'is_duplicate', false,
      'is_retry', false
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete idempotency operation
CREATE OR REPLACE FUNCTION complete_idempotency_key(
  p_key TEXT,
  p_result JSONB,
  p_status TEXT DEFAULT 'completed'
) RETURNS void AS $$
BEGIN
  UPDATE idempotency_keys
  SET status = p_status,
      result = p_result,
      updated_at = NOW()
  WHERE idempotency_key = p_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fail idempotency operation
CREATE OR REPLACE FUNCTION fail_idempotency_key(
  p_key TEXT,
  p_error_message TEXT
) RETURNS void AS $$
BEGIN
  UPDATE idempotency_keys
  SET status = 'failed',
      error_message = p_error_message,
      updated_at = NOW()
  WHERE idempotency_key = p_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_idempotency_keys() RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all ON idempotency_keys
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE idempotency_keys IS 'Prevents duplicate operations from retries or race conditions';
