# Phase 6: Production Monitoring & Alerting

**Status:** 🔴 **BLOCKED - MANUAL SETUP REQUIRED**  
**Date:** 2025-10-07  
**Location:** America/Edmonton

---

## 🎯 Objective

Deploy comprehensive production monitoring with automated alerting for:
1. **Uptime/Content Monitoring**: 30-second checks on root path
2. **Security Header Sentinel**: Detect anti-embed header regressions
3. **Error Rate Monitoring**: Track client/server error rates
4. **Supabase Metrics**: Monitor database CPU, 5xx errors, auth rate limits

---

## 📊 Monitoring Requirements

### 1. Uptime & Content Monitoring

**Requirement:**
- Monitor: `https://www.autorepai.ca/`
- Frequency: Every 30 seconds
- Success Criteria: HTTP 200 + expected content present
- Alert Threshold: 2 consecutive failures (1 minute downtime)

**Recommended Tools:**
- **UptimeRobot** (free tier: 50 monitors, 5-minute checks)
- **Pingdom** (paid: $10/month, 1-minute checks)
- **BetterUptime** (free tier: 3 monitors, 30-second checks) ✅ RECOMMENDED

**Setup Steps (BetterUptime):**
1. Sign up at https://betteruptime.com
2. Create new monitor:
   - **URL**: `https://www.autorepai.ca/`
   - **Name**: AutoRepAI Production Root
   - **Check Frequency**: 30 seconds
   - **Content Check**: Verify `<title>` contains "AutoRepAI"
   - **Alerts**: Email + Slack (optional)
3. Configure alert policy:
   - Trigger: 2 consecutive failures
   - Escalation: After 5 minutes, escalate to phone/SMS

**Evidence Required:**
- Screenshot of monitor configuration
- Screenshot of monitor dashboard showing GREEN status
- Test alert (trigger manually and confirm receipt)

---

### 2. Security Header Sentinel

**Requirement:**
- Monitor: `X-Frame-Options` and `frame-ancestors` in CSP
- Endpoints: `/`, `/404`, `/auth`, `/dashboard`
- Frequency: Every 5 minutes
- Alert on:
  - `X-Frame-Options` header detected (DENY or SAMEORIGIN)
  - `frame-ancestors` directive missing or changed

**Recommended Tools:**
- **Checkly** (API monitoring with custom assertions) ✅ RECOMMENDED
- **Custom Script** (GitHub Actions + curl)

**Setup Option A: Checkly (Recommended)**

1. Sign up at https://checkly.com
2. Create API Check:
   - **URL**: `https://www.autorepai.ca/`
   - **Method**: HEAD
   - **Frequency**: 5 minutes
   - **Assertions**:
     ```javascript
     // Assert X-Frame-Options is NOT present
     expect(response.headers['x-frame-options']).toBeUndefined();
     
     // Assert CSP contains frame-ancestors
     const csp = response.headers['content-security-policy'];
     expect(csp).toContain('frame-ancestors');
     expect(csp).toContain('lovable.app');
     ```
3. Repeat for `/404`, `/auth` endpoints
4. Configure alert channel (Email/Slack)

**Setup Option B: GitHub Actions (Self-Hosted)**

Create `.github/workflows/header-sentinel.yml`:
```yaml
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
          HEADERS=$(curl -sI https://www.autorepai.ca/)
          
          # Fail if X-Frame-Options present
          if echo "$HEADERS" | grep -i "x-frame-options"; then
            echo "ERROR: X-Frame-Options header detected!"
            exit 1
          fi
          
          # Fail if frame-ancestors missing
          if ! echo "$HEADERS" | grep -i "frame-ancestors"; then
            echo "ERROR: frame-ancestors directive missing in CSP!"
            exit 1
          fi
          
          echo "✅ Headers validated successfully"
      
      - name: Send Alert on Failure
        if: failure()
        uses: dawidd6/action-send-mail@v3
        with:
          server_address: smtp.gmail.com
          server_port: 587
          username: ${{ secrets.ALERT_EMAIL }}
          password: ${{ secrets.ALERT_EMAIL_PASSWORD }}
          to: devops@autorepai.ca
          from: alerts@autorepai.ca
          subject: 🚨 Security Header Regression Detected
          body: X-Frame-Options or frame-ancestors CSP directive changed on production!
```

