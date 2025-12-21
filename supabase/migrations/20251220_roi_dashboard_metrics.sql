-- ROI Dashboard Metrics
-- Add computed columns and RPC functions for ROI calculations

-- Add computed column for task time estimates
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_minutes integer DEFAULT 5;

-- Update existing tasks with reasonable defaults based on type
UPDATE tasks SET estimated_minutes = 10 WHERE source_type = 'call';
UPDATE tasks SET estimated_minutes = 3 WHERE source_type = 'email';
UPDATE tasks SET estimated_minutes = 15 WHERE source_type = 'booking';

-- RPC function to get ROI metrics for a user/org
CREATE OR REPLACE FUNCTION get_roi_metrics(
  start_date timestamptz DEFAULT (now() - interval '30 days'),
  end_date timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  user_org_id uuid;
  total_hours_saved float;
  lead_velocity_median interval;
  lead_velocity_p90 interval;
  total_tasks_completed integer;
  total_emails_processed integer;
  total_calls_processed integer;
  total_bookings_created integer;
BEGIN
  -- Get user's org ID
  SELECT org_id INTO user_org_id
  FROM auth.users
  WHERE id = auth.uid();

  IF user_org_id IS NULL THEN
    RAISE EXCEPTION 'User not found or not associated with an organization';
  END IF;

  -- Calculate hours saved from automated tasks
  SELECT
    COALESCE(SUM(estimated_minutes) / 60.0, 0)::float,
    COUNT(*)::integer
  INTO total_hours_saved, total_tasks_completed
  FROM tasks
  WHERE org_id = user_org_id
    AND status = 'completed'
    AND created_at >= start_date
    AND created_at <= end_date;

  -- Count emails processed
  SELECT COUNT(*)::integer INTO total_emails_processed
  FROM email_messages
  WHERE org_id = user_org_id
    AND received_at >= start_date
    AND received_at <= end_date;

  -- Count calls processed
  SELECT COUNT(*)::integer INTO total_calls_processed
  FROM calls
  WHERE org_id = user_org_id
    AND created_at >= start_date
    AND created_at <= end_date;

  -- Count bookings created
  SELECT COUNT(*)::integer INTO total_bookings_created
  FROM bookings
  WHERE org_id = user_org_id
    AND created_at >= start_date
    AND created_at <= end_date;

  -- Calculate lead velocity (time from missed call to booking)
  -- This is a simplified calculation - in production you'd want more sophisticated lead tracking
  SELECT
    percentile_cont(0.5) WITHIN GROUP (ORDER BY lead_time) as median_lead_time,
    percentile_cont(0.9) WITHIN GROUP (ORDER BY lead_time) as p90_lead_time
  INTO lead_velocity_median, lead_velocity_p90
  FROM (
    SELECT
      b.created_at - c.started_at as lead_time
    FROM bookings b
    JOIN calls c ON c.id = b.id::uuid  -- This assumes some relationship, adjust as needed
    WHERE b.org_id = user_org_id
      AND b.created_at >= start_date
      AND b.created_at <= end_date
      AND c.started_at >= start_date
      AND c.started_at <= end_date
  ) lead_times;

  -- Build result JSON
  result := jsonb_build_object(
    'period_start', start_date,
    'period_end', end_date,
    'hours_saved', round(total_hours_saved::numeric, 1),
    'lead_velocity_median_days', EXTRACT(epoch FROM lead_velocity_median) / 86400,
    'lead_velocity_p90_days', EXTRACT(epoch FROM lead_velocity_p90) / 86400,
    'tasks_completed', total_tasks_completed,
    'emails_processed', total_emails_processed,
    'calls_processed', total_calls_processed,
    'bookings_created', total_bookings_created,
    'roi_multiplier', CASE
      WHEN total_hours_saved > 0 THEN round((total_hours_saved * 50)::numeric, 0)  -- Assume $50/hour value
      ELSE 0
    END
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_roi_metrics(timestamptz, timestamptz) TO authenticated;