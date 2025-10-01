# AutoRepAi Operations Runbook

## Quick Reference

**Project**: AutoRepAi - Dealership AI Platform  
**Environment**: Production  
**Supabase Project ID**: `niorocndzcflrwdrofsp`  
**Region**: US East (default)

## Emergency Contacts

### On-Call Rotation
- **Primary**: [To be assigned]
- **Secondary**: [To be assigned]
- **Escalation**: [Management contact]

### External Support
- **Supabase Support**: support@supabase.io
- **Lovable Support**: support@lovable.dev
- **Emergency Hotline**: [To be configured]

## System Overview

### Architecture
```
┌─────────────────┐
│   Users/Clients │
└────────┬────────┘
         │ HTTPS
┌────────▼────────┐
│  React Frontend │ (Lovable hosted)
│  + PWA Manifest │
└────────┬────────┘
         │ Auth + API calls
┌────────▼────────────┐
│ Supabase Platform   │
│ ├─ PostgreSQL DB    │
│ ├─ Auth Service     │
│ ├─ Edge Functions   │
│ ├─ Storage          │
│ └─ Realtime         │
└────────┬────────────┘
         │
┌────────▼────────┐
│  Lovable AI     │ (Google Gemini)
│  Gateway        │
└─────────────────┘
```

### Key Services
- **Frontend**: Lovable-hosted React app
- **Database**: Supabase PostgreSQL
- **API**: Supabase Edge Functions (Deno runtime)
- **Auth**: Supabase Auth (GoTrue)
- **AI**: Lovable AI Gateway (Gemini 2.5 Flash)
- **Storage**: Supabase Storage (planned)

## Access & Credentials

### Supabase Dashboard
- **URL**: https://supabase.com/dashboard/project/niorocndzcflrwdrofsp
- **Authentication**: GitHub OAuth
- **Permissions**: Org admin access required

### Database Access
```bash
# Connection string (from Supabase dashboard)
postgresql://postgres:[password]@db.niorocndzcflrwdrofsp.supabase.co:5432/postgres
```

### Edge Function Logs
```bash
# View logs in Supabase dashboard
https://supabase.com/dashboard/project/niorocndzcflrwdrofsp/functions/ai-chat/logs
```

### Secrets Management
```bash
# Supabase secrets are managed via dashboard
https://supabase.com/dashboard/project/niorocndzcflrwdrofsp/settings/functions

# Current secrets:
# - LOVABLE_API_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_DB_URL
```

## Monitoring

### Health Checks

#### Frontend Health
```bash
# Check if app is accessible
curl -I https://[your-lovable-domain].lovable.app

# Expected: HTTP 200 OK
```

#### Database Health
```sql
-- Run in Supabase SQL Editor
SELECT 
  schemaname, 
  tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

#### Edge Function Health
```bash
# Test AI chat function
curl -X POST \
  https://niorocndzcflrwdrofsp.supabase.co/functions/v1/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "test"}],
    "dealershipName": "Test Dealer"
  }'

# Expected: JSON response with AI message
```

### Key Metrics

#### Database
- **Active connections**: < 50 (monitor via Supabase dashboard)
- **Query performance**: P95 < 100ms
- **Storage usage**: < 8GB (free tier limit)
- **Table sizes**: Monitor `pg_stat_user_tables`

#### Edge Functions
- **Invocations**: Monitor via Supabase dashboard
- **Error rate**: < 1%
- **P95 latency**: < 2s
- **Rate limits**: Watch for 429 errors

#### Authentication
- **Active users**: Monitor `auth.users` table
- **Failed logins**: Check auth logs
- **Session duration**: Average 1 hour

### Alerting (Planned)

**Critical Alerts:**
- Database CPU > 80%
- Database storage > 90%
- Edge function error rate > 5%
- Authentication service down
- Security incidents detected

**Warning Alerts:**
- Database connections > 40
- Edge function P95 > 3s
- Failed login attempts > 10/minute
- Low AI credits remaining

## Common Operations

### Deploying Code Changes

#### Frontend
```bash
# Code is auto-deployed via Lovable on git push
# No manual deployment needed
```

#### Edge Functions
```bash
# Functions auto-deploy on git push to connected repo
# Monitor deployment status in Supabase dashboard
```

#### Database Migrations
```bash
# Migrations are applied automatically via Lovable
# View migration history in Supabase dashboard
https://supabase.com/dashboard/project/niorocndzcflrwdrofsp/database/migrations
```

### Managing Users

#### Create Admin User (SQL)
```sql
-- 1. User must first sign up via /auth page
-- 2. Then run this to grant admin role:
INSERT INTO user_roles (user_id, organization_id, role)
VALUES (
  '[user-uuid]',  -- from profiles table
  '[org-uuid]',   -- from organizations table
  'org_admin'
);
```

#### Disable User Account
```sql
-- Soft delete (preferred)
UPDATE profiles
SET active = false
WHERE id = '[user-uuid]';

