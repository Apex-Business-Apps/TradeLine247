# Cron Job Setup for Batch Processing

## Overview

The batch processor should run every 30 minutes to process pending jobs in the priority queue.

## Setup Using pg_cron

### 1. Enable pg_cron Extension

First, enable the `pg_cron` extension in your Supabase project (this is done automatically in most cases).

### 2. Create Cron Job

Run this SQL to set up the 30-minute batch processing schedule:

```sql
SELECT cron.schedule(
  'batch-processor-30min',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT net.http_post(
    url:='https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/batch-processor',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo"}'::jsonb,
    body:='{"batch_size": 20}'::jsonb
  ) as request_id;
  $$
);
```

### 3. Verify Cron Job

Check that the cron job was created successfully:

```sql
SELECT * FROM cron.job;
```

### 4. Monitor Cron Execution

View cron job execution history:

```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'batch-processor-30min' 
ORDER BY start_time DESC 
LIMIT 10;
```

## Cron Schedule Patterns

The cron schedule uses standard cron syntax:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

### Common Patterns

- `*/30 * * * *` - Every 30 minutes
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 */2 * * *` - Every 2 hours
- `0 0 * * *` - Daily at midnight
- `0 9 * * 1` - Every Monday at 9 AM

## Manual Triggers

### Trigger Batch Processing Manually

```bash
curl -X POST https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/batch-processor \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo" \
  -H "Content-Type: application/json" \
  -d '{"batch_size": 20, "job_types": ["transcription", "email_notification"]}'
```

### Check Queue Status

```bash
curl https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/check-batch-status?summary=true \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo"
```

## Queue Management Functions

### Enqueue a Job

```typescript
const { data: jobId } = await supabase.rpc('enqueue_job', {
  p_job_type: 'transcription',
  p_payload: { call_sid: 'CA123', recording_url: 'https://...' },
  p_priority: 8, // 1-10, higher = more urgent
  p_tenant_id: tenantId,
  p_scheduled_for: new Date().toISOString()
});
```

### Get Queue Statistics

```typescript
const { data: stats } = await supabase.rpc('get_queue_stats');
console.log('Pending jobs:', stats[0].total_pending);
console.log('Avg processing time:', stats[0].avg_processing_time_seconds);
```

## Monitoring & Alerts

### Set Up Alerts for Queue Health

```sql
-- Alert if queue backlog exceeds 1000
SELECT 
  CASE 
    WHEN COUNT(*) > 1000 THEN 
      -- Send alert notification
      net.http_post(
        url:='YOUR_ALERT_WEBHOOK_URL',
        body:=jsonb_build_object(
          'alert', 'high_queue_backlog',
          'count', COUNT(*)
        )
      )
  END
FROM public.priority_queue
WHERE status = 'pending';
```

## Troubleshooting

### Jobs Not Processing

1. Check cron job is active: `SELECT * FROM cron.job WHERE jobname = 'batch-processor-30min'`
2. Check recent executions: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5`
3. Verify edge function logs in Supabase dashboard
4. Check for failed jobs: `SELECT * FROM priority_queue WHERE status = 'failed'`

### High Failure Rate

```sql
-- View recent failures
SELECT 
  job_type,
  COUNT(*) as failure_count,
  array_agg(DISTINCT error_message) as error_messages
FROM public.priority_queue
WHERE status = 'failed'
  AND updated_at > NOW() - INTERVAL '24 hours'
GROUP BY job_type
ORDER BY failure_count DESC;
```

### Stuck Jobs

```sql
-- Find jobs stuck in processing
SELECT *
FROM public.priority_queue
WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '1 hour'
ORDER BY started_at;
```

## Performance Tuning

### Adjust Batch Size

For high-volume periods, increase batch size:

```sql
-- Update cron job with larger batch
SELECT cron.alter_job(
  job_id,
  schedule:='*/15 * * * *', -- More frequent
  command:=$$
    SELECT net.http_post(
      url:='...',
      body:='{"batch_size": 50}'::jsonb  -- Larger batches
    );
  $$
)
FROM cron.job 
WHERE jobname = 'batch-processor-30min';
```

### Parallel Processing

For different job types, create separate cron jobs:

```sql
-- High-priority transcription processor
SELECT cron.schedule(
  'transcription-processor',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url:='...',
    body:='{"batch_size": 10, "job_types": ["transcription"]}'::jsonb
  );
  $$
);
```

## Best Practices

1. **Monitor queue depth** - Set alerts for backlog > 500
2. **Review failure patterns** - Check failed jobs daily
3. **Adjust timing** - Tune batch size and frequency based on load
4. **Test retry logic** - Ensure exponential backoff works correctly
5. **Log everything** - Enable detailed logging for debugging
6. **Set reasonable priorities** - Reserve 9-10 for true emergencies
7. **Clean up old jobs** - Archive completed jobs older than 30 days

## References

- [pg_cron Documentation](https://github.com/citusdata/pg_cron)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Priority Queue Best Practices](https://docs.lovable.dev)
