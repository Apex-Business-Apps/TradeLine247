# P0 Server-Side Authorization Implementation Guide

## Critical Security Fix: Missing Authorization Checks

**Issue:** Admin endpoints don't verify user roles server-side
**Impact:** Potential unauthorized access to admin functions
**Status:** PARTIALLY IMPLEMENTED

---

## ✅ Implementation Completed

### Authorization Middleware Created
- **File:** `/supabase/functions/_shared/authorizationMiddleware.ts`
- **Functions:**
  - `requireAuth(req)` - Verify authenticated user
  - `requireAdmin(req)` - Require admin/moderator role
  - `requireRole(req, role)` - Require specific role
  - `requireAnyRole(req, roles[])` - Require one of multiple roles
  - `unauthorizedResponse(authResult)` - Helper for error responses

### Endpoints Secured (1 of 35)
1. ✅ `/supabase/functions/ops-activate-account/index.ts` - Account activation

---

## ⏳ Remaining Endpoints Requiring Authorization (34 total)

### CRITICAL PRIORITY (Immediate Action Required)

#### Financial & Billing Operations
- [ ] `ops-twilio-buy-number` - Purchases phone numbers ($$$)
- [ ] `ops-twilio-create-port` - Ports existing numbers
- [ ] `ops-map-number-to-tenant` - Maps numbers to billing

#### User & Access Management
- [ ] `ops-verify-gate1` - User verification gates
- [ ] `ops-init-encryption-key` - Initializes encryption keys

#### Campaign & Marketing
- [ ] `ops-campaigns-create` - Creates marketing campaigns
- [ ] `ops-campaigns-send` - Sends campaigns to lists
- [ ] `ops-leads-import` - Imports lead data
- [ ] `ops-segment-warm50` - Segments warm leads
- [ ] `ops-send-warm50` - Sends to warm leads

#### Voice & SMS Configuration
- [ ] `ops-voice-config-update` - Updates voice configuration
- [ ] `ops-twilio-configure-webhooks` - Configures webhooks
- [ ] `ops-twilio-number-config` - Configures number settings
- [ ] `ops-twilio-hosted-sms` - SMS configuration

### HIGH PRIORITY

#### Twilio Infrastructure
- [ ] `ops-twilio-ensure-subaccount` - Creates Twilio subaccounts
- [ ] `ops-twilio-ensure-messaging-service` - Creates messaging services
- [ ] `ops-twilio-a2p` - A2P 10DLC registration
- [ ] `ops-twilio-trust-setup` - Trust/compliance setup
- [ ] `ops-twilio-quickstart-forward` - Quick number setup

#### Follow-ups & Automation
- [ ] `ops-followups-enable` - Enables follow-up sequences
- [ ] `ops-followups-send` - Sends follow-up messages

#### Reporting & Data Export
- [ ] `ops-report-export` - Exports reports
- [ ] `ops-generate-forwarding-kit` - Generates forwarding docs

### MEDIUM PRIORITY (Monitoring & Diagnostics)

- [ ] `ops-health-twilio` - Twilio account health
- [ ] `ops-messaging-health-check` - Messaging health
- [ ] `ops-voice-health` - Voice service health
- [ ] `ops-voice-slo` - SLO monitoring
- [ ] `ops-twilio-list-numbers` - Lists available numbers
- [ ] `ops-twilio-debugger-intake` - Twilio debugger logs
- [ ] `ops-twilio-queue-worker` - Queue processing

### LOW PRIORITY (Testing & Development)

- [ ] `ops-test-call` - Test call placement
- [ ] `ops-twilio-test-webhook` - Webhook testing
- [ ] `ops-error-intake` - Error logging (should be public but rate-limited)

---

## 📝 Implementation Pattern

### Step 1: Import Middleware
```typescript
import { requireAdmin, unauthorizedResponse } from '../_shared/authorizationMiddleware.ts';
```

### Step 2: Add Authorization Check (After OPTIONS, Before Logic)
```typescript
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // P0 FIX: Require admin authorization
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult);
  }

  try {
    // ... existing endpoint logic
  }
});
```

### Step 3: Optional - Use Auth Context
```typescript
// Access authenticated user info
const userId = authResult.userId;
const userRole = authResult.role;
const userEmail = authResult.email;

// Add to audit logs
await supabase.from('audit_logs').insert({
  user_id: userId,
  action: 'operation_name',
  payload: { ... }
});
```

---

## 🧪 Testing Checklist

