# PHASE 6: Monitoring & Alerting — Detailed Report

**Date:** 2025-10-11 (America/Edmonton)  
**Status:** 🔴 NOT CONFIGURED  
**Gate:** P0 — Blocks production deploy

---

## Objective

Deploy 4-layer monitoring for production environment:
1. **Uptime Monitoring** — 30-second checks on root path with content verification
2. **Security Header Sentinel** — Automated header checks every 5 minutes (GitHub Actions)
3. **Client/Server Error Tracking** — Sentry for errors with alert on ≥1% rate/5min
4. **Supabase Infrastructure Metrics** — DB CPU, 5xx errors, auth rate limits

All monitors must be **LIVE**, **VERIFIED**, and **DOCUMENTED** before production deploy.

---

## Layer 1: Uptime Monitoring

### Service: UptimeRobot (Free Tier)

**URL:** https://uptimerobot.com/

### Configuration

| Setting              | Value                                      |
|---------------------|--------------------------------------------|
| Monitor Type        | HTTPS                                       |
| URL                 | `https://www.autorepai.ca/`                |
| Check Interval      | 30 seconds                                  |
| Timeout             | 30 seconds                                  |
| Alert When          | Down for 2 consecutive checks (1 minute)   |
| Keyword Monitoring  | Check for: `<title>AutoRepAi</title>`      |

### Alert Channels

1. **Email:** Primary contact (required)
2. **Slack:** Optional webhook for #alerts channel

### Setup Steps

1. **Create Account:**
   - Visit: https://uptimerobot.com/signUp
   - Email: [team email]
   - Verify account

2. **Add Monitor:**
   ```
   Dashboard → Add New Monitor
   Monitor Type: HTTP(s)
   Friendly Name: AutoRepAi Production
   URL: https://www.autorepai.ca/
   Monitoring Interval: 30 seconds
   ```

3. **Configure Keyword Check:**
   ```
   Advanced Settings → Keyword Exists
   Keyword: <title>AutoRepAi</title>
   ```

4. **Set Up Alerts:**
   ```
   Alert Contacts → Add
   Type: E-mail
   Email: [team email]
   ```

5. **Test Alert:**
   ```
   Monitor → Actions → Pause → Wait 1 min → Verify alert received
   Monitor → Actions → Resume
   ```

6. **Screenshot Evidence:**
   - `artifacts/phase6/uptimerobot-config.png`
   - `artifacts/phase6/uptimerobot-test-alert.png`

---

## Layer 2: Security Header Sentinel

### Service: GitHub Actions (Free for public repos)

**Repository:** AutoRepAi GitHub repo  
**Workflow File:** `.github/workflows/header-sentinel.yml`

### Workflow Configuration

