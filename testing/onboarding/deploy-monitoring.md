# One-Click Onboarding - Deployment & Monitoring Guide

## 🚀 Deployment Process

### Phase 1: Environment Setup

#### 1.1 Supabase Environment Variables
Set these in your Supabase project dashboard:

```bash
# Production Environment Variables
TWILIO_ACCOUNT_SID=AC_your_master_account_sid
TWILIO_AUTH_TOKEN=your_master_auth_token
TWILIO_MASTER_SUBACCOUNT_SID=AC_your_master_subaccount_sid
API_BASE_URL=https://your-production-domain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key

# Staging Environment Variables (Sandbox)
TWILIO_SANDBOX_MODE=true
TWILIO_ACCOUNT_SID=AC_sandbox_sid
TWILIO_AUTH_TOKEN=sandbox_auth_token
API_BASE_URL=https://your-staging-domain.com
```

#### 1.2 Deploy Edge Function
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy onboarding-provision

# Verify deployment
supabase functions list
```

### Phase 2: Testing Stages

#### 2.1 Unit Tests
```bash
# Run TypeScript checks
npm run typecheck

# Run component tests
npm run test -- --testPathPattern=onboarding

# Run Edge Function tests (if available)
supabase functions serve onboarding-provision --test
```

#### 2.2 Integration Tests
```bash
# Start mock server for testing
node testing/onboarding/mock-onboarding-server.js

# Run manual test script
chmod +x testing/onboarding/test-onboarding-manual.sh
./testing/onboarding/test-onboarding-manual.sh
```

#### 2.3 End-to-End Tests
```bash
# Start development server
npm run dev

# Run E2E tests (if configured)
npm run test:e2e

# Manual testing checklist:
- [ ] Open app in browser
- [ ] Click "Add Number" button
- [ ] Modal opens with one-click option
- [ ] Click "Activate AI Receptionist"
- [ ] Loading states display correctly
- [ ] Success state shows phone number
- [ ] Dashboard updates with new number
```

### Phase 3: Staging Deployment

#### 3.1 Feature Flags
```typescript
// Add feature flag to control rollout
const ONBOARDING_ONE_CLICK_ENABLED = process.env.VITE_ONBOARDING_ONE_CLICK_ENABLED === 'true';

// In component:
if (ONBOARDING_ONE_CLICK_ENABLED) {
  return <AddNumberModal />;
} else {
  // Fallback to old flow
  return <OldOnboardingForm />;
}
```

#### 3.2 Gradual Rollout
```bash
# Start with 10% of users
VITE_ONBOARDING_ONE_CLICK_ENABLED=true ROLLBACK_PERCENTAGE=90

# Monitor error rates
# Increase to 50% if stable
# Full rollout when confident
```

#### 3.3 Monitoring Setup
```typescript
// Add to your monitoring service
analytics.track('onboarding_flow_started', {
  flow: 'one_click',
  userId,
  timestamp: Date.now()
});

analytics.track('onboarding_flow_completed', {
  flow: 'one_click',
  duration: Date.now() - startTime,
  phoneNumber,
  success: true
});
```

## 📊 Monitoring & Alerting

### Key Metrics to Monitor

#### 1. Success Rate
```sql
-- Query success rate over time
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE error IS NULL) as successful,
  ROUND(
    COUNT(*) FILTER (WHERE error IS NULL)::decimal /
    COUNT(*)::decimal * 100, 2
  ) as success_rate
FROM onboarding_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

#### 2. Performance Metrics
```sql
-- Average provisioning time
SELECT
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
  MIN(EXTRACT(EPOCH FROM (completed_at - started_at))) as min_duration,
  MAX(EXTRACT(EPOCH FROM (completed_at - started_at))) as max_duration
FROM onboarding_logs
WHERE completed_at IS NOT NULL
  AND created_at >= NOW() - INTERVAL '24 hours';
```

#### 3. Error Analysis
```sql
-- Top error types
SELECT
  error_type,
  COUNT(*) as occurrences,
  MAX(created_at) as last_occurred
FROM onboarding_logs
WHERE error IS NOT NULL
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY occurrences DESC;
```

### Alert Conditions

#### Critical Alerts (Page immediately)
- Success rate < 90% for 5 minutes
- Average provisioning time > 30 seconds
- Twilio API errors > 10 in 10 minutes
- Database connection failures > 5 in 10 minutes

#### Warning Alerts (Monitor closely)
- Success rate < 95% for 15 minutes
- Individual user provisioning > 60 seconds
- Queue depth > 10 pending requests

### Logging Structure

#### Edge Function Logs
```typescript
// Add comprehensive logging
console.log(JSON.stringify({
  event: 'onboarding_started',
  userId,
  userEmail,
  userLocation,
  timestamp: new Date().toISOString(),
  environment: Deno.env.get('ENVIRONMENT') || 'production'
}));

console.log(JSON.stringify({
  event: 'twilio_subaccount_created',
  userId,
  subaccountSid: subaccount.sid,
  duration: Date.now() - startTime
}));

console.log(JSON.stringify({
  event: 'phone_number_provisioned',
  userId,
  phoneNumber: purchasedNumber.phoneNumber,
  areaCode: purchasedNumber.phoneNumber.substring(2, 5)
}));

console.log(JSON.stringify({
  event: 'onboarding_completed',
  userId,
  phoneNumber: purchasedNumber.phoneNumber,
  totalDuration: Date.now() - startTime,
  success: true
}));

// Error logging
console.error(JSON.stringify({
  event: 'onboarding_failed',
  userId,
  error: error.message,
  errorType: error.name,
  stack: error.stack,
  step: 'twilio_subaccount_creation',
  duration: Date.now() - startTime
}));
```

