# Phase 3: Alert Policies & Thresholds

**Last Updated:** ________________  
**Status:** ⚠️ PENDING ACTIVATION

---

## Overview

This document defines all alerting policies, thresholds, escalation procedures, and on-call responsibilities for AutoRepAi production monitoring.

---

## 1. Uptime & Availability Alerts

### Policy: Root Path Availability

| Parameter | Value |
|-----------|-------|
| **Monitor Name** | `AutoRepAi - Root Path Uptime` |
| **Endpoint** | `https://yourdomain.com/` |
| **Check Frequency** | Every 30 seconds (or fastest available) |
| **Success Criteria** | HTTP 200 + Content contains `<!doctype html>` |
| **Failure Criteria** | Non-200 status OR missing keyword |
| **Alert Threshold** | Immediate (on first failure) |
| **Escalation** | After 2 minutes of consecutive failures |
| **Severity** | 🔴 **P0 - Critical** |

**Alert Channels:**
- 📧 Email: `oncall@yourdomain.com`
- 💬 Slack: `#alerts-critical`
- 📱 SMS: On-call engineer (after 2 minutes)
- 📞 PagerDuty: Critical incident (after 5 minutes)

**Response SLA:**
- Acknowledge: **< 5 minutes**
- Initial response: **< 10 minutes**
- Resolution target: **< 30 minutes**