```yaml
name: Security Header Sentinel

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:       # Manual trigger

jobs:
  check-headers:
    runs-on: ubuntu-latest
    steps:
      - name: Check Production Headers
        run: |
          RESPONSE=$(curl -sI https://www.autorepai.ca/)
          
          # CRITICAL: Check X-Frame-Options NOT present
          if echo "$RESPONSE" | grep -i "X-Frame-Options"; then
            echo "❌ CRITICAL: X-Frame-Options detected (blocks embedding)"
            echo "$RESPONSE"
            exit 1
          fi
          
          # CRITICAL: Check CSP frame-ancestors present
          if ! echo "$RESPONSE" | grep -i "Content-Security-Policy" | grep -i "frame-ancestors"; then
            echo "❌ CRITICAL: CSP frame-ancestors missing"
            echo "$RESPONSE"
            exit 1
          fi
          
          # Check for expected frame-ancestors domains
          if ! echo "$RESPONSE" | grep -i "frame-ancestors.*lovable\.app"; then
            echo "⚠️ WARNING: frame-ancestors missing Lovable domains"
          fi
          
          echo "✅ All security headers correct"

      - name: Alert on Failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: '🚨 Security headers check FAILED on production!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Setup Steps

1. **Create Workflow File:**
   ```bash
   mkdir -p .github/workflows
   touch .github/workflows/header-sentinel.yml
   # Paste configuration above
   ```

2. **Configure Slack Webhook (Optional):**
   ```
   GitHub → Settings → Secrets → Actions
   New repository secret:
     Name: SLACK_WEBHOOK
     Value: https://hooks.slack.com/services/T.../B.../...
   ```

3. **Enable Workflow:**
   ```
   Git commit and push
   GitHub → Actions → Verify "Security Header Sentinel" runs
   ```

4. **Test Manual Trigger:**
   ```
   GitHub → Actions → Security Header Sentinel → Run workflow
   Verify: Green check if headers correct, red X if failed
   ```

5. **Screenshot Evidence:**
   - `artifacts/phase6/github-actions-sentinel.png`
   - `artifacts/phase6/github-actions-success-log.png`

---

## Layer 3: Client/Server Error Tracking

### Service: Sentry (Error Monitoring)

**URL:** https://sentry.io/

### Setup Steps

1. **Create Sentry Account:**
   - Visit: https://sentry.io/signup/
   - Plan: Developer (free, 5k errors/month)

2. **Create Project:**
   ```
   Dashboard → Create Project
   Platform: React
   Project Name: autorepai-production
   ```

3. **Copy DSN:**
   ```
   Settings → Client Keys (DSN)
   Copy: https://abc123@o123.ingest.sentry.io/456
   ```

4. **Install Sentry SDK:**
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

5. **Configure in `src/main.tsx`:**
   ```typescript
   import * as Sentry from "@sentry/react";

   Sentry.init({
     dsn: "https://abc123@o123.ingest.sentry.io/456",
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
     environment: "production",
   });
   ```

6. **Add Error Boundary:**
   ```typescript
   // src/lib/observability/errorBoundary.tsx already exists
   // Ensure it wraps <App /> in main.tsx
   ```

7. **Configure Alert Rules:**
   ```
   Sentry → Alerts → Create Alert
   Condition: Error rate > 1% over 5 minutes
   Action: Email to [team email]
   ```

8. **Test Error Capture:**
   ```javascript
   // Temporarily add to a component:
   throw new Error("Sentry test error");
   // Verify appears in Sentry dashboard
   ```

9. **Screenshot Evidence:**
   - `artifacts/phase6/sentry-project-config.png`
   - `artifacts/phase6/sentry-alert-rule.png`
   - `artifacts/phase6/sentry-test-error.png`

---

## Layer 4: Supabase Infrastructure Metrics

### Service: Supabase Dashboard (Built-In)

**URL:** https://supabase.com/dashboard/project/niorocndzcflrwdrofsp

### Monitored Metrics

1. **Database CPU Usage**
   - Threshold: >80% for 5 minutes
   - Alert: Email from Supabase

2. **API 5xx Error Rate**
   - Threshold: >1% of requests
   - Alert: Supabase dashboard warning

3. **Auth Rate Limits**
   - Threshold: Approaching configured limits
   - Alert: Supabase dashboard warning

4. **Edge Function Errors**
   - Monitor: Logs → Functions → Error logs
   - Manual review: Daily

### Setup Steps

1. **Enable Email Notifications:**
   ```
   Supabase → Settings → Notifications
   Enable: Database alerts, API errors, Auth issues
   Email: [team email]
   ```

2. **Configure CPU Alert:**
   ```
   Supabase → Settings → Database
   CPU Alert Threshold: 80%
   Alert Window: 5 minutes
   ```

3. **Review Dashboard Widgets:**
   ```
   Supabase → Home → Project Dashboard
   Verify visible:
     - Database connections
     - API request rate
     - Storage usage
     - Function invocations
     - Auth sign-ins
   ```

4. **Set Up Log Drain (Optional):**
   ```
   Supabase → Settings → Integrations
   Add: Datadog, New Relic, or Logflare
   ```

5. **Screenshot Evidence:**
   - `artifacts/phase6/supabase-notifications-config.png`
   - `artifacts/phase6/supabase-dashboard-metrics.png`

---

## Baseline Metrics (Capture Post-Deploy)

**Record Date:** _[After Phase 10 deploy]_

| Metric                  | Baseline Value | Threshold | Status |
|-------------------------|----------------|-----------|--------|
| Uptime                  | __%            | >99.9%    | ⏳     |
| API Latency (p95)       | __ ms          | <500ms    | ⏳     |
| Database CPU            | __%            | <80%      | ⏳     |
| Error Rate              | __%            | <1%       | ⏳     |
| Auth Success Rate       | __%            | >99%      | ⏳     |
| Edge Function Success   | __%            | >99.5%    | ⏳     |

**Update this section Day 1 after production deploy.**

---

## Alert Escalation Policy

### Severity Levels

**P0 — Critical (Immediate Response)**
- Site down (uptime check fails)
- Database unavailable
- Security headers missing (`X-Frame-Options` appears)
- Data breach detected

**Action:**
- Immediate email + Slack alert
- On-call engineer responds within 15 minutes
- Escalate to CTO if not resolved in 1 hour

---

**P1 — High (15 Minutes)**
- Error rate >5%
- Database CPU >90%
- Edge function failure rate >10%

**Action:**
- Email + Slack alert
- On-call engineer investigates within 15 minutes
- Escalate if not resolved in 2 hours

---

**P2 — Medium (1 Hour)**
- Error rate >1%
- Performance degradation (p95 >500ms)
- Non-critical function failures

**Action:**
- Email alert
- Investigate within 1 hour
- Schedule fix for next business day if not urgent

---

**P3 — Low (24 Hours)**
- Warning-level issues
- Capacity planning alerts (70% CPU sustained)
- Optimization opportunities

**Action:**
- Dashboard notification only
- Review weekly
- Add to backlog

---

## Monitoring Verification Checklist

### Pre-Deployment (Do Now)

- [ ] UptimeRobot monitor created
- [ ] GitHub Actions header sentinel enabled
- [ ] Sentry DSN configured in code
- [ ] Supabase email notifications enabled
- [ ] Slack webhook configured (if using)
- [ ] Email alert recipients confirmed
- [ ] Test alerts successfully delivered

### Post-Deployment (After Phase 10)

- [ ] Verify uptime monitoring shows green
- [ ] Confirm header checks running every 5 minutes
- [ ] Check Sentry receiving browser events
- [ ] Review Supabase metrics for baseline
- [ ] Test alert delivery (pause uptime monitor)
- [ ] Document baseline metrics in this file

---

## Runbook: Incident Response

### Scenario: Site Down

**Alert Source:** UptimeRobot

**Actions:**
1. Check Supabase status: https://status.supabase.com/
2. Review edge function logs:
   ```bash
   supabase functions logs --project-ref niorocndzcflrwdrofsp
   ```
3. Verify DNS resolution:
   ```bash
   nslookup www.autorepai.ca
   ```
4. Check Lovable platform status
5. If DNS issue → Update Webnames records
6. If Supabase issue → Wait for recovery or contact support
7. If code issue → Roll back to last known good deploy

---

### Scenario: High Error Rate

**Alert Source:** Sentry

**Actions:**
1. Open Sentry dashboard → Issues → Sort by frequency
2. Identify error pattern (API call? Component render?)
3. Check network logs for failed API requests
4. Review recent deployments (was new code deployed?)
5. If API issue → Check Supabase logs
6. If client issue → Deploy hotfix or rollback
7. Monitor error rate for 10 minutes after fix

---

### Scenario: Security Header Alert

**Alert Source:** GitHub Actions

**Actions:**
1. Immediately verify headers:
   ```bash
   curl -sI https://www.autorepai.ca/ | grep -i x-frame
   ```
2. If `X-Frame-Options` present → CRITICAL: Embedding broken
3. Check recent Lovable platform changes
4. Review `vite.config.ts` for header configuration
5. Contact Lovable support with alert details
6. **DO NOT DEPLOY** additional changes until resolved

---

## Monitoring URLs (Quick Links)

- **UptimeRobot:** https://uptimerobot.com/dashboard
- **GitHub Actions:** https://github.com/[org]/[repo]/actions
- **Sentry:** https://sentry.io/organizations/[org]/projects/autorepai-production/
- **Supabase:** https://supabase.com/dashboard/project/niorocndzcflrwdrofsp

---

## Test Results

### Layer 1: Uptime Monitoring

**Service:** UptimeRobot  
**Status:** ⏳ NOT CONFIGURED

**Actions:**
- [ ] Account created
- [ ] Monitor added for `https://www.autorepai.ca/`
- [ ] Keyword check configured
- [ ] Email alert configured
- [ ] Test alert received
- [ ] Screenshot saved: `artifacts/phase6/uptimerobot-config.png`

