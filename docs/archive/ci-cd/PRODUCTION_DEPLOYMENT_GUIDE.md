# Production Deployment Guide - TradeLine 24/7 Telephony System

## 🚀 Executive Summary
This guide provides step-by-step instructions for deploying the enterprise-grade telephony system to production with zero downtime and comprehensive monitoring.

## 📋 Pre-Deployment Checklist

### Environment Variables
Ensure all required environment variables are set in Supabase Edge Function secrets:

```bash
# Critical - Required
TWILIO_AUTH_TOKEN=your_token_here
BUSINESS_TARGET_E164=+15877428885

# Optional - Enhanced Features
SALES_TARGET_E164=+15877428885
SUPPORT_TARGET_E164=+15877428885
NODE_ENV=production
RESEND_API_KEY=your_resend_key

# Email Configuration
FROM_EMAIL=notifications@tradeline247ai.com
NOTIFY_TO=info@tradeline247ai.com

# Optional Security
TWILIO_IP_ALLOWLIST=54.172.60.0,54.244.51.0
ALLOW_INSECURE_TWILIO_WEBHOOKS=false
```

### Database Migrations
All migrations must be applied in order:

```bash
# Check current migration status
supabase db status

# Apply new migrations
supabase db push

# Or apply specific migrations
psql $DATABASE_URL -f supabase/migrations/20251101T1200_distributed_rate_limiting.sql
psql $DATABASE_URL -f supabase/migrations/20251101T1210_idempotency_keys.sql
psql $DATABASE_URL -f supabase/migrations/20251101T1220_telephony_transactions.sql
psql $DATABASE_URL -f supabase/migrations/20251101T1230_monitoring_views.sql
```

## 🔧 Deployment Steps

### Step 1: Database Setup
```bash
# 1. Backup current database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migrations
supabase db push

# 3. Verify migrations
supabase db status

# 4. Test monitoring views
psql $DATABASE_URL -c "SELECT * FROM call_success_metrics;"
psql $DATABASE_URL -c "SELECT * FROM active_calls LIMIT 5;"
```

### Step 2: Deploy Edge Functions
```bash
# Deploy all updated functions
supabase functions deploy voice-action
supabase functions deploy voice-frontdoor
supabase functions deploy voice-consent-speech
supabase functions deploy voice-menu-handler
supabase functions deploy voice-voicemail
supabase functions deploy voice-route
supabase functions deploy voice-route-action
supabase functions deploy voice-status
supabase functions deploy voice-health
supabase functions deploy telephony-onboard
supabase functions deploy contact-submit

# Verify deployments
supabase functions list
```

### Step 3: Configure Twilio Webhooks
```bash
# Update voice webhook for main hotline
# Navigate to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming

# For number: +1-587-742-8885
# Voice URL: https://YOUR_PROJECT.supabase.co/functions/v1/voice-frontdoor
# Method: POST
# Status Callback: https://YOUR_PROJECT.supabase.co/functions/v1/voice-status
# Status Events: Initiated, Ringing, Answered, Completed
```

### Step 4: Verify Health Checks
```bash
# Check system health
curl https://YOUR_PROJECT.supabase.co/functions/v1/voice-health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2025-11-01T...",
#   "checks": {
#     "env": {...},
#     "database": {"status": "healthy"},
#     "recent_activity": {...}
#   }
# }
```

### Step 5: Run Integration Tests
```bash
# Navigate to tests directory
cd tests/telephony

# Run test suite
deno test --allow-net --allow-env test-voice-flow.ts

# Expected output: All tests passing
```

### Step 6: Monitor First Production Calls
```bash
# Watch real-time logs
supabase functions logs voice-frontdoor --tail

# In another terminal, check database
watch -n 5 "psql $DATABASE_URL -c 'SELECT * FROM active_calls;'"

# Make test call to 587-742-8885
# Verify:
# 1. Consent message plays
# 2. Menu options work (Press 1, 2, 9, *)
# 3. Call logs appear in database
# 4. No errors in logs
```

## 📊 Monitoring Setup

### Real-Time Dashboards
Create queries in your monitoring tool (Grafana, Datadog, etc.):

```sql
-- Active call count
SELECT COUNT(*) FROM active_calls;

-- Success rate (last hour)
SELECT
  success_rate_pct,
  total_calls,
  failed_calls
FROM call_success_metrics;

-- Recent errors
SELECT * FROM recent_errors;

-- Voicemail backlog
SELECT COUNT(*) FROM voicemail_backlog WHERE hours_old > 24;
```

### Alerts Configuration

**Critical Alerts** (PagerDuty/Opsgenie):
- System health status = unhealthy (5+ minutes)
- Call success rate < 90% (30 minutes)
- Edge function errors > 5/minute
- Database connection failures

**Warning Alerts** (Slack/Email):
- Voicemail backlog > 10 messages
- Rate limit violations > 50/hour
- Failed transactions > 5/hour
- Average call duration > 15 minutes

### Log Aggregation
```bash
# Stream all telephony logs
supabase functions logs --follow --filter "voice-*"

# Export logs for analysis
supabase functions logs voice-frontdoor --since 1h > logs.txt
```

## 🧪 Testing Protocol

### Manual Test Cases

**Test 1: Sales Routing**
```
1. Call 587-742-8885
2. Wait for consent message
3. Press 1 for Sales
4. Verify: Routes to SALES_TARGET_E164
5. Check: call_logs has mode='sales'
```