**Evidence Required:**
- Screenshot of Checkly dashboard or GitHub Actions workflow runs
- Screenshot of alert configuration
- Test alert confirmation

---

### 3. Error Rate Monitoring

**Requirement:**
- Monitor: Frontend errors (console.error, unhandled exceptions)
- Monitor: Backend errors (edge function failures, API 5xx)
- Threshold: > 1% error rate over 5 minutes
- Alert: Email + Slack

**Recommended Tool: Sentry** ✅ RECOMMENDED

**Setup Steps:**

1. Sign up at https://sentry.io (free tier: 5K events/month)

2. **Install Sentry SDK (Frontend)**:
   ```bash
   npm install @sentry/react
   ```

3. **Configure in src/main.tsx**:
   ```typescript
   import * as Sentry from "@sentry/react";

   Sentry.init({
     dsn: "https://your-dsn@sentry.io/project-id",
     environment: "production",
     tracesSampleRate: 0.1,
     beforeSend(event) {
       // Filter out known non-critical errors
       if (event.message?.includes('ResizeObserver')) {
         return null;
       }
       return event;
     }
   });
   ```

4. **Configure Edge Functions Monitoring**:
   Add to each edge function:
   ```typescript
   import * as Sentry from "https://deno.land/x/sentry/index.ts";

   Sentry.init({
     dsn: Deno.env.get('SENTRY_DSN'),
     tracesSampleRate: 0.1,
   });
   ```

5. **Set Alert Rule**:
   - Navigate to Sentry → Alerts → Create Alert
   - Condition: Error count > 50 in 5 minutes
   - Action: Send email to devops@autorepai.ca

**Evidence Required:**
- Screenshot of Sentry project dashboard
- Screenshot of alert rule configuration
- Test error sent and captured in Sentry

---

### 4. Supabase Infrastructure Monitoring

**Requirement:**
- **Database CPU**: Alert if > 80% for 5 minutes
- **5xx Error Rate**: Alert if > 5 errors/minute
- **Auth Rate Limit Spike**: Alert if auth failures > 100/minute

**Recommended Approach:**
1. **Native Supabase Alerts** (if available in dashboard)
2. **External Monitoring via API** (custom script)

**Setup Option A: Supabase Dashboard (Manual)**

1. Navigate to https://supabase.com/dashboard/project/niorocndzcflrwdrofsp
2. Go to **Settings** → **Integrations** → **Alerts**
3. Configure:
   - Database CPU > 80% for 5 minutes
   - API Error Rate > 1% for 5 minutes
   - Auth Failure Rate > 100/minute

**Setup Option B: Custom Monitoring Script**

Create `.github/workflows/supabase-metrics.yml`:
```yaml
name: Supabase Metrics Monitor

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  check-supabase:
    runs-on: ubuntu-latest
    steps:
      - name: Check Database CPU
        run: |
          # Query Supabase metrics API (requires service role key)
          RESPONSE=$(curl -s "https://niorocndzcflrwdrofsp.supabase.co/rest/v1/rpc/get_db_metrics" \
            -H "apikey: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}")
          
          CPU=$(echo $RESPONSE | jq '.cpu_usage')
          
          if (( $(echo "$CPU > 80" | bc -l) )); then
            echo "🚨 Database CPU at ${CPU}%"
            # Send alert
            exit 1
          fi
          
          echo "✅ Database CPU normal: ${CPU}%"
```

**Evidence Required:**
- Screenshot of Supabase alert configuration
- Screenshot of metrics dashboard
- Test alert confirmation

