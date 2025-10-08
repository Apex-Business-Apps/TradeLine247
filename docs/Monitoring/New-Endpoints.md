# Monitoring Coverage for New Features
**Date:** 2025-10-08  
**Status:** ⏳ PENDING CONFIGURATION

## Overview
This document specifies monitoring requirements for newly implemented features including telephony, OAuth integrations, and vehicle search.

## Required Monitoring Tools

### Options
1. **UptimeRobot** (Free tier: 50 monitors, 5-min checks)
2. **Checkly** (Free tier: 3 checks, 5-min interval)
3. **Pingdom** (Paid)
4. **StatusCake** (Free tier: 10 checks, 5-min interval)
5. **Custom solution** (Supabase pg_cron)

**Recommendation:** UptimeRobot for basic uptime + Custom pg_cron for detailed checks

---

## 1. Uptime / Content Check

### Monitor: Homepage Health
**URL:** `https://8c580ccb-d2ed-4900-a1da-f3b4f211efc8.lovableproject.com/`  
**Interval:** 30 seconds  
**Method:** HTTP GET  
**Expected Status:** 200 OK  
**Content Check:** Page title contains "AutoRepAi"

#### UptimeRobot Configuration
```json
{
  "friendly_name": "AutoRepAi - Homepage",
  "url": "https://8c580ccb-d2ed-4900-a1da-f3b4f211efc8.lovableproject.com/",
  "type": "http",
  "interval": 30,
  "http_method": "get",
  "keyword_type": "exists",
  "keyword_value": "AutoRepAi"
}
```

#### Success Criteria
- ✅ Monitor created
- ✅ Status: UP
- ✅ Response time < 2000ms
- ✅ Content check passing

#### Alert Configuration
- **Down:** Notify immediately
- **Up:** Notify when recovered
- **Slow:** Notify if response > 5000ms

#### Alert Channels
- Email: devops@yourdomain.com
- Slack: #alerts (webhook)
- SMS: (optional, paid feature)

---

## 2. API Health Checks

### 2.1 Vehicle Search Endpoint

#### Monitor: Vehicle Search API
**Endpoint:** `https://niorocndzcflrwdrofsp.supabase.co/functions/v1/vehicles-search`  
**Method:** GET  
**Interval:** 5 minutes  
**Auth:** Bearer token (anon key or user JWT)

#### Test Query
```bash
curl -X GET \
  'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/vehicles-search?q=Honda&limit=5' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

#### Expected Response
```json
{
  "items": [...],
  "nextOffset": 5,
  "count": 5,
  "queryTime": 250
}
```

#### Checkly Script (Synthetic Monitoring)
```javascript
const { check } = require('@checkly/core');
const axios = require('axios');

