# Disaster Recovery Playbook

## Quick Reference

**RTO (Recovery Time Objective):** 4 hours  
**RPO (Recovery Point Objective):** 15 minutes  
**On-Call:** See RUNBOOK.md for rotation  

---

## DR Scenarios & Response

### Scenario 1: Complete Database Outage

**Detection:**
- All database queries failing
- Supabase dashboard unreachable
- Error logs showing connection timeouts

**Response Steps:**

1. **Immediate (T+0 to T+15min)**
   ```bash
   # Verify outage scope
   curl https://status.supabase.com
   
   # Enable read-only mode if partial access
   # Update app status banner
   ```

2. **Activate Failover (T+15min to T+1hr)**
   - Check Supabase point-in-time recovery options
   - Restore from latest backup to new instance if needed
   - Update connection strings in secrets

3. **Restore Service (T+1hr to T+4hr)**
   - Validate data integrity
   - Test critical flows (auth, lead capture, quotes)
   - Monitor error rates and performance
   - Update status page

4. **Post-Incident**
   - Document timeline and root cause
   - Review backup/recovery procedures
   - Update RTO/RPO if needed

**Rollback Plan:**
- Keep previous database URL in secrets
- Maintain connection pooling for fast switchover
- Test rollback quarterly

---

### Scenario 2: Connector Service Failures (Dealertrack/Autovance)

**Detection:**
- Circuit breaker state: OPEN
- Connector health dashboard shows failures
- Customer reports integration issues

**Response Steps:**

1. **Immediate (T+0 to T+5min)**
   - Verify circuit breaker is OPEN (preventing cascading failures)
   - Check connector status dashboard
   - Review offline queue length

2. **Engage Degraded Mode (T+5min to T+30min)**
   - Verify local operations continue (leads, quotes, timeline)
   - Confirm offline queue is capturing operations
   - Notify customers via status banner: "Integration temporarily offline"

3. **Troubleshoot & Restore (T+30min to T+2hr)**
   ```bash
   # Check connector credentials
   # Review API rate limits
   # Test connectivity
   curl -X POST https://api.dealertrack.com/health \
     -H "Authorization: Bearer $DEALERTRACK_TOKEN"
   
   # Reset circuit breaker if service restored
   # Monitor queue drain
   ```

4. **Recovery**
   - Circuit breaker transitions HALF_OPEN → CLOSED
   - Offline queue drains successfully
   - Remove status banner
   - Send recap to affected customers

**Graceful Degradation:**
- Leads still captured locally
- Quotes still generated with Canadian taxes
- Credit apps stored for manual export
- Timeline continues logging all interactions

---

### Scenario 3: AI Assistant Outage

**Detection:**
- Chat widget not responding
- AI API returning 5xx errors
- Rate limit exhaustion

**Response Steps:**

1. **Immediate (T+0 to T+5min)**
   - Display fallback message in chat: "Assistant temporarily unavailable"
   - Provide alternative contact methods (phone, email)
   - Log all attempted interactions for follow-up

2. **Escalate (T+5min to T+30min)**
   - Check Lovable AI status
   - Verify API keys and quotas
   - Review rate limits and usage

3. **Restore (T+30min to T+1hr)**
   - Reset rate limits if applicable
   - Rotate API keys if compromised
   - Test chat flow end-to-end
   - Re-enable widget

**Fallback:**
- Lead capture form always available
- Phone/email contact prominently displayed
- Queue messages for AI follow-up when restored

---

### Scenario 4: Complete Application Outage

**Detection:**
- Lovable deployment unavailable
- DNS resolution failing
- CDN errors

**Response Steps:**

1. **Immediate (T+0 to T+10min)**
   ```bash
   # Check deployment status
   curl https://status.lovable.app
   
   # Verify DNS
   nslookup yourapp.lovable.app
   
   # Check CDN
   curl -I https://yourapp.lovable.app
   ```

2. **Activate Backup (T+10min to T+1hr)**
   - If Lovable is down: Deploy to backup hosting (Vercel/Netlify)
   - Update DNS if needed
   - Notify users via social media/email

3. **Restore Primary (T+1hr to T+4hr)**
   - Once Lovable is restored, redeploy
   - Switch DNS back to primary
   - Monitor traffic and errors

**Prevention:**
- Maintain exportable codebase via GitHub
- Document alternative deployment steps
- Keep backup hosting credentials current

---

## DR Drills & Testing

### Quarterly Drill Schedule

**Q1: Database Failover**
- Simulate database outage
- Practice point-in-time recovery
- Measure actual RTO/RPO
- Document deviations

**Q2: Connector Outage**
- Disable connector API keys
- Verify circuit breaker behavior
- Confirm offline queue functionality
- Test manual export workflows

**Q3: AI Assistant Failure**
- Simulate rate limit exhaustion
- Verify fallback messaging
- Test lead capture continuity
- Measure customer impact

