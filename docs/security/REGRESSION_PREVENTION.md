# Security Regression Prevention

## Critical Security Controls - DO NOT MODIFY

### 1. Anonymous Access Blocks
**Location:** Database RLS Policies  
**Rule:** ALL sensitive tables MUST have explicit anonymous denial policies.

```sql
-- REQUIRED on ALL PII tables:
CREATE POLICY "Block anonymous access" ON table_name
FOR ALL USING (false);
```

**Tables requiring this:**
- profiles
- leads
- credit_applications
- dealerships
- documents
- integrations
- webhooks
- consents
- encryption_keys

**Testing:** Run `tests/e2e/security-validation.spec.ts`

---

### 2. Encryption Key Storage
**Location:** `src/lib/security/creditEncryption.ts`  
**Rule:** Each sensitive field MUST use a unique key + IV pair.

**Critical Implementation:**
```typescript
// ✅ CORRECT: Unique key per field
for (const field of sensitiveFields) {
  const { data: encrypted, key, iv } = await encryptText(value);
  fieldEncryptionData[field] = { key, iv };
}

// ❌ WRONG: Reusing same key
const { data: encrypted, key, iv } = await encryptText(value);
// Using same key for all fields
```

**Testing:** Code review + integration tests

---

### 3. Edge Function JWT Verification
**Location:** `supabase/config.toml`  
**Rule:** Only public endpoints can disable JWT verification.

**Public endpoints (verify_jwt = false):**
- capture-client-ip (returns IP only)
- unsubscribe (uses token-based auth)

**Protected endpoints (verify_jwt = true):**
- store-encryption-key
- retrieve-encryption-key
- store-integration-credentials
- ai-chat
- social-post

**Testing:** Attempt to call protected functions without auth header

---

### 4. Rate Limiting
**Location:** `supabase/functions/retrieve-encryption-key/index.ts`  
**Rule:** Key retrieval MUST be rate limited per user.

**Implementation:**
```typescript
const { data: rateLimitCheck } = await supabaseClient
  .rpc('check_key_retrieval_rate_limit', { p_user_id: user.id });

if (!rateLimitCheck) {
  throw new Error('Rate limit exceeded');
}
```

**Testing:** Attempt >10 key retrievals in 1 minute

---

### 5. Client IP Capture
**Location:** `src/components/CreditApp/CreditApplicationForm.tsx`  
**Rule:** IP capture failure MUST NOT block consent submission.

**Implementation:**
```typescript
let clientIp = 'unknown';
try {
  const { data: ipData } = await supabase.functions.invoke('capture-client-ip');
  clientIp = ipData?.ip || 'unknown';
} catch (ipError) {
  console.error('Failed to capture client IP:', ipError);
  // Continue with 'unknown' - don't block submission
}
```

**Testing:** Block capture-client-ip function, verify form still submits

---

## Pre-Deployment Checklist

Before any security-related changes:

- [ ] Run `supabase db lint` - zero critical issues
- [ ] Run `npm run test:e2e` - all security tests pass
- [ ] Review RLS policies - no anonymous access to PII
- [ ] Check edge function config - JWT verification correct
- [ ] Verify encryption logic - unique keys per field
- [ ] Test rate limiting - key retrieval blocked after limit
- [ ] Validate IP capture - graceful degradation working

---

## Monitoring & Alerts

### Critical Events to Monitor:

1. **Failed Key Retrievals**
   - Alert if >5 failed attempts in 1 minute
   - Check `key_retrieval_attempts` table

2. **Bulk Data Exports**
   - Alert if >10 records accessed in 1 minute
   - Check `audit_events` table

3. **Anonymous Access Attempts**
   - Alert on any 403 errors from RLS
   - Review postgres logs

4. **Encryption Failures**
   - Alert on any encryption/decryption errors
   - Check edge function logs

---

## Code Review Requirements

All PRs touching these files REQUIRE security review:

- `src/lib/security/creditEncryption.ts`
- `supabase/functions/store-encryption-key/`
- `supabase/functions/retrieve-encryption-key/`
- `supabase/migrations/*.sql` (any RLS changes)
- `supabase/config.toml`
- `src/components/CreditApp/CreditApplicationForm.tsx`

**Reviewers must verify:**
1. No anonymous access enabled on PII tables
2. Encryption uses unique keys
3. Rate limiting not removed
4. JWT verification appropriate
5. Error handling doesn't leak sensitive info

---

## Incident Response

If a security regression is detected:

1. **Immediate:** Revert the change
2. **Within 1 hour:** Run `supabase db dump` for audit
3. **Within 4 hours:** Investigate scope of exposure
4. **Within 24 hours:** Notify affected users if PII exposed
5. **Within 48 hours:** Implement fix + additional guards

---

## Manual Verification Steps

### Test Anonymous Access Block:
```bash
curl -X GET 'https://niorocndzcflrwdrofsp.supabase.co/rest/v1/profiles' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Expected: 403 or empty response
# If you see data: CRITICAL ISSUE
```

### Test Key Retrieval Rate Limit:
```sql
-- Check recent attempts
SELECT user_id, COUNT(*) as attempts
FROM key_retrieval_attempts
WHERE attempted_at > NOW() - INTERVAL '1 minute'
GROUP BY user_id
HAVING COUNT(*) > 10;

-- Should be empty under normal use
```

### Verify Encryption Keys Not Exposed:
```sql
-- This query should FAIL due to RLS
SELECT * FROM encryption_keys WHERE user_id != auth.uid();

-- This query should succeed but not show keys
SELECT id, user_id, purpose, created_at, access_count 
FROM encryption_keys 
WHERE user_id = auth.uid();
```

---

## Automated Regression Tests

Run these tests on every deployment:

```bash
# Security validation
npm run test:e2e tests/e2e/security-validation.spec.ts

# Accessibility & security
npm run test:e2e tests/accessibility/wcag-audit.spec.ts

# Credit application flow
npm run test:e2e tests/e2e/credit-application.spec.ts

# Resilience under failure
npm run test:e2e tests/e2e/resilience.spec.ts
```

**All tests MUST pass before production deployment.**

---

## Security Baseline

This baseline was established on 2025-01-05 after critical security fixes.

Any changes that weaken these controls are PROHIBITED without senior security review and approval.

**Last Updated:** 2025-01-05  
**Next Review:** 2025-04-05 (quarterly)
