-- Schedule Twilio Queue Worker to run every minute
-- Processes pending Twilio API jobs with automatic retry on rate limits

-- Note: Replace <DEPLOYED_EDGE_URL> and <SERVICE_OR_ANON_JWT> with actual values
-- when deploying to production. This is a template that requires environment-specific values.

DO $$
BEGIN
  -- Only create if cron extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove existing schedule if it exists
    PERFORM cron.unschedule('ops-twilio-queue-worker-every-minute');
    
    -- Schedule the worker (update URL and auth before deploying)
    PERFORM cron.schedule(
      'ops-twilio-queue-worker-every-minute',
      '* * * * *', -- Every minute
      $$
        SELECT net.http_post(
          url := '<DEPLOYED_EDGE_URL>/functions/v1/ops-twilio-queue-worker',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer <SERVICE_OR_ANON_JWT>'
          ),
          body := '{}'::jsonb
        );
      $$
    );
    
    RAISE NOTICE 'Twilio queue worker cron job scheduled';
  ELSE
    RAISE NOTICE 'pg_cron extension not available - cron job not created';
  END IF;
END $$;