**Test 2: Support Routing**
```
1. Call 587-742-8885
2. Wait for consent message
3. Press 2 for Support
4. Verify: Routes to SUPPORT_TARGET_E164
5. Check: call_logs has mode='support'
```

**Test 3: Voicemail Flow**
```
1. Call 587-742-8885
2. Press 9 immediately
3. Leave test message
4. Verify: Recording saved in call_logs
5. Check: voicemail_backlog view shows message
```

**Test 4: Menu Retry**
```
1. Call 587-742-8885
2. Don't press anything (timeout)
3. Verify: Menu repeats once
4. Timeout again
5. Verify: Routes to voicemail
```

**Test 5: Rate Limiting**
```
1. Make 12 calls rapidly from same number
2. Verify: After 10 calls, rate limit message plays
3. Wait 60 seconds
4. Verify: Can call again
5. Check: rate_limit_violations view
```

**Test 6: Signature Validation**
```bash
# Should fail (no signature)
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/voice-action \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "CallSid=CAtest&Digits=0"

# Expected: 401 Unauthorized
```

### Automated Testing
```bash
# Run full test suite
deno test --allow-net --allow-env tests/telephony/

# Expected: All tests passing
# ✅ voice-frontdoor - should reject missing signature
# ✅ voice-menu-handler - should reject missing signature
# ✅ voice-action - should reject missing signature
# ✅ voice-health - should return health status
# ✅ contact-submit - should enforce rate limiting
# ✅ telephony-onboard - should be idempotent
```

## 🔄 Rollback Procedure

If issues occur during deployment:

### Quick Rollback (Functions Only)
```bash
# Redeploy previous version
git checkout <previous-commit>
supabase functions deploy <function-name>
```

### Full Rollback (Functions + Database)
```bash
# 1. Restore database backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# 2. Rollback functions
git checkout <previous-commit>
supabase functions deploy --all

# 3. Verify system health
curl https://YOUR_PROJECT.supabase.co/functions/v1/voice-health
```

### Emergency Hotfix
```bash
# If calls are failing, quickly switch to legacy mode:
# 1. Update Twilio webhook to old endpoint temporarily
# 2. Fix issue in new code
# 3. Redeploy
# 4. Switch webhook back

# Or use Twilio's failover URL feature
```

## 📈 Performance Benchmarks

Expected metrics after deployment:

- **Call Answer Rate**: > 99%
- **Call Success Rate**: > 95%
- **Average Call Duration**: 2-5 minutes
- **Menu Response Time**: < 2 seconds
- **Voicemail Recording Rate**: < 10% of calls
- **Rate Limit False Positives**: 0
- **Edge Function Cold Start**: < 500ms
- **Database Query Time**: < 100ms

## 🔐 Security Checklist

- [ ] All webhooks validate Twilio signatures
- [ ] Rate limiting enabled and tested
- [ ] Environment variables secured (not in code)
- [ ] Database RLS policies enabled
- [ ] HTTPS enforced on all endpoints
- [ ] Sensitive data masked in logs
- [ ] IP allowlist configured (if required)
- [ ] Error messages don't leak internals
- [ ] Consent handling compliant (PIPEDA/PIPA)
- [ ] Recording defaults to OFF on errors

## 📞 Support Contacts

### Production Incidents
- **Critical**: Page on-call engineer via PagerDuty
- **High**: Slack #telephony-alerts channel
- **Medium**: Create ticket in Jira
- **Low**: Email devops@tradeline247ai.com

### Twilio Support
- **Console**: https://console.twilio.com/us1/support
- **Phone**: 1-888-908-9456
- **Email**: help@twilio.com

### Escalation Path
1. On-call DevOps Engineer
2. Senior SRE
3. CTO
4. CEO (for business-critical outages)

## 🎯 Success Criteria

Deployment is successful when:

- [ ] All health checks passing
- [ ] Test calls complete successfully
- [ ] No errors in logs (first 100 calls)
- [ ] Monitoring dashboards showing data
- [ ] All alerts configured and tested
- [ ] Team trained on new features
- [ ] Documentation updated
- [ ] Rollback procedure tested
- [ ] 24-hour monitoring window completed
- [ ] Stakeholders notified

## 📝 Post-Deployment Tasks

### Day 1
- Monitor error rates closely
- Review first 1000 calls
- Check voicemail backlog
- Verify consent tracking

### Week 1
- Analyze call success metrics
- Review rate limit patterns
- Optimize if needed
- Gather user feedback

### Month 1
- Full system performance review
- Capacity planning update
- Security audit
- Cost optimization analysis

## 🚨 Known Issues & Workarounds

**Issue**: Twilio webhook delays during high traffic
- **Workaround**: Increase timeout values
- **Monitoring**: Track via call_lifecycle table

**Issue**: Rate limiter cold start delay
- **Workaround**: Pre-warm with health checks
- **Fix**: Distributed cache (future enhancement)

**Issue**: Voicemail transcription delays
- **Expected**: 30-60 seconds for transcription
- **Monitoring**: Check transcript field population

## 📚 Additional Resources

- [Twilio Voice API Documentation](https://www.twilio.com/docs/voice)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [PIPEDA Compliance Guide](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)
- Internal: TELEPHONY_CRITICAL_FIXES.md
- Internal: docs/telephony.md

---

**Last Updated**: 2025-11-01
**Version**: 2.0 (Enterprise)
**Maintained By**: DevOps Team