**Runbook:** [Site Down Procedure](../RUNBOOK.md#site-down)

---

## 2. Security Header Sentinel Alerts

### Policy: Anti-Embed Header Detection

| Parameter | Value |
|-----------|-------|
| **Monitor Name** | `Security Header Sentinel - Root & 404` |
| **Endpoints** | `/` and `/404` (or any non-existent) |
| **Check Frequency** | Every 5 minutes |
| **Failure Criteria** | `X-Frame-Options` present OR `frame-ancestors` missing from CSP |
| **Alert Threshold** | Immediate (critical regression) |
| **Severity** | 🔴 **P0 - Critical** (blocks embeds = business impact) |

**Alert Channels:**
- 📧 Email: `security@yourdomain.com`, `oncall@yourdomain.com`
- 💬 Slack: `#alerts-security` + `#alerts-critical`
- 📱 SMS: CTO and Lead Engineer immediately

**Response SLA:**
- Acknowledge: **< 5 minutes**
- Investigation start: **< 10 minutes**
- Fix deployed: **< 30 minutes** (rollback if needed)

**Detection Logic:**
```bash
# Root Path Check
if [[ $(curl -sI https://yourdomain.com/ | grep -i "x-frame-options") ]]; then
  ALERT="X-Frame-Options detected on /"
  SEVERITY="P0"
fi

if ! [[ $(curl -sI https://yourdomain.com/ | grep -i "content-security-policy" | grep -i "frame-ancestors") ]]; then
  ALERT="frame-ancestors missing from CSP on /"
  SEVERITY="P0"
fi

# 404 Path Check
if [[ $(curl -sI https://yourdomain.com/test-404 | grep -i "x-frame-options") ]]; then
  ALERT="X-Frame-Options detected on 404"
  SEVERITY="P0"
fi

if ! [[ $(curl -sI https://yourdomain.com/test-404 | grep -i "content-security-policy" | grep -i "frame-ancestors") ]]; then
  ALERT="frame-ancestors missing from CSP on 404"
  SEVERITY="P0"
fi
```

**Root Cause Analysis Required:**
- Deployment that introduced the regression
- Configuration change in hosting platform (Lovable, Cloudflare, etc.)
- CDN or proxy misconfiguration

**Runbook:** [Security Header Rollback](../docs/P5-Rollback-Playbook.md)

---

## 3. Client & Server Error Rate Alerts

### Policy: Application Error Rate Threshold

| Parameter | Value |
|-----------|-------|
| **Monitor Name** | `Error Rate - Frontend & Backend` |
| **Data Source** | Sentry, LogRocket, or equivalent |
| **Threshold** | ≥ 1% error rate |
| **Time Window** | 5 minutes (rolling) |
| **Alert Threshold** | When threshold exceeded for 1 consecutive window |
| **Severity** | 🟠 **P1 - High** |

**Calculation:**
```
Error Rate = (Total Errors / Total Requests) * 100
```

**Monitored Error Types:**
- Frontend:
  - JavaScript runtime errors
  - React component errors
  - Network request failures (4xx client errors excluded from rate)
  - Render failures
- Backend:
  - Edge function errors (5xx)
  - Database connection failures
  - API timeout errors
  - Authentication failures (excluding user errors)

**Alert Channels:**
- 📧 Email: `dev-team@yourdomain.com`
- 💬 Slack: `#alerts-errors`
- Escalate to SMS after 10 minutes if not acknowledged

**Response SLA:**
- Acknowledge: **< 15 minutes**
- Investigation: **< 30 minutes**
- Resolution target: **< 2 hours**

**Alert Suppression:**
- Do NOT alert for single user errors (1 user experiencing issues)
- Suppress during deployment windows (5-minute grace period post-deploy)
- Ignore bot traffic (based on user-agent)

**Example Sentry Alert Configuration:**
```yaml
name: "Error Rate Threshold Exceeded"
conditions:
  - type: event_frequency
    value: 1  # 1% of total events
    interval: 5m
    comparison_type: percent
filters:
  - type: level
    match: error,fatal
  - type: environment
    match: production
actions:
  - type: slack
    workspace: AutoRepAi
    channel: "#alerts-errors"
  - type: email
    targets:
      - dev-team@yourdomain.com
throttle: 5m  # Don't spam if sustained
```

**Runbook:** [High Error Rate Investigation](../RUNBOOK.md#high-error-rate)

---

## 4. Supabase Infrastructure Alerts

### Policy A: Database CPU Utilization

| Parameter | Value |
|-----------|-------|
| **Monitor Name** | `Supabase DB CPU - High Utilization` |
| **Data Source** | Supabase Dashboard or API |
| **Threshold** | > 80% average CPU |
| **Time Window** | 5 minutes (consecutive) |
| **Alert Threshold** | After 5 minutes above 80% |
| **Severity** | 🟠 **P1 - High** (P0 if > 95%) |

**Alert Channels:**
- 📧 Email: `dba@yourdomain.com`, `oncall@yourdomain.com`
- 💬 Slack: `#alerts-infrastructure`
- Escalate to SMS if > 95% CPU

**Response SLA:**
- Acknowledge: **< 10 minutes**
- Investigation: **< 20 minutes**
- Mitigation: **< 1 hour**

**Investigation Steps:**
1. Check active queries: `SELECT * FROM pg_stat_activity WHERE state = 'active';`
2. Identify slow queries: Review slow query logs in Supabase dashboard
3. Check for N+1 queries or missing indexes
4. Review recent deployments for inefficient queries
5. Consider scaling database (if load is legitimate)

**Runbook:** [Database Performance Degradation](../RUNBOOK.md#db-cpu-high)

---

### Policy B: 5xx Error Rate (Edge Functions & API)

| Parameter | Value |
|-----------|-------|
| **Monitor Name** | `Supabase 5xx Error Rate` |
| **Data Source** | Edge function logs, API Gateway logs |
| **Threshold** | > 1% of total requests |
| **Time Window** | 5 minutes (rolling) |
| **Alert Threshold** | After 1 window above 1% |
| **Severity** | 🟠 **P1 - High** |

**Alert Channels:**
- 📧 Email: `dev-team@yourdomain.com`
- 💬 Slack: `#alerts-backend`

**Response SLA:**
- Acknowledge: **< 15 minutes**
- Investigation: **< 30 minutes**
- Fix deployed: **< 2 hours**

**Investigation Steps:**
1. Check edge function logs: [Supabase Functions Logs](https://supabase.com/dashboard/project/niorocndzcflrwdrofsp/functions)
2. Identify failing function(s) and error messages
3. Check for:
   - Database connection issues
   - Missing environment variables / secrets
   - External API failures (3rd-party dependencies)
   - Code bugs introduced in recent deployment
4. Rollback if recent deployment caused spike

**Runbook:** [Edge Function 5xx Investigation](../RUNBOOK.md#edge-function-errors)

---

### Policy C: Authentication Rate Limit Spike

| Parameter | Value |
|-----------|-------|
| **Monitor Name** | `Supabase Auth Rate Limit Events` |
| **Data Source** | Supabase Auth logs (`auth_logs` table) |
| **Threshold** | > 50 rate-limit events in 1 minute |
| **Alert Threshold** | Immediate when threshold exceeded |
| **Severity** | 🟡 **P2 - Medium** (🟠 P1 if sustained >10 minutes) |

**Alert Channels:**
- 📧 Email: `security@yourdomain.com`
- 💬 Slack: `#alerts-security`
- Escalate to P1 if sustained or evidence of attack

**What This Indicates:**
- Potential brute-force attack on login endpoints
- Misconfigured client retrying failed auth requests
- Bot traffic targeting auth endpoints
- Legitimate spike in user activity (rare)

**Investigation Steps:**
1. Query auth logs for rate-limited IPs:
   ```sql
   SELECT 
     metadata->>'ip' AS ip_address,
     COUNT(*) AS rate_limit_count,
     metadata->>'path' AS endpoint
   FROM auth.logs
   WHERE level = 'error' 
     AND metadata->>'msg' ILIKE '%rate limit%'
     AND timestamp > NOW() - INTERVAL '10 minutes'
   GROUP BY ip_address, endpoint
   ORDER BY rate_limit_count DESC
   LIMIT 20;
   ```

2. Identify if it's:
   - Single IP (likely attack) → Block at CDN/firewall level
   - Multiple IPs (distributed attack) → Enable Cloudflare WAF, adjust rate limits
   - Specific user (misconfigured client) → Contact user, fix integration

3. Check for patterns:
   - Failed login attempts with common usernames (attack)
   - Signup spam (bot registration)
   - Password reset abuse

**Response Actions:**
- **If attack:** Block IPs at CDN level (Cloudflare, Lovable hosting settings)
- **If misconfigured client:** Contact user/developer, provide guidance
- **If legitimate spike:** Temporarily increase rate limits if necessary

**Runbook:** [Auth Rate Limit Response](../RUNBOOK.md#auth-rate-limit-spike)

---

## 5. Alert Escalation Matrix

| Time Elapsed | Action | Severity P0 | Severity P1 | Severity P2 |
|--------------|--------|-------------|-------------|-------------|
| **0 minutes** | Alert fires | Slack + Email | Slack + Email | Slack + Email |
| **5 minutes** | No acknowledge | SMS to on-call | Email reminder | - |
| **10 minutes** | No response | PagerDuty escalation | SMS to on-call | - |
| **30 minutes** | Unresolved | Page CTO | Slack mention @team | Email reminder |
| **1 hour** | Ongoing incident | Incident call convened | Slack escalation | - |

---

## 6. On-Call Rotation

### Current On-Call Schedule

| Role | Primary | Backup |
|------|---------|--------|
| **Engineering** | [Name] | [Name] |
| **Database** | [Name] | [Name] |
| **Security** | [Name] | [Name] |

**Rotation:** Weekly, Monday 9 AM EST  
**On-Call Tool:** PagerDuty / Opsgenie / Manual rotation  
**Compensation:** [Define on-call pay/time-off policy]

---

## 7. Alert Testing & Validation

### Monthly Drill Requirements

Each alert policy must be tested monthly to ensure:
- Alerts fire correctly
- All notification channels work
- On-call rotation responds within SLA
- Runbook procedures are up-to-date

**Test Schedule:**
- **First Monday of each month:** Test uptime alerts (scheduled downtime)
- **Second Monday:** Test security header sentinel (deploy bad config to staging)
- **Third Monday:** Test error rate alerts (trigger synthetic errors)
- **Fourth Monday:** Test Supabase infrastructure alerts (load test)

**Test Log:**

| Date | Alert Tested | Result | Issues Found | Remediation |
|------|--------------|--------|--------------|-------------|
| YYYY-MM-DD | Uptime | ✅ / ❌ | (description) | (action taken) |
| YYYY-MM-DD | Security Headers | ✅ / ❌ | (description) | (action taken) |
| YYYY-MM-DD | Error Rate | ✅ / ❌ | (description) | (action taken) |
| YYYY-MM-DD | DB CPU | ✅ / ❌ | (description) | (action taken) |

---

## 8. Quiet Hours & Alert Suppression

**Production:** No quiet hours (24/7 alerting)

**Staging:** Suppress non-critical alerts outside business hours (9 AM - 6 PM EST)

**Maintenance Windows:**
- Suppress alerts during scheduled maintenance
- Announce maintenance at least 24 hours in advance
- Maintenance window max: 2 hours

---

## 9. Metrics Dashboard

**Primary Dashboard:** [Link to monitoring dashboard]

**Key Metrics to Track:**
- Uptime percentage (target: 99.9%)
- Error rate (target: < 0.5%)
- Database CPU average (target: < 50%)
- Alert count per week (goal: minimize false positives)
- Mean time to acknowledge (MTTA) - target: < 5 minutes
- Mean time to resolution (MTTR) - target: < 1 hour

---

## Gate Approval

**Status:** ⛔ **BLOCKED**

**Required for Green Gate:**
- ✅ All 7 alert policies active and verified
- ✅ At least one successful test alert for each policy
- ✅ Screenshots of all monitor configurations attached
- ✅ On-call rotation defined and accepted
- ✅ Runbook links updated and validated

**Verification Date:** ________________  
**Verified By:** ________________  
**Gate Status:** ⛔ BLOCKED / ⚠️ PARTIAL / ✅ PASSED

---

## Appendix: Quick Reference

### Critical Alert Conditions (P0)

1. ❌ Site down (root path non-responsive)
2. ❌ `X-Frame-Options` header present (blocks embeds)
3. ❌ `frame-ancestors` missing from CSP
4. ❌ Database CPU > 95%
5. ❌ Error rate > 5% (sustained)

### High Priority Alert Conditions (P1)

1. ⚠️ Error rate 1-5%
2. ⚠️ Database CPU 80-95%
3. ⚠️ 5xx error rate > 1%
4. ⚠️ Auth rate-limit spike sustained > 10 minutes

### Contact Information

- **Slack Workspace:** [AutoRepAi-Ops]
- **Critical Alerts Channel:** `#alerts-critical`
- **Security Alerts Channel:** `#alerts-security`
- **On-Call Email:** `oncall@yourdomain.com`
- **Emergency Escalation:** [Phone number]

---

**Document Owner:** Engineering Team  
**Last Review:** ________________  
**Next Review Due:** [30 days from activation]
