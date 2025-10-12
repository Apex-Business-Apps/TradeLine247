# PHASE 2: Auth Hardening — Detailed Report

**Date:** 2025-10-11 (America/Edmonton)  
**Status:** ⏳ AWAITING USER ACTION  
**Gate:** P0 — Blocks production deploy

---

## Objective

Verify that Supabase's Leaked Password Protection feature prevents the use of compromised passwords during signup, enforcing a minimum 12-character password with mixed character classes.

---

## Configuration Requirements

### Supabase Dashboard → Authentication → Policies

1. **Password Minimum Length:** ≥12 characters
2. **Password Requirements:**
   - ✅ Uppercase letters (A-Z)
   - ✅ Lowercase letters (a-z)
   - ✅ Numbers (0-9)
   - ✅ Special characters (!@#$%^&*)
3. **Leaked Password Protection:** ✅ ENABLED

### Access Path

```
https://supabase.com/dashboard/project/niorocndzcflrwdrofsp/auth/policies
```

---

## Test Procedure

### Test #1: Breached Password Rejection

**Action:**
1. Navigate to: https://niorocndzcflrwdrofsp.supabase.co/ (or production URL)
2. Open signup form
3. Attempt signup with known breached password:
   - Email: `test-breach-check@autorepai.ca`
   - Password: `password123456`

**Expected Result:**
```
❌ Error: "Password found in breach database"
OR
❌ Error: "This password is too common"
```

**Evidence Required:**
- Screenshot showing error message
- Browser DevTools → Network tab showing 400/422 response
- Timestamp in America/Edmonton timezone

---

### Test #2: Strong Password Acceptance

**Action:**
1. Attempt signup with compliant strong password:
   - Email: `test-strong-pass@autorepai.ca`
   - Password: `AutoRepAi2025!Secure#Pass`

**Expected Result:**
```
✅ Success: Account created
✅ Confirmation email sent (if email confirmation enabled)
```

**Evidence Required:**
- Screenshot showing success state
- Supabase Dashboard → Auth → Users showing new user
- Timestamp in America/Edmonton timezone

---

## Evidence Collection

### Required Screenshots

1. **Supabase Dashboard Config:**
   - Auth → Policies page showing all 3 settings enabled
   - Filename: `phase2-supabase-password-config.png`

2. **Breached Password Rejection:**
   - Signup form with error message visible
   - Browser console showing no JS errors
   - Network tab showing auth API rejection
   - Filename: `phase2-breached-password-rejected.png`

3. **Strong Password Success:**
   - Success confirmation screen
   - Supabase Users table showing new entry
   - Filename: `phase2-strong-password-accepted.png`

---

## Gate Approval Criteria

### ✅ PASS Conditions

1. Leaked Password Protection is **ENABLED** in Supabase Dashboard
2. Test #1 **REJECTS** breached password with clear error message
3. Test #2 **ACCEPTS** strong password and creates user account
4. All evidence screenshots collected with timestamps

### ❌ FAIL Conditions (NO-GO)

- Leaked Password Protection **NOT ENABLED**
- Breached password (`password123456`) is **ACCEPTED**
- Strong password is **REJECTED** incorrectly
- Missing evidence screenshots

---

## Failure Scenarios & Remediation

### Scenario 1: Leaked Password Protection Not Enabled

**Symptom:** Breached passwords are accepted  
**Impact:** CRITICAL — Users can use compromised credentials  

**Remediation:**
1. Open: https://supabase.com/dashboard/project/niorocndzcflrwdrofsp/auth/policies
2. Enable "Leaked Password Protection"
3. Re-test both scenarios
4. **DO NOT PROCEED** to Phase 3 until fixed

---

### Scenario 2: Breached Password Accepted

**Symptom:** `password123456` creates account successfully  
**Impact:** CRITICAL — Security control bypass  

**Remediation:**
1. Verify Leaked Password Protection toggle is **ON**
2. Check Supabase service status
3. Contact Supabase support if toggle is on but passwords still accepted
4. **BLOCK PRODUCTION DEPLOY** until resolved

---

### Scenario 3: Strong Password Rejected

**Symptom:** `AutoRepAi2025!Secure#Pass` fails validation  
**Impact:** HIGH — UX issue, may indicate config error  

**Remediation:**
1. Check minimum length setting (should be 12, not higher)
2. Verify all character class checkboxes are enabled
3. Test with different strong password format
4. If persists, file Supabase support ticket

---

## Manual Verification Steps

### Step 1: Open Test Environment

```bash
# Option A: Production URL (if Phase 4-5 complete)
open https://www.autorepai.ca/auth

# Option B: Staging URL
open https://niorocndzcflrwdrofsp.supabase.co/
```

### Step 2: Run Test #1 (Breached Password)

1. Open browser DevTools (F12)
2. Go to Network tab, filter: `auth`
3. Fill signup form:
   - Email: `test-breach-check-$(date +%s)@autorepai.ca`
   - Password: `password123456`
4. Click "Sign Up"
5. **Capture screenshot** when error appears
6. **Save HAR file** from Network tab

### Step 3: Run Test #2 (Strong Password)

1. Clear form
2. Fill signup form:
   - Email: `test-strong-pass-$(date +%s)@autorepai.ca`
   - Password: `AutoRepAi2025!Secure#Pass`
3. Click "Sign Up"
4. **Capture screenshot** when success appears
5. Open Supabase Dashboard → Auth → Users
6. **Capture screenshot** showing new user entry

### Step 4: Update This Document

```markdown
## Test Results

**Executed:** 2025-10-11 14:30 MDT (America/Edmonton)  
**Tester:** [Your Name]  

### Test #1: Breached Password
- Status: ✅ REJECTED / ❌ ACCEPTED
- Error Message: "[paste exact error]"
- Evidence: `artifacts/phase2/test1-rejection.png`

### Test #2: Strong Password
- Status: ✅ ACCEPTED / ❌ REJECTED
- User ID: [paste UUID from Supabase]
- Evidence: `artifacts/phase2/test2-success.png`
```

---

## Test Results

**Executed:** _[Pending]_  
**Tester:** _[Pending]_  

### Test #1: Breached Password
- Status: ⏳ NOT RUN
- Error Message: _[Pending]_
- Evidence: _[Pending]_

### Test #2: Strong Password
- Status: ⏳ NOT RUN
- User ID: _[Pending]_
- Evidence: _[Pending]_

---

## Evidence Attachments

### Screenshots

- [ ] `artifacts/phase2/supabase-config.png` — Dashboard password settings
- [ ] `artifacts/phase2/test1-rejection.png` — Breached password error
- [ ] `artifacts/phase2/test1-network.png` — Network tab showing API rejection
- [ ] `artifacts/phase2/test2-success.png` — Strong password success
- [ ] `artifacts/phase2/test2-users-table.png` — Supabase Users table entry

### Logs

- [ ] `artifacts/phase2/test1-har.har` — HAR file for Test #1
- [ ] `artifacts/phase2/test2-har.har` — HAR file for Test #2

---

## Security Impact Statement

**Why This Gate Exists:**

Leaked Password Protection prevents credential stuffing attacks by rejecting passwords that have appeared in known data breaches. Without this control:

- **Risk:** Attackers can use breach databases to gain unauthorized access
- **Compliance:** Violates OWASP ASVS 2.1.7, NIST 800-63B
- **Impact:** Potential data breach, loss of customer trust, legal liability

**Production Deploy Blocked Until:** ✅ Both tests pass with clear evidence

---

## Sign-Off

- [ ] Leaked Password Protection **ENABLED** in Supabase
- [ ] Test #1 **PASSED** (breached password rejected)
- [ ] Test #2 **PASSED** (strong password accepted)
- [ ] All screenshots collected and timestamped
- [ ] Evidence uploaded to `artifacts/phase2/`

**Approved By:** _[Pending]_  
**Date:** _[Pending]_  

---

## References

- [Supabase Auth Policies](https://supabase.com/docs/guides/auth/auth-password-policy)
- [OWASP ASVS 2.1.7](https://owasp.org/www-project-application-security-verification-standard/)
- [NIST 800-63B](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [HaveIBeenPwned Passwords](https://haveibeenpwned.com/Passwords)

---

**Next Phase:** Phase 3 — DB/RLS Audit (already ✅ PASSED)