---

### Layer 2: Header Sentinel

**Service:** GitHub Actions  
**Status:** ⏳ NOT CONFIGURED

**Actions:**
- [ ] Workflow file created: `.github/workflows/header-sentinel.yml`
- [ ] Workflow committed and pushed
- [ ] Manual trigger tested
- [ ] Verified green check on correct headers
- [ ] Screenshot saved: `artifacts/phase6/github-actions-sentinel.png`

---

### Layer 3: Error Tracking

**Service:** Sentry  
**Status:** ⏳ NOT CONFIGURED

**Actions:**
- [ ] Sentry project created
- [ ] SDK installed (`@sentry/react`)
- [ ] DSN configured in `src/main.tsx`
- [ ] Error boundary integrated
- [ ] Alert rule created (>1% error rate)
- [ ] Test error captured
- [ ] Screenshot saved: `artifacts/phase6/sentry-project-config.png`

---

### Layer 4: Supabase Metrics

**Service:** Supabase Dashboard  
**Status:** ⏳ NOT CONFIGURED

**Actions:**
- [ ] Email notifications enabled
- [ ] CPU alert threshold set (80%)
- [ ] Dashboard widgets reviewed
- [ ] Screenshot saved: `artifacts/phase6/supabase-notifications-config.png`

---

## Gate Approval Criteria

