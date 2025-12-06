-- Cron schedule for ops-twilio-queue-worker (replace <EDGE_URL> with deployed Functions base)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('ops-twilio-queue-worker-every-minute-v2');

    PERFORM cron.schedule(
      'ops-twilio-queue-worker-every-minute-v2',
      '* * * * *',
      $$
        SELECT net.http_post(
          url := '<EDGE_URL>/functions/v1/ops-twilio-queue-worker',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization',
              'Bearer ' || coalesce(
                current_setting('app.settings.queue_worker_jwt', true),
                '<SERVICE_OR_ANON_JWT>'
              )
          ),
          body := '{}'::jsonb
        );
      $$
    );

    RAISE NOTICE 'ops-twilio-queue-worker scheduled (update app.settings.queue_worker_jwt secret)';
  ELSE
    RAISE NOTICE 'pg_cron extension not available; skipping ops-twilio-queue-worker schedule';
  END IF;
END $$;