### For Each Endpoint:
- [ ] Call without Authorization header → 401 Unauthorized
- [ ] Call with invalid token → 401 Unauthorized
- [ ] Call with valid user (non-admin) token → 403 Forbidden
- [ ] Call with admin token → 200 Success
- [ ] Verify audit log entry created (if applicable)

### Test Script Example:
```bash
# No auth - should fail with 401
curl -X POST https://[project].supabase.co/functions/v1/ops-activate-account \
  -H "Content-Type: application/json" \
  -d '{"userId":"123"}'

# Valid user token (non-admin) - should fail with 403
curl -X POST https://[project].supabase.co/functions/v1/ops-activate-account \
  -H "Authorization: Bearer [user-token]" \
  -H "Content-Type: application/json" \
  -d '{"userId":"123"}'

# Admin token - should succeed
curl -X POST https://[project].supabase.co/functions/v1/ops-activate-account \
  -H "Authorization: Bearer [admin-token]" \
  -H "Content-Type: application/json" \
  -d '{"userId":"123"}'
```

---

## ⚠️ Important Notes

### 1. Audit Logging
**Recommendation:** Add audit logging to all secured endpoints:
```typescript
await supabase.from('audit_logs').insert({
  user_id: authResult.userId,
  org_id: orgId,
  action: 'endpoint_name',
  payload: requestBody,
  ip_address: req.headers.get('x-forwarded-for') || 'unknown'
});
```

### 2. Rate Limiting
**Current State:** Some endpoints have rate limiting, but inconsistent
**Recommendation:** Apply rate limiting to all admin endpoints (e.g., 100 req/min per user)

### 3. CORS Configuration
**Current:** `Access-Control-Allow-Origin: '*'` (too permissive)
**Recommendation:** Restrict to known domains after auth is added

### 4. Error Messages
**Security Consideration:** Don't reveal whether email exists in "user not found" scenarios
**Pattern:** Use generic "Invalid credentials" instead of specific error messages

---

## 🚀 Deployment Strategy

### Phase 1: Critical Endpoints (Week 1)
1. Financial operations (buy-number, create-port, map-number)
2. User management (verify-gate1, init-encryption-key)
3. Campaign operations (campaigns-create, campaigns-send, leads-import)

### Phase 2: High Priority (Week 2)
1. Twilio infrastructure (subaccounts, messaging-service)
2. Voice/SMS configuration (voice-config-update, number-config)
3. Follow-ups and automation

### Phase 3: Monitoring & Testing (Week 3)
1. Health checks and monitoring endpoints
2. Testing and debugging endpoints
3. Reporting and exports

### Phase 4: Verification & Audit (Week 4)
1. End-to-end testing of all secured endpoints
2. Security audit and penetration testing
3. Documentation and handoff

---

## 📊 Progress Tracking

| Category | Total | Secured | Remaining | % Complete |
|----------|-------|---------|-----------|------------|
| Financial | 3 | 0 | 3 | 0% |
| User Management | 2 | 1 | 1 | 50% |
| Campaigns | 5 | 0 | 5 | 0% |
| Voice/SMS Config | 4 | 0 | 4 | 0% |
| Twilio Infrastructure | 5 | 0 | 5 | 0% |
| Follow-ups | 2 | 0 | 2 | 0% |
| Reporting | 2 | 0 | 2 | 0% |
| Monitoring | 7 | 0 | 7 | 0% |
| Testing | 3 | 0 | 3 | 0% |
| **TOTAL** | **35** | **1** | **34** | **3%** |

---

## 🔐 Security Impact After Full Implementation

**Before:**
- ❌ Any user with API access can call admin endpoints
- ❌ No audit trail of admin operations
- ❌ Potential for privilege escalation

**After:**
- ✅ Only admin/moderator roles can access admin endpoints
- ✅ All operations logged with user context
- ✅ Role-based access control enforced server-side
- ✅ Failed authorization attempts logged for security monitoring

---

## 📞 Handoff Checklist

- [x] Authorization middleware created and documented
- [x] One endpoint secured as example
- [ ] Remaining 34 endpoints need authorization (systematic work)
- [ ] Testing scripts created
- [ ] Deployment strategy documented
- [ ] Security audit recommended post-implementation

**Estimated Time to Complete:** 2-3 days of focused work
**Risk Level:** HIGH until completed
**Priority:** P0 - CRITICAL

---

**Next Steps:**
1. Apply authorization to all financial/billing endpoints (CRITICAL)
2. Apply to campaign and user management endpoints (HIGH)
3. Apply to remaining infrastructure endpoints (MEDIUM)
4. Test all secured endpoints
5. Deploy with monitoring