### ✅ PASS Conditions

1. **Uptime Monitor:**
   - UptimeRobot shows "Up" status for `www.autorepai.ca`
   - Test alert successfully delivered

2. **Header Sentinel:**
   - GitHub Actions workflow running every 5 minutes
   - Latest run shows ✅ green check

3. **Error Tracking:**
   - Sentry receiving browser events
   - Alert rule configured for >1% error rate

4. **Supabase Metrics:**
   - Email notifications enabled
   - Dashboard showing current metrics

5. **Evidence:**
   - All screenshots collected in `artifacts/phase6/`
   - Baseline metrics recorded (post-deploy)

### ❌ FAIL Conditions (NO-GO)

- Any monitoring layer not configured
- Test alerts not received
- Sentry not capturing events
- Supabase notifications disabled

---

## Evidence Attachments

### Screenshots

- [ ] `artifacts/phase6/uptimerobot-config.png`
- [ ] `artifacts/phase6/uptimerobot-test-alert.png`
- [ ] `artifacts/phase6/github-actions-sentinel.png`
- [ ] `artifacts/phase6/github-actions-success-log.png`
- [ ] `artifacts/phase6/sentry-project-config.png`
- [ ] `artifacts/phase6/sentry-alert-rule.png`
- [ ] `artifacts/phase6/sentry-test-error.png`
- [ ] `artifacts/phase6/supabase-notifications-config.png`
- [ ] `artifacts/phase6/supabase-dashboard-metrics.png`

---

## Sign-Off

- [ ] All 4 monitoring layers **CONFIGURED** and verified
- [ ] Test alerts **RECEIVED** for uptime and errors
- [ ] Baseline metrics **RECORDED** (post-deploy)
- [ ] Runbook procedures **TESTED**
- [ ] All evidence collected and saved

**Approved By:** _[Pending]_  
**Date:** _[Pending]_  

---

## References

- [UptimeRobot Documentation](https://uptimerobot.com/help/)
- [GitHub Actions Cron Syntax](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/metrics)
- [Incident Response Best Practices](https://www.atlassian.com/incident-management/handbook/incident-response)

---

**Next Phase:** Phase 7 — Providers: Twilio & OAuth (Turn-up and proof)