-- Hard delete (use with caution)
DELETE FROM auth.users
WHERE id = '[user-uuid]';
```

#### Reset User Password
```bash
# Users can reset via /auth page
# Or trigger manually via Supabase dashboard:
# Auth -> Users -> [user] -> Send Password Reset
```

### Managing Data

#### Backup Database
```bash
# Automated backups via Supabase (daily)
# Manual backup from SQL Editor:
# 1. Select table
# 2. Export as CSV/JSON

# Or via pg_dump (requires connection string):
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

#### Restore Data
```bash
# From Supabase dashboard:
# Database -> Backups -> Restore

# Or via psql:
psql $DATABASE_URL < backup-20251001.sql
```

#### Clear Test Data
```sql
-- Clear all test leads
DELETE FROM leads
WHERE email LIKE '%@test.com';

-- Clear old interactions
DELETE FROM interactions
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Managing Secrets

#### Update Secret
```bash
# Via Supabase dashboard:
# Settings -> Functions -> Secrets -> Edit

# Restart edge functions after secret change (automatic)
```

#### Rotate API Keys
```bash
# 1. Generate new key from provider (Lovable, Resend, etc.)
# 2. Update in Supabase secrets
# 3. Test with new key
# 4. Revoke old key
# 5. Update documentation
```

## Troubleshooting

### Frontend Issues

#### App Won't Load
```bash
# Check browser console for errors
# Verify Supabase project is online
# Check DNS resolution
# Clear browser cache
# Try incognito mode
```

#### Authentication Loop
```bash
# Clear localStorage
localStorage.clear()

# Check Supabase Auth status
# Settings -> Auth -> Configuration
# Verify email confirmation settings
```

#### AI Chat Not Responding
```bash
# Check edge function logs
# Verify LOVABLE_API_KEY is set
# Check AI Gateway status (429/402 errors)
# Monitor rate limits
```

### Database Issues

#### Slow Queries
```sql
-- Find slow queries
SELECT 
  query,
  calls,
  total_exec_time / 1000 AS total_seconds,
  mean_exec_time / 1000 AS mean_seconds
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Missing indexes?
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct < -0.01  -- High cardinality
ORDER BY n_distinct;
```

#### Connection Pool Exhausted
```sql
-- Check active connections
SELECT 
  count(*),
  state,
  application_name
FROM pg_stat_activity
WHERE datname = 'postgres'
GROUP BY state, application_name;

-- Kill idle connections (use carefully)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND state_change < NOW() - INTERVAL '1 hour';
```

#### RLS Policy Issues
```sql
-- Test RLS as specific user
SET LOCAL ROLE TO authenticated;
SET LOCAL request.jwt.claims.sub TO '[user-uuid]';

-- Run your query to test policy
SELECT * FROM leads;

-- Reset role
RESET ROLE;
```

### Edge Function Issues

#### Function Timeout
```bash
# Default timeout: 60s
# Check function execution time in logs
# Optimize slow operations:
# - Break into smaller chunks
# - Add caching
# - Reduce AI token limits
```

#### Memory Issues
```bash
# Edge functions have 512MB memory limit
# Check memory usage in logs
# Reduce payload sizes
# Stream large responses
```

#### Rate Limiting (AI Gateway)
```bash
# 429 Too Many Requests
# Solution: Implement client-side rate limiting
# - Queue requests
# - Add exponential backoff
# - Display user-friendly message

# 402 Payment Required
# Solution: Add credits to Lovable AI workspace
# Settings -> Workspace -> Usage -> Add Credits
```

## Incident Response

### P0: Critical Incident

#### Data Breach
1. **Immediate Actions (< 15 min)**
   ```sql
   -- Revoke all sessions
   DELETE FROM auth.sessions;
   
   -- Disable external integrations
   UPDATE integrations SET active = false;
   ```

2. **Containment (< 1 hour)**
   - Rotate all secrets
   - Enable MFA requirement (if available)
   - Review audit logs
   - Preserve evidence

3. **Notification (< 24-72 hours)**
   - Privacy Commissioner (Canada)
   - State AG (US, if applicable)
   - Affected individuals
   - Insurance carrier

#### Service Outage
1. **Check Supabase Status**
   - https://status.supabase.com

2. **Verify DNS**
   ```bash
   nslookup [your-domain]
   dig [your-domain]
   ```

3. **Check Database**
   ```bash
   # Test connection
   psql $DATABASE_URL -c "SELECT 1;"
   ```

4. **Failover (if available)**
   - Switch to read replica
   - Enable maintenance mode
   - Communicate with users

### P1: High Priority

#### Authentication Issues
```sql
-- Check failed login attempts
SELECT 
  email,
  COUNT(*) as attempts,
  MAX(created_at) as last_attempt
