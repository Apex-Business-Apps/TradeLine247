# Production Deployment Checklist

## 🚀 Pre-Deployment Validation

### ✅ Security Hardening (COMPLETED)

- [x] **Anonymous Access Blocked**: All PII tables block anonymous access
- [x] **Encryption System Fixed**: Unique keys per sensitive field
- [x] **Key Storage Secured**: Custom `encryption_keys` table with RLS
- [x] **Rate Limiting Implemented**: Key retrieval limited to 10/minute
- [x] **Client IP Capture**: Edge function captures real IP for consents
- [x] **System Logging Protected**: Only service role can write to audit tables
- [x] **Analytics Poisoning Prevented**: ab_events restricted to service role
- [x] **Security Audit Logs Protected**: key_retrieval_attempts restricted

### ⚠️ Manual Configuration Required

- [ ] **Enable Leaked Password Protection**
  - Navigate to: [Supabase Dashboard → Authentication → Policies](https://supabase.com/dashboard/project/niorocndzcflrwdrofsp/auth/policies)
  - Enable "Leaked Password Protection"
  - Documentation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

- [ ] **Configure Security Alerts**
  - Set up monitoring for failed authentication attempts
  - Alert on bulk data exports (>10 records/minute)
  - Monitor encryption key retrieval failures
  - Track RLS policy violations

- [ ] **Review Business Logic Policies**
  - [ ] Verify `pricing_tiers` public access is intentional
  - [ ] Verify `ab_tests` public access is intentional
  - [ ] Document why these tables are public

### 🔒 Access Control Verification

- [x] **RBAC Implemented**: Roles stored in `user_roles` table
- [x] **Lead Access Control**: Sales reps see assigned leads only
- [x] **Organization Isolation**: Users can only access their org data
- [x] **Admin Privileges**: Super admins and org admins have proper access
- [ ] **Test User Roles**: Create test users with each role and verify access

### 🧪 Testing Requirements

Run all test suites before deployment:

```bash
# Security validation tests
npm run test:e2e tests/e2e/security-validation.spec.ts

# Production readiness tests
npm run test:e2e tests/security/production-readiness.spec.ts

# Embed gate regression test
npm run test:e2e tests/security/embed-gate.spec.ts

# Credit application flow
npm run test:e2e tests/e2e/credit-application.spec.ts

# Accessibility compliance
npm run test:e2e tests/accessibility/wcag-audit.spec.ts

# Performance benchmarks
npm run test:e2e tests/performance/lighthouse.spec.ts

# Security pre-flight check
./scripts/security-check.sh
```

**All tests MUST pass before production deployment.**

### 📊 Database Validation

- [x] **RLS Policies Active**: All sensitive tables have RLS enabled
- [x] **Indexes Optimized**: Check `supabase db lint`
- [x] **Foreign Keys Valid**: No orphaned records
- [x] **Triggers Functional**: Timestamp updates working
- [ ] **Backup Configured**: Automated daily backups enabled
- [ ] **Point-in-Time Recovery**: Enabled for production database

### 🌐 Edge Functions Deployment

- [x] **All Functions Registered**: Check `supabase/config.toml`
- [x] **JWT Verification Configured**: Public vs protected functions set
- [x] **CORS Headers Present**: All functions handle OPTIONS requests
- [x] **Error Handling**: All functions have try-catch blocks
- [x] **Logging Implemented**: Console logs for debugging
- [ ] **Secrets Configured**: All required environment variables set

Edge Functions Status:
- ✅ `capture-client-ip` (public, JWT: false)
- ✅ `store-encryption-key` (protected, JWT: true)
- ✅ `retrieve-encryption-key` (protected, JWT: true)
- ✅ `store-integration-credentials` (protected, JWT: true)
- ✅ `ai-chat` (protected, JWT: true)
- ✅ `social-post` (protected, JWT: true)
- ✅ `unsubscribe` (public, JWT: false, token-based auth)

### 🔐 Secrets Management

Verify all secrets are configured in Supabase Dashboard → Settings → Edge Functions:

- [ ] `LOVABLE_API_KEY`
- [ ] `OPENAI_API_KEY` (if using AI features)
- [ ] `SENDGRID_API_KEY` (if using email)
- [ ] Any third-party API keys for integrations

### 🚨 Monitoring & Alerting

- [ ] **Error Tracking**: Sentry/LogRocket configured
- [ ] **Performance Monitoring**: Real User Monitoring (RUM) enabled
- [ ] **Uptime Monitoring**: Status page configured
- [ ] **Database Metrics**: Query performance tracking enabled
- [ ] **Edge Function Logs**: Centralized logging configured

Alert Triggers to Configure:
- Failed authentication attempts > 10/minute
- Bulk data export detected (>50 records/request)
- Encryption key retrieval failures > 5/minute
- RLS policy violations
- Edge function error rate > 5%
- Database connection pool exhaustion
- API response time > 2 seconds (p95)

### 🌍 Domain & SSL

- [ ] **Custom Domain Configured**: Production domain pointed to deployment
- [ ] **SSL Certificate**: Valid and auto-renewing
- [ ] **DNS Records**: A/CNAME records configured correctly
- [ ] **WWW Redirect**: Configured if needed
- [ ] **CORS Origins**: Production domain in allowed origins

### 📱 Client Configuration

- [ ] **API Keys**: Production Supabase keys in environment variables
- [ ] **Analytics**: Google Analytics/Plausible configured
- [ ] **Error Boundaries**: All critical components wrapped
- [ ] **Service Worker**: Registered and functioning
- [ ] **Cache Busting**: Query cache version updated

### 🧰 Rollback Plan

- [ ] **Database Snapshot**: Taken immediately before deployment
- [ ] **Previous Build Available**: Can revert to last known good version
- [ ] **Rollback Script**: Documented and tested
- [ ] **Communication Plan**: Stakeholders notified of deployment window

### 📄 Documentation

- [x] **Security Fixes Documented**: See `CRITICAL_SECURITY_FIXES_P0.md`
- [x] **Regression Prevention Guide**: See `docs/security/REGRESSION_PREVENTION.md`
- [x] **API Documentation**: Edge functions documented
- [ ] **User Guide**: End-user documentation updated
- [ ] **Admin Guide**: Administrative procedures documented
- [ ] **Runbook**: Operational procedures documented

### 🎯 Performance Benchmarks

Target Metrics (must meet before production):
- [ ] **First Contentful Paint**: < 1.5s
- [ ] **Time to Interactive**: < 3.5s
- [ ] **Lighthouse Score**: > 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] **Core Web Vitals**: All "Good" ratings
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