check('Vehicle Search API', async () => {
  const response = await axios.get(
    'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/vehicles-search?q=Honda&limit=5',
    {
      headers: {
        'Authorization': 'Bearer ' + process.env.ANON_KEY,
        'apikey': process.env.ANON_KEY
      }
    }
  );
  
  expect(response.status).toBe(200);
  expect(response.data).toHaveProperty('items');
  expect(response.data.queryTime).toBeLessThan(1000);
  expect(response.headers['x-query-time-ms']).toBeDefined();
});
```

#### Alert Thresholds
- **Error rate:** ≥ 1% over 5 minutes → Critical alert
- **P95 latency:** > 800ms → Warning alert
- **Availability:** < 99.5% → Critical alert

---

### 2.2 Telephony Webhooks

#### Monitor: Twilio Voice Webhook Health
**Note:** Cannot directly monitor webhooks (Twilio-initiated).  
**Strategy:** Monitor database for recent call logs.

#### Database Query Check (via pg_cron)
```sql
-- Schedule: Every 5 minutes
SELECT cron.schedule(
  'check-voice-webhook-health',
  '*/5 * * * *', -- Every 5 minutes
  $$
  DO $$
  DECLARE
    recent_calls INTEGER;
  BEGIN
    -- Count calls in last hour
    SELECT COUNT(*) INTO recent_calls
    FROM call_logs
    WHERE created_at > NOW() - INTERVAL '1 hour';
    
    -- If we expect at least 1 call per hour and have 0, alert
    -- (Adjust based on expected volume)
    IF recent_calls = 0 THEN
      -- Log potential issue
      INSERT INTO monitoring_alerts (service, severity, message)
      VALUES ('voice_webhook', 'warning', 'No calls logged in past hour');
    END IF;
  END $$;
  $$
);
```

#### Alternative: Synthetic Call Test
**Method:** Scheduled outbound call via Twilio API to test number  
**Interval:** Every 6 hours  
**Expected:** Call log entry created within 30 seconds

#### Metrics to Track
- **Webhook response time:** < 500ms (from Twilio logs)
- **Success rate:** > 99% (2xx responses)
- **Call log creation:** 100% of inbound calls logged

---

#### Monitor: Twilio SMS Webhook Health
**Strategy:** Same as voice webhook (monitor database)

```sql
SELECT cron.schedule(
  'check-sms-webhook-health',
  '*/5 * * * *',
  $$
  DO $$
  DECLARE
    recent_sms INTEGER;
  BEGIN
    SELECT COUNT(*) INTO recent_sms
    FROM sms_messages
    WHERE created_at > NOW() - INTERVAL '1 hour'
      AND direction = 'inbound';
    
    -- Alert if 0 inbound SMS in last hour (adjust threshold)
    IF recent_sms = 0 THEN
      INSERT INTO monitoring_alerts (service, severity, message)
      VALUES ('sms_webhook', 'info', 'No inbound SMS in past hour');
    END IF;
  END $$;
  $$
);
```

---

### 2.3 OAuth Callback Health

#### Monitor: OAuth Callback Endpoint
**Endpoint:** `https://niorocndzcflrwdrofsp.supabase.co/functions/v1/oauth-callback`  
**Method:** GET (with invalid params to test error handling)  
**Interval:** 5 minutes

#### Health Check Request
```bash
curl -X GET \
  'https://niorocndzcflrwdrofsp.supabase.co/functions/v1/oauth-callback?provider=google&state=test' \
  -H 'Content-Type: application/json'
```

#### Expected: 400 Bad Request (missing code parameter)
**Why:** Validates endpoint is responding, even to invalid requests

#### Metrics
- **Endpoint availability:** 100%
- **Response time:** < 500ms
- **Error rate:** Track 5xx errors (should be 0%)

#### Real OAuth Flow Monitoring
**Method:** Track successful OAuth connections in database

```sql
-- Query for monitoring dashboard
SELECT 
  provider,
  COUNT(*) as connections_today,
  AVG(EXTRACT(EPOCH FROM (created_at - created_at))) as avg_connection_time
FROM oauth_tokens
WHERE created_at > CURRENT_DATE
GROUP BY provider;
```

---

## 3. Error Rate Alerts

### Application Error Monitoring
**Tool:** Supabase Logs + Custom Dashboard

#### Query: Edge Function Errors (Last 5 Minutes)
```sql
-- Run via Supabase Analytics
SELECT 
  function_id,
  COUNT(*) as error_count,
  AVG(execution_time_ms) as avg_latency
FROM function_edge_logs
CROSS JOIN UNNEST(metadata) as m
CROSS JOIN UNNEST(m.response) as response
WHERE timestamp > NOW() - INTERVAL '5 minutes'
  AND response.status_code >= 500
GROUP BY function_id
HAVING COUNT(*) > 0;
```

#### Alert Rule
```javascript
// Pseudocode for alert logic
if (error_count >= 5 in last 5 minutes) {
  sendAlert({
    severity: 'critical',
    title: 'High error rate detected',
    message: `${function_id} has ${error_count} 5xx errors`,
    channel: 'slack'
  });
}
```

### Per-Endpoint Error Thresholds

| Endpoint | Error Rate Threshold | Time Window | Alert Level |
|----------|---------------------|-------------|-------------|
| vehicles-search | ≥ 1% | 5 minutes | Critical |
| send-sms | ≥ 0.5% | 5 minutes | Critical |
| twilio-voice | ≥ 0.5% | 5 minutes | Warning |
| twilio-sms | ≥ 0.5% | 5 minutes | Warning |
| oauth-callback | ≥ 1% | 5 minutes | Warning |

### Client-Side Error Tracking
**Tool:** Sentry (optional) or custom logging