#### Frontend Logs
```typescript
// Analytics events
analytics.track('onboarding_modal_opened', {
  userId: user?.id,
  timestamp: Date.now(),
  source: 'dashboard_quick_actions'
});

analytics.track('onboarding_provisioning_started', {
  userId: user?.id,
  timestamp: Date.now()
});

analytics.track('onboarding_provisioning_completed', {
  userId: user?.id,
  phoneNumber,
  duration: Date.now() - startTime,
  success: true
});

analytics.track('onboarding_error_occurred', {
  userId: user?.id,
  error: errorMessage,
  step: 'api_call',
  duration: Date.now() - startTime
});
```

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### Issue: Edge Function Times Out
```
Error: Function execution timed out
```
**Solutions:**
1. Check Twilio API response times
2. Add timeout handling in Edge Function
3. Implement queuing for high-traffic periods
4. Monitor Edge Function memory usage

#### Issue: Twilio Number Unavailable
```
Error: No available phone numbers in your area
```
**Solutions:**
1. Implement fallback area codes
2. Add retry logic with different area codes
3. Queue requests for later retry
4. Alert when inventory is low

#### Issue: Database Connection Failed
```
Error: Connection to database failed
```
**Solutions:**
1. Check Supabase connection limits
2. Implement connection pooling
3. Add retry logic with exponential backoff
4. Monitor database performance

#### Issue: Authentication Errors
```
Error: Unauthorized
```
**Solutions:**
1. Verify JWT token validity
2. Check token expiration
3. Validate user session
4. Implement token refresh logic

### Rollback Procedures

#### Emergency Rollback
```bash
# Disable feature flag
VITE_ONBOARDING_ONE_CLICK_ENABLED=false

# Redeploy frontend
npm run build
npm run deploy

# Monitor for errors dropping to zero
```

#### Partial Rollback
```bash
# Reduce rollout percentage
ROLLOUT_PERCENTAGE=50

# Monitor error rates
# Increase gradually if stable
```

#### Database Cleanup
```sql
-- Remove failed provisioning attempts
DELETE FROM clients
WHERE created_at > '2024-12-27'
  AND phone_number IS NULL;

-- Reset feature for specific users
UPDATE user_preferences
SET onboarding_flow = 'legacy'
WHERE user_id IN (
  SELECT user_id FROM onboarding_errors
  WHERE created_at > '2024-12-27'
);
```

## 📈 Performance Optimization

### Edge Function Optimizations
```typescript
// Use connection pooling
const twilioClient = new Twilio(accountSid, authToken, {
  lazyLoading: true,
  limit: 10
});

// Cache area code availability
const areaCodeCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getAvailableNumbers(areaCode: string) {
  const cacheKey = `area_${areaCode}`;
  const cached = areaCodeCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.numbers;
  }

  const numbers = await twilioClient.availablePhoneNumbers('US')
    .local.list({ areaCode, limit: 5 });

  areaCodeCache.set(cacheKey, {
    numbers,
    timestamp: Date.now()
  });

  return numbers;
}
```

### Frontend Optimizations
```typescript
// Debounce rapid clicks
const [isLoading, setIsLoading] = useState(false);

const handleOneClick = useCallback(async () => {
  if (isLoading) return;

  setIsLoading(true);
  try {
    // ... provisioning logic
  } finally {
    setTimeout(() => setIsLoading(false), 1000); // Prevent spam clicks
  }
}, [isLoading]);
```

### Monitoring Dashboard
```typescript
// Real-time metrics component
function OnboardingMetrics() {
  const [metrics, setMetrics] = useState({
    successRate: 0,
    avgDuration: 0,
    errorCount: 0,
    activeRequests: 0
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch('/api/onboarding/metrics');
      const data = await response.json();
      setMetrics(data);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="metrics-dashboard">
      <div className="metric">
        <span className="value">{metrics.successRate}%</span>
        <span className="label">Success Rate</span>
      </div>
      <div className="metric">
        <span className="value">{metrics.avgDuration}s</span>
        <span className="label">Avg Duration</span>
      </div>
      <div className="metric">
        <span className="value">{metrics.errorCount}</span>
        <span className="label">Errors (24h)</span>
      </div>
    </div>
  );
}
```

## 🎯 Success Criteria Verification

### Pre-Launch Checklist
- [ ] Edge Function deployed to staging
- [ ] Sandbox credentials tested successfully
- [ ] Mock server tests pass
- [ ] Frontend integration tested
- [ ] Mobile responsiveness verified
- [ ] Error handling tested
- [ ] Monitoring alerts configured
- [ ] Rollback procedures documented

### Launch Readiness
- [ ] Success rate > 98% in staging
- [ ] Average provisioning time < 10 seconds
- [ ] Error rate < 2% in staging
- [ ] Load testing completed (50 concurrent users)
- [ ] Mobile apps tested on iOS/Android
- [ ] Customer support trained on new flow

### Post-Launch Monitoring (First 24 hours)
- [ ] Monitor success rates hourly
- [ ] Track user feedback and support tickets
- [ ] Monitor Twilio API usage and costs
- [ ] Verify database performance
- [ ] Check for edge cases not caught in testing

### Success Metrics (Week 1)
- [ ] User satisfaction > 95%
- [ ] Support tickets related to onboarding < 5
- [ ] Conversion rate from click to completion > 90%
- [ ] Average session duration for onboarding < 15 seconds
- [ ] Error recovery rate > 95% (users who retry after error)

This comprehensive testing and monitoring setup ensures your one-click onboarding system launches successfully and maintains high reliability in production.