### 🔍 Final Security Audit

Run comprehensive security scan:

```bash
# Automated security scan
npm run security:scan

# Manual checks
- [ ] Review all RLS policies in Supabase Dashboard
- [ ] Test anonymous access to all tables
- [ ] Verify encryption key storage and retrieval
- [ ] Test rate limiting on sensitive endpoints
- [ ] Validate consent capture with real IP addresses
- [ ] Review audit logs for suspicious activity
```

### 📞 Emergency Contacts

Before deployment, ensure these are documented:

- [ ] **On-Call Engineer**: Contact info
- [ ] **Database Admin**: Contact info  
- [ ] **Security Team**: Contact info
- [ ] **Escalation Path**: Documented

## 🎬 Deployment Steps

1. **Final Testing**
   ```bash
   npm run test:e2e
   ./scripts/security-check.sh
   npm run build
   ```

2. **Database Backup**
   ```bash
   # Supabase automatic backup
   # Verify backup completed in dashboard
   ```

3. **Deploy Application**
   ```bash
   # Lovable handles deployment automatically
   # Verify deployment in Lovable dashboard
   ```

4. **Verify Edge Functions**
   - Check all functions deployed successfully
   - Test critical endpoints
   - Review function logs

5. **Smoke Tests**
   - [ ] Landing page loads
   - [ ] Authentication works
   - [ ] Dashboard accessible
   - [ ] AI chat widget functional
   - [ ] Lead capture works
   - [ ] Quote generation works
   - [ ] Credit application works

6. **Monitor for Issues**
   - Watch error logs for 30 minutes
   - Monitor performance metrics
   - Check user authentication success rate

## ✅ Post-Deployment Validation

- [ ] Run production smoke tests
- [ ] Verify SSL certificate
- [ ] Test from multiple geographic locations
- [ ] Test on mobile devices
- [ ] Verify analytics tracking
- [ ] Check error monitoring dashboard
- [ ] Review initial performance metrics

## 🚨 Rollback Procedure

If critical issues detected:

1. **Immediate**: Revert to previous Lovable build
2. **Within 15 min**: Notify team and stakeholders  
3. **Within 30 min**: Identify root cause
4. **Within 1 hour**: Document incident and prevention steps
5. **Within 24 hours**: Post-mortem and corrective actions

## 📋 Sign-Off

Deployment authorized by:

- [ ] **Engineering Lead**: _______________
- [ ] **Security Team**: _______________
- [ ] **QA Lead**: _______________
- [ ] **Product Owner**: _______________

**Deployment Date**: _______________  
**Deployment Time**: _______________  
**Deployed By**: _______________

---

## 🎉 Production Ready Criteria

### Core Requirements (All Must Be ✅)

- [x] Zero CRITICAL security vulnerabilities
- [x] All RLS policies in place and tested
- [x] Encryption system functional and tested
- [x] Rate limiting active
- [x] Client IP capture working
- [x] All edge functions deployed and tested
- [x] Audit logging functional
- [ ] All automated tests passing
- [ ] Performance benchmarks met
- [ ] Manual configuration items completed

**Status**: 🟡 READY FOR FINAL TESTING

Once all checklist items are ✅, system is **PRODUCTION READY**.