```typescript
// src/lib/observability/errorTracking.ts
export function logError(error: Error, context: Record<string, any>) {
  // Send to error tracking service
  console.error('Application error:', error, context);
  
  // In production, send to Sentry or similar
  if (import.meta.env.PROD) {
    // Sentry.captureException(error, { extra: context });
  }
}
```

---

## 4. Latency Monitoring

### 4.1 Vehicle Search Latency

#### Target Thresholds
- **p50:** < 200ms
- **p95:** < 500ms
- **p99:** < 800ms

#### Monitoring Query (Supabase Analytics)
```sql
SELECT 
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY m.execution_time_ms) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY m.execution_time_ms) as p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY m.execution_time_ms) as p99,
  MAX(m.execution_time_ms) as max_latency
FROM function_edge_logs
CROSS JOIN UNNEST(metadata) as m
WHERE function_id = 'vehicles-search'
  AND timestamp > NOW() - INTERVAL '1 hour';
```

#### Alert Rules
- **Warning:** p95 > 500ms for 5 consecutive minutes
- **Critical:** p95 > 800ms for 3 consecutive minutes

---

### 4.2 Telephony Webhook Latency

#### Target: < 500ms p95
**Source:** Twilio webhook logs (external monitoring)

#### How to Access
1. Log into Twilio Console
2. Navigate to Monitor > Logs > Webhooks
3. Filter by phone number
4. Export webhook response times

#### Alert Setup in Twilio
- Configure webhook failure alerts
- Set up slow response alerts (>1000ms)

---

### 4.3 SMS Send Latency

#### Target: < 500ms API response

#### Monitoring
```sql
-- Custom logging table (create if needed)
CREATE TABLE IF NOT EXISTS sms_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  duration_ms INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query for dashboard
SELECT 
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_ms,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'success') as success_count
FROM sms_performance_log
WHERE created_at > NOW() - INTERVAL '1 hour';
```

---

## 5. Custom Monitoring Dashboard

### Option 1: Supabase Dashboard Queries
**Location:** Supabase Studio > SQL Editor

#### Saved Queries

##### System Health Overview
```sql
-- Save as: "System Health - Last Hour"
SELECT 
  'Vehicles' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as new_records,
  MAX(updated_at) as last_update
FROM vehicles
UNION ALL
SELECT 'Leads', COUNT(*), COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour'), MAX(updated_at) FROM leads
UNION ALL
SELECT 'Call Logs', COUNT(*), COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour'), MAX(created_at) FROM call_logs
UNION ALL
SELECT 'SMS Messages', COUNT(*), COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour'), MAX(created_at) FROM sms_messages;
```

##### API Performance
```sql
-- Save as: "API Performance - Last Hour"
SELECT 
  function_id,
  COUNT(*) as requests,
  COUNT(*) FILTER (WHERE response.status_code >= 500) as errors,
  ROUND(AVG(execution_time_ms)::numeric, 2) as avg_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_latency_ms
FROM function_edge_logs
CROSS JOIN UNNEST(metadata) as m
CROSS JOIN UNNEST(m.response) as response
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY function_id
ORDER BY requests DESC;
```

---

### Option 2: External Dashboard (Grafana)
**Setup:** Connect Grafana to Supabase PostgreSQL

**Metrics to Display:**
1. API request rate (requests/min)
2. Error rate (%) per endpoint
3. Latency histograms (p50, p95, p99)
4. Database connections
5. Active users
6. Recent call/SMS volumes

---

## 6. Alert Configuration

### Alert Channels

#### Email
- **Recipients:** 
  - devops@yourdomain.com
  - platform-team@yourdomain.com
- **Format:** HTML with charts
- **Throttling:** Max 1 email per 15 minutes for same alert

#### Slack
- **Webhook:** https://hooks.slack.com/services/YOUR/WEBHOOK/URL
- **Channel:** #alerts
- **Format:**
  ```
  🚨 CRITICAL: Vehicle Search API error rate at 2.5%
  Threshold: 1%
  Time: 2025-10-08 14:35:00 MST
  Dashboard: [View Details]
  ```

#### SMS (Critical Only)
- **Service:** Twilio (reuse existing account)
- **Recipients:** On-call engineer
- **Trigger:** Service completely down OR error rate > 10%