FROM auth.audit_log_entries
WHERE action = 'user_signedin'
AND error_message IS NOT NULL
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY email
ORDER BY attempts DESC;
```

#### Performance Degradation
```sql
-- Find resource hogs
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 5;

-- Check locks
SELECT 
  pid,
  state,
  query,
  wait_event_type,
  wait_event
FROM pg_stat_activity
WHERE wait_event IS NOT NULL;
```

## Maintenance Windows

### Scheduled Maintenance
- **Frequency**: Monthly (first Sunday, 2-4 AM EST)
- **Duration**: 2 hours maximum
- **Activities**:
  - Dependency updates
  - Security patches
  - Database maintenance
  - Secret rotation

### Pre-Maintenance Checklist
- [ ] Announce maintenance window (72h notice)
- [ ] Backup database
- [ ] Test changes in staging (if available)
- [ ] Prepare rollback plan
- [ ] Notify team members
- [ ] Set up monitoring

### Post-Maintenance Checklist
- [ ] Verify all services operational
- [ ] Run smoke tests
- [ ] Check error rates
- [ ] Review logs
- [ ] Update documentation
- [ ] Notify users of completion

## Performance Tuning

### Database Optimization

#### Vacuum & Analyze
```sql
-- Run during low traffic
VACUUM ANALYZE leads;
VACUUM ANALYZE vehicles;
VACUUM ANALYZE quotes;

-- Check bloat
SELECT 
  schemaname, 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_dead_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;
```

#### Index Optimization
```sql
-- Find missing indexes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct < -0.01
AND correlation < 0.1;

-- Create indexes for common queries
CREATE INDEX CONCURRENTLY idx_leads_status 
ON leads(status) 
WHERE status IN ('new', 'contacted');

CREATE INDEX CONCURRENTLY idx_interactions_created 
ON interactions(created_at DESC);
```

### Query Optimization
```sql
-- Use EXPLAIN ANALYZE for slow queries
EXPLAIN ANALYZE
SELECT * FROM leads
WHERE dealership_id = '[uuid]'
AND status = 'new';

-- Add appropriate indexes based on results
```

### Caching Strategy

#### Client-Side (React Query)
```typescript
// Already configured in App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

#### Edge Function (Supabase)
```typescript
// Add caching headers
return new Response(JSON.stringify(data), {
  headers: {
    'Cache-Control': 'public, max-age=300', // 5 minutes
    'Content-Type': 'application/json',
  },
});
```

## Disaster Recovery

### Recovery Time Objective (RTO)
- **Critical Systems**: 4 hours
- **Non-Critical Systems**: 24 hours

### Recovery Point Objective (RPO)
- **Database**: 24 hours (daily backups)
- **Files**: 24 hours (Supabase Storage)

### Backup Verification
```bash
# Monthly backup restoration test
# 1. Restore to test environment
# 2. Verify data integrity
# 3. Test critical workflows
# 4. Document results
```

### Disaster Scenarios

#### Complete Data Loss
1. Restore from latest Supabase backup
2. Verify data integrity
3. Replay audit logs if available
4. Communicate with affected users

#### Supabase Platform Failure
1. Check status page: https://status.supabase.com
2. Export data if possible
3. Set up read-only mode
4. Consider temporary migration (if extended outage)

## Runbook Maintenance

### Update Schedule
- **Weekly**: Review on-call rotation
- **Monthly**: Update metrics and KPIs
- **Quarterly**: Full runbook review
- **As-needed**: After incidents or major changes

### Version History
- **v1.0 (2025-10-01)**: Initial runbook
  - System overview
  - Common operations
  - Incident response procedures
  - Performance tuning guidelines

## Additional Resources

### Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [SECURITY.md](./SECURITY.md) - Security controls
- [COMPLIANCE.md](./COMPLIANCE.md) - Regulatory compliance

### External Links
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Manual](https://www.postgresql.org/docs/current/)
- [Deno Manual](https://deno.land/manual)
- [React Query Docs](https://tanstack.com/query/latest)

### Training Materials
- New engineer onboarding checklist
- On-call training guide
- Incident response simulations
- Security awareness training