---

## 📋 Monitoring Checklist

### Uptime Monitoring
- [ ] **Tool**: BetterUptime/UptimeRobot/Pingdom account created
- [ ] **Monitor**: Root path (`https://www.autorepai.ca/`) configured
- [ ] **Frequency**: 30-second checks enabled
- [ ] **Content Check**: Title verification enabled
- [ ] **Alerts**: Email alert configured
- [ ] **Test**: Manual alert triggered and received
- [ ] **Evidence**: Screenshots attached

### Security Header Sentinel
- [ ] **Tool**: Checkly account created OR GitHub Actions workflow deployed
- [ ] **Endpoints**: /, /404, /auth monitored
- [ ] **Frequency**: 5-minute checks
- [ ] **Assertions**: X-Frame-Options absence verified
- [ ] **Assertions**: frame-ancestors presence verified
- [ ] **Alerts**: Email/Slack configured
- [ ] **Test**: Simulated header regression tested
- [ ] **Evidence**: Screenshots attached

### Error Rate Monitoring
- [ ] **Tool**: Sentry account created
- [ ] **Frontend SDK**: Installed and configured in src/main.tsx
- [ ] **Edge Functions**: Sentry added to critical functions
- [ ] **Alert Rule**: > 1% error rate configured
- [ ] **Alert Channel**: Email + Slack configured
- [ ] **Test**: Test error sent and captured
- [ ] **Evidence**: Screenshots attached

### Supabase Metrics
- [ ] **DB CPU**: Alert configured for > 80%
- [ ] **5xx Errors**: Alert configured for > 5/min
- [ ] **Auth Rate Limit**: Alert configured for > 100 failures/min
- [ ] **Tool**: Supabase dashboard OR custom script deployed
- [ ] **Alerts**: Email configured
- [ ] **Evidence**: Screenshots attached

---

## ✅ Gate Approval Criteria

**Gate Status:** 🔴 **BLOCKED**

This gate turns **GREEN** when:

1. ✅ Uptime monitor active and reporting GREEN
2. ✅ Security header sentinel deployed and passing
3. ✅ Error tracking (Sentry) installed and receiving events
4. ✅ Supabase metrics monitored (DB CPU, 5xx, auth)
5. ✅ All alert channels tested (email received)
6. ✅ All monitoring dashboards accessible
7. ✅ Documentation updated with monitor URLs
8. ✅ All screenshots and evidence attached to this document

---

## 📸 Evidence Attachments

### Uptime Monitor Dashboard
```
[INSERT: Screenshot of BetterUptime/UptimeRobot showing active monitor]
```

### Security Header Sentinel
```
[INSERT: Screenshot of Checkly dashboard or GitHub Actions workflow runs]
```

### Sentry Error Tracking
```
[INSERT: Screenshot of Sentry project dashboard with test error]
```

### Supabase Metrics
```
[INSERT: Screenshot of Supabase metrics dashboard or custom monitoring dashboard]
```

### Test Alert Email
```
[INSERT: Screenshot of alert email received in inbox]
```

---

## 🔗 Quick Access Links

Once configured, document these URLs:

- **Uptime Monitor**: https://betteruptime.com/team/[your-team]/monitors
- **Header Sentinel**: https://app.checklyhq.com/[your-account]/checks
- **Error Tracking**: https://sentry.io/organizations/[your-org]/projects/
- **Supabase Metrics**: https://supabase.com/dashboard/project/niorocndzcflrwdrofsp/reports

---

## 🔗 References

- [BetterUptime Documentation](https://betteruptime.com/docs)
- [Checkly API Monitoring](https://www.checklyhq.com/docs/api-checks/)
- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/metrics)
- [GitHub Actions Cron Syntax](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)

---

**Last Updated:** 2025-10-07  
**Next Review:** After all monitors deployed and tested  
**Sign-Off Required:** DevOps Lead, SRE Team