### Alert Escalation Policy
1. **Warning (Yellow):** Slack + Email
2. **Critical (Red):** Slack + Email + SMS (if after hours)
3. **Down (Black):** All channels + Page on-call

---

## Implementation Checklist

### Week 1: Basic Monitoring
- [ ] Set up UptimeRobot account
- [ ] Create homepage uptime monitor (30s interval)
- [ ] Configure email alerts
- [ ] Set up Slack webhook
- [ ] Test alert delivery

### Week 2: API Monitoring
- [ ] Create Checkly account (or alternative)
- [ ] Set up vehicle-search synthetic monitor
- [ ] Set up OAuth callback health check
- [ ] Configure latency alerts (>800ms)
- [ ] Test synthetic monitors

### Week 3: Database Monitoring
- [ ] Create monitoring_alerts table
- [ ] Set up pg_cron for webhook health checks
- [ ] Create Supabase dashboard queries
- [ ] Schedule daily health reports
- [ ] Document query access

### Week 4: Advanced Monitoring
- [ ] Set up error rate monitoring queries
- [ ] Configure Grafana (optional)
- [ ] Create runbook for common alerts
- [ ] Train team on monitoring tools
- [ ] Perform chaos engineering test

---

## Monitoring Dashboard Mock

```
┌────────────────────────────────────────────────┐
│          AutoRepAi - System Health             │
└────────────────────────────────────────────────┘

Overall Status: 🟢 OPERATIONAL

┌─────────────────────┬──────────┬──────────┬──────┐
│ Service             │ Status   │ Latency  │ Err% │
├─────────────────────┼──────────┼──────────┼──────┤
│ Homepage            │ 🟢 UP    │ 245ms    │ 0.0% │
│ Vehicle Search      │ 🟢 UP    │ 312ms    │ 0.1% │
│ Voice Webhook       │ 🟢 UP    │ 185ms    │ 0.0% │
│ SMS Webhook         │ 🟢 UP    │ 198ms    │ 0.0% │
│ OAuth Callback      │ 🟢 UP    │ 421ms    │ 0.0% │
│ Send SMS            │ 🟢 UP    │ 476ms    │ 0.2% │
└─────────────────────┴──────────┴──────────┴──────┘

Recent Activity (Last Hour):
  • 1,247 vehicle searches
  • 14 calls received
  • 23 SMS sent/received
  • 2 OAuth connections

🔔 Recent Alerts (Last 24h): None
```

---

## Cost Estimate

### Free Tier Options
- **UptimeRobot:** 50 monitors, 5-min checks (Free)
- **StatusCake:** 10 monitors, 5-min checks (Free)
- **Supabase pg_cron:** Included (Free)
- **Supabase Analytics:** Included (Free)
- **Slack:** Webhooks included (Free)

### Paid Options (Optional)
- **Checkly:** $7/month (10 checks, 1-min interval)
- **Pingdom:** $10/month (10 checks, 1-min interval)
- **PagerDuty:** $21/user/month (on-call scheduling)
- **Grafana Cloud:** $29/month (advanced dashboards)

**Recommendation:** Start with free tier (UptimeRobot + pg_cron + Supabase queries)

---

## Pass Criteria

| Monitor | Status | Notes |
|---------|--------|-------|
| Homepage uptime (30s) | ⏳ PENDING | Requires UptimeRobot account |
| Vehicle search API (5min) | ⏳ PENDING | Requires Checkly or alternative |
| Telephony webhook health | ⏳ PENDING | Requires pg_cron setup |
| OAuth callback health | ⏳ PENDING | Requires Checkly or alternative |
| Error rate alerts (≥1%) | ⏳ PENDING | Requires Supabase query schedule |
| Latency alerts (>800ms) | ⏳ PENDING | Requires alert configuration |
| Email alerts | ⏳ PENDING | Requires SMTP/service setup |
| Slack alerts | ⏳ PENDING | Requires webhook configuration |

**Overall:** ⏳ PENDING CONFIGURATION

---

## Next Steps
1. Create UptimeRobot account
2. Set up homepage monitor
3. Configure Slack webhook
4. Create pg_cron health checks
5. Test all alert channels
6. Document monitoring runbook

**Status:** ⏳ PENDING  
**Blocker:** External monitoring accounts needed  
**Owner:** DevOps team  
**Next:** PROMPT 7 (E2E Tests)
