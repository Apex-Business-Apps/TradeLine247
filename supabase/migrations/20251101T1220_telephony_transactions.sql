-- Telephony Transaction Management
-- Ensures atomic multi-step operations with rollback capability

-- Transaction log table
CREATE TABLE IF NOT EXISTS telephony_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL, -- 'onboarding', 'port', 'number_purchase', etc.
  org_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
  steps_completed JSONB DEFAULT '[]'::JSONB,
  rollback_actions JSONB DEFAULT '[]'::JSONB,
  metadata JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_telephony_tx_org
  ON telephony_transactions(org_id, status);

CREATE INDEX IF NOT EXISTS idx_telephony_tx_status
  ON telephony_transactions(status, created_at);

-- Function to start transaction
CREATE OR REPLACE FUNCTION start_telephony_transaction(
  p_transaction_type TEXT,
  p_org_id TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
  v_tx_id UUID;
BEGIN
  INSERT INTO telephony_transactions (
    transaction_type,
    org_id,
    status,
    metadata
  ) VALUES (
    p_transaction_type,
    p_org_id,
    'in_progress',
    p_metadata
  ) RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record completed step
CREATE OR REPLACE FUNCTION record_transaction_step(
  p_tx_id UUID,
  p_step_name TEXT,
  p_step_data JSONB,
  p_rollback_action JSONB DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_steps JSONB;
  v_rollbacks JSONB;
BEGIN
  -- Get current steps
  SELECT steps_completed, rollback_actions INTO v_steps, v_rollbacks
  FROM telephony_transactions
  WHERE id = p_tx_id;

  -- Append new step
  v_steps := v_steps || jsonb_build_object(
    'step', p_step_name,
    'data', p_step_data,
    'completed_at', NOW()
  );

  -- Append rollback action if provided
  IF p_rollback_action IS NOT NULL THEN
    v_rollbacks := v_rollbacks || p_rollback_action;
  END IF;

  -- Update transaction
  UPDATE telephony_transactions
  SET steps_completed = v_steps,
      rollback_actions = v_rollbacks,
      updated_at = NOW()
  WHERE id = p_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete transaction
CREATE OR REPLACE FUNCTION complete_telephony_transaction(
  p_tx_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE telephony_transactions
  SET status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fail transaction
CREATE OR REPLACE FUNCTION fail_telephony_transaction(
  p_tx_id UUID,
  p_error_message TEXT
) RETURNS void AS $$
BEGIN
  UPDATE telephony_transactions
  SET status = 'failed',
      error_message = p_error_message,
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rollback transaction
CREATE OR REPLACE FUNCTION rollback_telephony_transaction(
  p_tx_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_rollback_actions JSONB;
BEGIN
  -- Get rollback actions
  SELECT rollback_actions INTO v_rollback_actions
  FROM telephony_transactions
  WHERE id = p_tx_id;

  -- Mark as rolled back
  UPDATE telephony_transactions
  SET status = 'rolled_back',
      completed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_tx_id;

  RETURN v_rollback_actions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE telephony_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all ON telephony_transactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE telephony_transactions IS 'Tracks multi-step telephony operations with rollback capability';
