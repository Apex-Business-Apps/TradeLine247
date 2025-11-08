select cron.schedule('ops-twilio-queue-worker-every-minute','* * * * *',
$$
  select net.http_post(
    url := '<EDGE_URL>/functions/v1/ops-twilio-queue-worker',
    headers := jsonb_build_object('Content-Type','application/json'),
    body := '{}'::jsonb
  );
$$);
