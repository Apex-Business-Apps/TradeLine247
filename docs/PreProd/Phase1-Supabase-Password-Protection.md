# Phase 1: Supabase Password Protection Configuration

**Status:** ⏳ Pending Manual Verification  
**Date:** 2025-01-XX  
**Tested By:** [Your Name]

---

## 🎯 Objective

Enable and verify Supabase Auth's Leaked Password Protection with strong password requirements:
- Minimum password length: **12 characters**
- Mixed character requirements (uppercase, lowercase, numbers, symbols)
- Block known breached passwords from HaveIBeenPwned database

---

## ⚙️ Configuration Steps

### 1. Access Supabase Auth Settings

Navigate to your Supabase Dashboard:
```
https://supabase.com/dashboard/project/niorocndzcflrwdrofsp/auth/policies
```

### 2. Enable Password Strength Requirements

In **Authentication** → **Policies** → **Password Strength**:

- ✅ **Minimum Length**: Set to `12` characters
- ✅ **Require Uppercase**: Enable
- ✅ **Require Lowercase**: Enable  
- ✅ **Require Numbers**: Enable
- ✅ **Require Symbols**: Enable (optional but recommended)

### 3. Enable Leaked Password Protection

In **Authentication** → **Policies** → **Leaked Password Protection**:

- ✅ **Enable Leaked Password Protection**: Toggle ON
- This integrates with HaveIBeenPwned's Pwned Passwords API
- Blocks passwords found in known data breaches

**Screenshot Placeholder:**
```
[INSERT: Screenshot of Supabase Auth Policies page showing all enabled settings]
```

---

## 🧪 Testing Protocol

### Test Case 1: Known Breached Password (MUST FAIL)

**Test Password:** `password123456` (known breached password)

**Steps:**
1. Navigate to Sign Up page: `https://www.autorepai.ca/auth`
2. Attempt to create a new test user:
   - Email: `test-breach-check@example.com`
   - Password: `password123456`
3. Click "Sign Up"

**Expected Result:** ❌ Registration blocked with error message:
```
"This password has been found in a data breach. Please choose a different password."
```

**Screenshot Placeholder:**
```
[INSERT: Screenshot showing rejected signup with breached password error]
```

### Test Case 2: Weak Password (MUST FAIL)

**Test Password:** `Short1!` (only 7 characters)

**Expected Result:** ❌ Registration blocked with error message:
```
"Password must be at least 12 characters long"
```

### Test Case 3: Strong, Non-Breached Password (MUST SUCCEED)

**Test Password:** `SecureT3st!Pass2025` (12+ chars, mixed case, numbers, symbols, not breached)

**Steps:**
1. Navigate to Sign Up page
2. Create test user:
   - Email: `test-secure-pass@example.com`
   - Password: `SecureT3st!Pass2025`
3. Click "Sign Up"

**Expected Result:** ✅ Registration succeeds

**Screenshot Placeholder:**
```
[INSERT: Screenshot showing successful signup with strong password]
```

---

## 📋 Verification Checklist

- [ ] **Config**: Minimum password length set to 12+ in Supabase Dashboard
- [ ] **Config**: Mixed character requirements enabled
- [ ] **Config**: Leaked Password Protection toggle is ON
- [ ] **Test 1**: Known breached password (`password123456`) is rejected
- [ ] **Test 2**: Weak password (`Short1!`) is rejected  
- [ ] **Test 3**: Strong password (`SecureT3st!Pass2025`) is accepted
- [ ] **Screenshots**: All three test results captured and attached
- [ ] **Cleanup**: Test accounts removed from Auth Users table

---

## 🚫 Common Breached Passwords to Test

Use any of these for negative testing (all should be blocked):

- `password123456`
- `qwerty123456`
- `letmein12345`
- `welcome123456`
- `P@ssw0rd1234`

**Source:** HaveIBeenPwned Top Breached Passwords

---

## ✅ Gate Approval Criteria

**Gate Status:** ⏳ **PENDING**

This gate is marked **GREEN** only when:

1. ✅ Supabase Dashboard screenshots confirm all settings enabled
2. ✅ Test Case 1 screenshot proves breached password was rejected
3. ✅ Test Case 2 screenshot proves weak password was rejected
4. ✅ Test Case 3 screenshot proves strong password was accepted
5. ✅ All verification checklist items are checked

---

## 📸 Evidence Attachments

### A. Supabase Dashboard Configuration
```
[INSERT: Full screenshot of Authentication → Policies page]
```

### B. Test Results
```
[INSERT: Side-by-side screenshots of all three test cases]
```

### C. Console Logs (if applicable)
```
[INSERT: Browser console showing any relevant auth errors]
```

---

## 🔗 References

- [Supabase Auth Password Policies](https://supabase.com/docs/guides/auth/passwords)
- [HaveIBeenPwned API](https://haveibeenpwned.com/API/v3#PwnedPasswords)
- [OWASP Password Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#implement-proper-password-strength-controls)

---

## 📝 Manual Steps Required

**⚠️ Important:** These settings must be configured manually in the Supabase Dashboard. Lovable cannot automate this configuration.

**Action Items:**
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard/project/niorocndzcflrwdrofsp)
2. Navigate to **Authentication** → **Policies**
3. Enable all settings as documented above
4. Run all three test cases
5. Capture screenshots of results
6. Update this document with actual screenshots
7. Mark gate as ✅ GREEN when all tests pass

---

**Last Updated:** 2025-01-XX  
**Next Review:** After manual configuration and testing complete
