# Phase 3: Monitoring Setup Guide

**Status:** ⚠️ PENDING VERIFICATION  
**Gate:** ⛔ BLOCKED until all monitors are active and verified

---

## Overview

This document provides step-by-step instructions for setting up production monitoring for AutoRepAi, including uptime checks, security header validation, error tracking, and infrastructure metrics.

---

## 1. Uptime & Content Monitoring

### Requirements
- **Frequency:** Every 30 seconds
- **Endpoint:** `https://yourdomain.com/` (root path)
- **Checks:** HTTP 200 status + content verification
- **Alerting:** Immediate notification on failure

### Setup Options

#### Option A: UptimeRobot (Recommended - Free tier available)

1. **Create Account:** [https://uptimerobot.com/](https://uptimerobot.com/)

2. **Add Monitor:**
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `AutoRepAi - Root Path`
   - URL: `https://yourdomain.com/`
   - Monitoring Interval: `30 seconds` (requires paid plan; free is 5 min)
   - Monitor Timeout: `30 seconds`
   - **Advanced Settings:**
     - HTTP Method: `HEAD` or `GET`
     - Expected Status Code: `200`
     - Keyword Exists: `<!doctype html>` (or unique app identifier)
     - Alert When: `Keyword not found` or `Status code not 200`

3. **Configure Alerts:**
   - Add alert contacts (email, SMS, Slack, PagerDuty)
   - Alert threshold: `Notify immediately on first failure`

4. **Verification:**
   - Trigger a test failure (temporarily break the site)
   - Confirm alert is received within 30 seconds

**📸 Screenshot Required:** `uptime-monitor-config.png` - Monitor settings showing 30s interval and keyword check

---

#### Option B: Pingdom

1. **Create Account:** [https://www.pingdom.com/](https://www.pingdom.com/)

2. **Add Uptime Check:**
   - Type: `Uptime`
   - Name: `AutoRepAi Root`
   - URL: `https://yourdomain.com/`
   - Check Interval: `30 seconds` (requires paid plan)
   - Response Should Contain: `<!doctype html>` or app-specific text

3. **Configure Alerting:**
   - Integration: Email, Slack, PagerDuty, etc.
   - When to Alert: `Down`
   - Alert after: `1 failure`

**📸 Screenshot Required:** `pingdom-uptime-check.png`

---

## 2. Security Header Sentinel

### Requirements
- **Endpoints:** `/` and `/404` (or any non-existent path)
- **Check Frequency:** Every 5 minutes minimum
- **Alert Conditions:**
  - `X-Frame-Options` header is present (BAD - blocks embeds)
  - `Content-Security-Policy` header lacks `frame-ancestors` directive
- **Alerting:** Email + Slack immediate

### Setup: Custom Header Monitor

#### Option A: Checkly (Recommended for header checks)

1. **Create Account:** [https://www.checklyhq.com/](https://www.checklyhq.com/)

2. **Create API Check for Root Path:**
   ```javascript
   // Check name: Security Headers - Root Path
   const { expect } = require('expect');
   const axios = require('axios');

   const response = await axios.get('https://yourdomain.com/', {
     maxRedirects: 0,
     validateStatus: () => true
   });

   // CRITICAL: X-Frame-Options must NOT be present
   expect(response.headers['x-frame-options']).toBeUndefined();

   // CRITICAL: CSP must contain frame-ancestors
   const csp = response.headers['content-security-policy'] || '';
   expect(csp).toMatch(/frame-ancestors/i);

   // Verify frame-ancestors is permissive (not 'none')
   if (csp.match(/frame-ancestors/i)) {
     expect(csp).not.toMatch(/frame-ancestors\s+'none'/i);
   }

   console.log('✅ Root path security headers valid');
   ```

3. **Create API Check for 404 Path:**
   ```javascript
   // Check name: Security Headers - 404 Path
   const { expect } = require('expect');
   const axios = require('axios');

   const response = await axios.get('https://yourdomain.com/nonexistent-page-test', {
     maxRedirects: 0,
     validateStatus: () => true
   });

   // Should be 404 but still have correct headers
   expect(response.status).toBe(404);

   // CRITICAL: X-Frame-Options must NOT be present
   expect(response.headers['x-frame-options']).toBeUndefined();

   // CRITICAL: CSP must contain frame-ancestors
   const csp = response.headers['content-security-policy'] || '';
   expect(csp).toMatch(/frame-ancestors/i);

   console.log('✅ 404 path security headers valid');
   ```

4. **Schedule:**
   - Frequency: `Every 5 minutes`
   - Locations: At least 2 (e.g., US-East, EU-West)
   - Retry: `1 retry on failure`

5. **Configure Alerts:**
   - On Failure: Email + Slack webhook
   - Escalation: After 2 consecutive failures

**📸 Screenshot Required:** 
- `checkly-header-sentinel-root.png` - Root path check configuration
- `checkly-header-sentinel-404.png` - 404 path check configuration
- `checkly-alert-config.png` - Alert integration settings

---

#### Option B: Better Uptime + Custom Script

1. **Set up Better Uptime:** [https://betteruptime.com/](https://betteruptime.com/)

2. **Create HTTP Monitor:**
   - URL: `https://yourdomain.com/`
   - Interval: `5 minutes`
   - Response Headers Check: Custom assertion (if supported)

3. **Deploy Header Check Script:**
   Create a serverless function or GitHub Action that runs every 5 minutes:

   ```javascript
   // .github/workflows/header-sentinel.yml
   name: Security Header Sentinel
   on:
     schedule:
       - cron: '*/5 * * * *'  # Every 5 minutes
     workflow_dispatch:

   jobs:
     check-headers:
       runs-on: ubuntu-latest
       steps:
         - name: Check Root Path Headers
           run: |
             HEADERS=$(curl -s -I https://yourdomain.com/)
             
             # Fail if X-Frame-Options present
             if echo "$HEADERS" | grep -qi "x-frame-options"; then
               echo "❌ X-Frame-Options header detected - will block embeds!"
               exit 1
             fi
             
             # Fail if frame-ancestors not in CSP
             if ! echo "$HEADERS" | grep -i "content-security-policy" | grep -qi "frame-ancestors"; then
               echo "❌ CSP lacks frame-ancestors directive!"
               exit 1
             fi
             
             echo "✅ Root path headers valid"

         - name: Check 404 Path Headers
           run: |
             HEADERS=$(curl -s -I https://yourdomain.com/test-404-sentinel)
             
             if echo "$HEADERS" | grep -qi "x-frame-options"; then
               echo "❌ X-Frame-Options on 404!"
               exit 1
             fi
             
             if ! echo "$HEADERS" | grep -i "content-security-policy" | grep -qi "frame-ancestors"; then
               echo "❌ CSP lacks frame-ancestors on 404!"
               exit 1
             fi
             
             echo "✅ 404 headers valid"

         - name: Alert on Failure
           if: failure()
           uses: 8398a7/action-slack@v3
           with:
             status: ${{ job.status }}
             text: '🚨 Security Header Sentinel FAILED - Embed blocking detected!'
             webhook_url: ${{ secrets.SLACK_WEBHOOK }}
   ```

**📸 Screenshot Required:** `header-sentinel-github-action.png` - GitHub Action workflow run history

---

## 3. Client/Server Error Tracking

### Requirements
- **Threshold:** Alert if error rate ≥ 1% over 5-minute window
- **Coverage:** Frontend errors, API errors, edge function errors
- **Alerting:** Slack + Email when threshold exceeded

### Setup: Error Tracking Service

#### Option A: Sentry (Recommended)

1. **Create Project:** [https://sentry.io/](https://sentry.io/)

2. **Install Sentry SDK:**
   ```bash
   npm install @sentry/react
   ```

3. **Configure in Frontend (`src/main.tsx`):**
   ```typescript
   import * as Sentry from "@sentry/react";

   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     environment: "production",
     integrations: [
       new Sentry.BrowserTracing(),
       new Sentry.Replay({
         maskAllText: true,
         blockAllMedia: true,
       }),
     ],
     tracesSampleRate: 0.1, // 10% of transactions
     replaysSessionSampleRate: 0.1,
     replaysOnErrorSampleRate: 1.0,
   });
   ```

4. **Configure Alert Rules:**
   - Navigate to: **Alerts** → **Create Alert**
   - Alert Name: `Error Rate Threshold Exceeded`
   - Conditions:
     - When: `The event frequency for a project`
     - Is: `above 1%`
     - In: `5 minutes`
     - For the filter: `All events`
   - Actions:
     - Send notification to: `Email`, `Slack`
     - Send notification every: `5 minutes` (to avoid spam)

5. **Edge Function Integration:**
   Add to each Supabase Edge Function:
   ```typescript
   // At top of edge function
   const SENTRY_DSN = Deno.env.get('SENTRY_DSN');
   
   try {
     // Function logic
   } catch (error) {
     // Log to Sentry
     if (SENTRY_DSN) {
       await fetch(SENTRY_DSN, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           level: 'error',
           message: error.message,
           extra: { function: 'function-name' }
         })
       });
     }
     throw error;
   }
   ```

**📸 Screenshots Required:**
- `sentry-project-setup.png` - Project dashboard
- `sentry-alert-rule.png` - Error rate alert configuration
- `sentry-integration.png` - Slack/Email integration settings

---

#### Option B: LogRocket or DataDog RUM

Similar setup with error rate alerting configured via their dashboards.

**📸 Screenshot Required:** `error-tracking-dashboard.png`

---

## 4. Supabase Infrastructure Metrics

### Requirements
- **Database CPU:** Alert if >80% for 5 consecutive minutes
- **5xx Errors:** Alert if >1% over 5 minutes
- **Auth Rate Limit:** Alert on spike (>50 rate-limit events in 1 minute)

### Setup: Supabase Dashboard + External Monitoring

#### A. Native Supabase Alerts (if available in your plan)

1. **Navigate to:** [Supabase Dashboard - Reports](https://supabase.com/dashboard/project/niorocndzcflrwdrofsp/reports)

2. **Database CPU Alert:**
   - If your plan supports it, create a custom alert for `Database CPU Usage`
   - Threshold: `>80%`
   - Duration: `5 minutes`
   - Notification: Email

3. **Check Limitations:**
   - Many Supabase plans do NOT include custom alerting
   - You may need to use external monitoring (see below)

**📸 Screenshot Required:** `supabase-reports-dashboard.png` - Reports page showing metrics

---

#### B. External Monitoring via Supabase API (Recommended)

Create a monitoring script that polls Supabase metrics and triggers alerts:

**GitHub Action Example (`monitor-supabase.yml`):**

```yaml
name: Supabase Metrics Monitor
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Check Database CPU
        id: cpu
        run: |
          # Query Supabase analytics (requires service role key)
          CPU=$(curl -s -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            "https://niorocndzcflrwdrofsp.supabase.co/rest/v1/rpc/get_db_cpu_avg?minutes=5" | jq -r '.cpu_avg')
          
          echo "cpu=$CPU" >> $GITHUB_OUTPUT
          
          if (( $(echo "$CPU > 80" | bc -l) )); then
            echo "⚠️ Database CPU at ${CPU}% (threshold: 80%)"
            exit 1
          fi

      - name: Check 5xx Error Rate
        id: errors
        run: |
          # Query edge function logs for 5xx errors
          ERROR_RATE=$(curl -s -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            "https://niorocndzcflrwdrofsp.supabase.co/rest/v1/rpc/get_error_rate?minutes=5" | jq -r '.rate')
          
          echo "error_rate=$ERROR_RATE" >> $GITHUB_OUTPUT
          
          if (( $(echo "$ERROR_RATE > 1" | bc -l) )); then
            echo "🚨 5xx error rate at ${ERROR_RATE}% (threshold: 1%)"
            exit 1
          fi

      - name: Check Auth Rate Limit Events
        id: auth
        run: |
          # Query auth logs for rate limit events
          RATE_LIMIT_COUNT=$(curl -s -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            "https://niorocndzcflrwdrofsp.supabase.co/rest/v1/auth_logs?level=eq.error&msg=cs.*rate%20limit*&timestamp=gte.$(date -u -d '1 minute ago' +%Y-%m-%dT%H:%M:%S.000Z)" \
            | jq '. | length')
          
          echo "rate_limit_count=$RATE_LIMIT_COUNT" >> $GITHUB_OUTPUT
          
          if [ "$RATE_LIMIT_COUNT" -gt 50 ]; then
            echo "⚠️ Auth rate limit spike: ${RATE_LIMIT_COUNT} events in last minute"
            exit 1
          fi

      - name: Send Alert on Failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author
          text: |
            🚨 Supabase Infrastructure Alert
            - DB CPU: ${{ steps.cpu.outputs.cpu }}%
            - 5xx Rate: ${{ steps.errors.outputs.error_rate }}%
            - Auth Rate Limits: ${{ steps.auth.outputs.rate_limit_count }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Note:** The above example assumes custom RPC functions for metrics. You may need to:
1. Use Supabase's built-in analytics API (if available)
2. Query logs directly via SQL
3. Use a third-party monitoring service with Supabase integration

**📸 Screenshots Required:**
- `supabase-cpu-metrics.png` - Database CPU usage graph
- `supabase-error-logs.png` - Edge function error logs
- `supabase-auth-logs.png` - Auth rate limit events

---

#### C. Alternative: DataDog or New Relic Integration

1. **Set up Supabase → DataDog integration**
2. **Create monitors:**
   - Database CPU > 80% for 5 minutes
   - API error rate > 1% over 5 minutes
   - Auth rate limit spike > 50/min

**📸 Screenshot Required:** `datadog-supabase-monitors.png`

---

## Verification Checklist

### Uptime Monitoring ✅
- [ ] 30-second interval configured (or fastest available)
- [ ] Content keyword check active (e.g., `<!doctype html>`)
- [ ] Alert sent to email/Slack
- [ ] Test failure triggered and alert received

### Security Header Sentinel ✅
- [ ] Root path (`/`) monitored every 5 minutes
- [ ] 404 path monitored every 5 minutes
- [ ] Alert fires if `X-Frame-Options` detected
- [ ] Alert fires if `frame-ancestors` missing from CSP
- [ ] Test triggered by temporarily adding bad header

### Error Tracking ✅
- [ ] Sentry (or equivalent) integrated in frontend
- [ ] Edge functions report errors to tracking service
- [ ] Alert configured for ≥1% error rate over 5 minutes
- [ ] Test triggered by forcing errors and verifying alert

### Supabase Metrics ✅
- [ ] Database CPU monitoring active (>80% threshold)
- [ ] 5xx error rate monitoring active (>1% threshold)
- [ ] Auth rate-limit spike detection active (>50/min)
- [ ] Alerts configured and tested

---

## Test Results

### Date: ________________

| Monitor | Status | Evidence |
|---------|--------|----------|
| Uptime Check | ⚠️ PENDING | Screenshot: ____________ |
| Security Headers (/) | ⚠️ PENDING | Screenshot: ____________ |
| Security Headers (404) | ⚠️ PENDING | Screenshot: ____________ |
| Error Tracking | ⚠️ PENDING | Screenshot: ____________ |
| DB CPU Alert | ⚠️ PENDING | Screenshot: ____________ |
| 5xx Error Alert | ⚠️ PENDING | Screenshot: ____________ |
| Auth Rate Limit Alert | ⚠️ PENDING | Screenshot: ____________ |

---

## Gate Status

**Current Status:** ⛔ **BLOCKED**

**Required to Pass:**
- All monitors active and verified via screenshots
- At least one successful test alert for each monitor type
- All checks documented in Phase3-Alert-Policies.md

**Sign-Off:**
- Engineer: ________________ Date: ________
- Security Review: ________________ Date: ________

---

## Additional Resources

- [Supabase Monitoring Best Practices](https://supabase.com/docs/guides/platform/metrics)
- [Sentry Alerting Guide](https://docs.sentry.io/product/alerts/)
- [UptimeRobot Documentation](https://uptimerobot.com/help)
- [Checkly API Monitoring](https://www.checklyhq.com/docs/)