**Q4: Full Application Outage**
- Practice backup deployment
- Test DNS switchover
- Verify data consistency
- Measure end-to-end recovery time

### Drill Checklist

```markdown
- [ ] Scenario clearly defined
- [ ] Team notified (non-emergency)
- [ ] Start time recorded
- [ ] Detection verified
- [ ] Response steps executed
- [ ] Recovery time measured
- [ ] Data integrity validated
- [ ] Postmortem completed
- [ ] Action items assigned
```

---

## Communication Templates

### Internal Incident Alert

```
INCIDENT: [Database Outage / Connector Failure / etc.]
SEVERITY: [P0 - Critical / P1 - High / P2 - Medium]
DETECTED: [Timestamp]
IMPACT: [Description of user impact]
STATUS: [Investigating / Mitigating / Resolved]
ETA: [Estimated resolution time]
LEAD: [Engineer name]
```

### Customer Status Update

```
Subject: Service Update - [Date]

We're currently experiencing [brief description]. 

Impact: [What customers will notice]
Workaround: [If available]
ETA: [Expected resolution time]

We'll update you in [interval] or when resolved.

Thank you for your patience.
```

---

## Post-Incident Review

### Template

**Incident:** [Title]  
**Date:** [YYYY-MM-DD]  
**Duration:** [Detection to resolution]  
**Severity:** [P0/P1/P2]  

**Timeline:**
- T+0: [Detection event]
- T+5: [First response action]
- T+30: [Key milestone]
- T+X: [Resolution]

**Root Cause:**
[Technical explanation]

**Impact:**
- Users affected: [Number/percentage]
- Revenue impact: [If applicable]
- Data loss: [None / description]

**What Went Well:**
- [Positive observations]

**What Could Be Improved:**
- [Areas for enhancement]

**Action Items:**
- [ ] [Specific task] - Assigned to [Name] - Due [Date]
- [ ] [Prevention measure] - Assigned to [Name] - Due [Date]

---

## Backup & Recovery Procedures

### Database Backups

**Frequency:** Continuous (Supabase)  
**Retention:** 7 days (free tier) / 30 days (paid)  
**Validation:** Weekly restore test to staging  

```sql
-- Verify latest backup
SELECT pg_database.datname, 
       pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database;

-- Critical tables to verify
SELECT COUNT(*) FROM leads;
SELECT COUNT(*) FROM quotes;
SELECT COUNT(*) FROM credit_applications;
SELECT COUNT(*) FROM consent_audit;
```

### Code Backups

**Repository:** GitHub (auto-synced from Lovable)  
**Branches:** main (production), staging, feature/*  
**Deployment:** Tag releases for rollback  

```bash
# Create release tag
git tag -a v1.2.0 -m "Release 1.2.0"
git push origin v1.2.0

# Rollback to previous release
git checkout v1.1.0
# Redeploy
```

### Secrets Backup

**Location:** Encrypted in password manager  
**Access:** Engineering team + 1 executive  
**Rotation:** Quarterly or after incident  

---

## Monitoring & Alerting

### Critical Alerts (Page Immediately)

- Database connection pool exhausted
- Error rate > 5% for 5 minutes
- Circuit breaker OPEN for > 10 minutes
- AI API rate limit exceeded
- Authentication failures > 50/min

### Warning Alerts (Slack/Email)

- Response time > 3s for 10 minutes
- Queue length > 100 items
- Connector retries increasing
- Disk usage > 80%

### Alert Response

```bash
# Check system health
curl https://yourapp.lovable.app/health

# Review recent errors
# (Via Supabase analytics query - see RUNBOOK.md)

# Check circuit breaker states
# (Via Settings dashboard)

# Review queue length
# (Via admin dashboard)
```

---

## Compliance During DR

### Data Protection

- All backups encrypted at rest
- Point-in-time recovery preserves consent audit trail
- Customer data retained per PIPEDA/GDPR requirements

### Consent Continuity

- Consent audit trail immutable (append-only)
- One-click export available during outage
- Marketing suspended if consent data inaccessible

### Notification Requirements

- **PIPEDA:** Notify affected individuals if breach likely causes serious harm
- **GDPR:** Notify within 72 hours if EEA users affected
- **CASL:** Maintain consent records during recovery

---

## Contact Information

**Supabase Support:** support@supabase.com (paid tier)  
**Lovable Support:** [Discord community](https://discord.gg/lovable)  
**Dealertrack Support:** [Vendor contact]  
**Autovance Support:** [Vendor contact]  

**Internal Escalation:**
1. Engineering Lead
2. Product Owner
3. Executive Sponsor

---

## Version History

| Version | Date       | Changes                        | Author |
|---------|------------|--------------------------------|--------|
| 1.0     | 2025-10-04 | Initial DR playbook            | AI     |

---

**Next Review:** Q1 2026  
**Owner:** Engineering Lead  
**Status:** Active
