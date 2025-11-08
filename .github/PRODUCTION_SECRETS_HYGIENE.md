# Production Secrets Hygiene Guide

## 🔒 **ENTERPRISE-GRADE SECRETS MANAGEMENT**

This document outlines best practices for managing secrets, environment variables, and sensitive configuration in the TradeLine 24/7 application.

---

## 📊 **Environment Variables Classification**

### **✅ SAFE - Public Frontend Variables** (can be committed)

These variables are prefixed with `VITE_` and are embedded in the client-side bundle. They are public by design.

```bash
# Supabase Public Configuration
VITE_SUPABASE_URL=https://hysvqdwmhxnblxfqnszn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Analytics (Public Write Keys Only)
VITE_KLAVIYO_PUBLIC_KEY=V9wSeR

# Application Configuration
VITE_APP_NAME=TradeLine 24/7
VITE_APP_URL=https://www.tradeline247ai.com
```

**Why these are safe:**
- Supabase `anon` key has Row Level Security (RLS) enforced
- Only allows access to public data and authenticated user data
- Cannot bypass RLS policies
- Required for client-side Supabase SDK

**Verification:**
```bash
# These should ONLY appear in:
# 1. .env.example (as template)
# 2. Client-side code (src/**/*.ts, src/**/*.tsx)
# 3. index.html (for analytics scripts)
```

---

### **🔒 CRITICAL - Server-side Secrets** (NEVER commit)

These MUST ONLY exist in:
- GitHub Secrets (for CI/CD)
- Vercel/deployment platform environment variables
- Local `.env.local` (gitignored)

```bash
# Supabase Service Role (CRITICAL)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# ⚠️  This bypasses ALL RLS policies - NEVER expose to client

# Twilio Credentials (CRITICAL)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
# ⚠️  Required for webhook signature validation

# Email Service (CRITICAL)
RESEND_API_KEY=re_...
# ⚠️  Allows sending emails on your behalf

# Security Flags (CRITICAL)
ALLOW_INSECURE_TWILIO_WEBHOOKS=false
# ⚠️  Must be false in production, true only for local development
NODE_ENV=production
```

---

## 🛡️ **Security Boundaries**

### **1. Client-side Code (src/)**
```typescript
// ✅ SAFE - Using public anon key
import { supabase } from '@/integrations/supabase/client';

// The client uses VITE_SUPABASE_ANON_KEY
// This is protected by RLS policies on the database

// ❌ NEVER DO THIS IN CLIENT CODE:
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // WRONG!
```

### **2. Server-side Code (supabase/functions/)**
```typescript
// ✅ CORRECT - Server-side secrets
const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// These are NOT bundled into client code
// Only available in Supabase Edge Functions runtime
```

### **3. GitHub Actions (. github/workflows/)**
```yaml
# ✅ CORRECT - Using GitHub Secrets
env:
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
  TWILIO_AUTH_TOKEN: ${{ secrets.TWILIO_AUTH_TOKEN }}

# ❌ NEVER hardcode secrets in workflows
```

---

## 🔍 **Audit Procedures**

### **1. Manual Audit** (run before every release)

```bash
# Check for leaked service role keys
grep -r "SERVICE_ROLE_KEY" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=dist \
  --exclude="*.md" \
  | grep -v ".env.example" \
  | grep -v "PRODUCTION_SECRETS_HYGIENE.md"

# Should return NO results

# Check for leaked auth tokens
grep -r "TWILIO_AUTH_TOKEN" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=dist \
  --exclude="*.md" \
  | grep -v ".env.example" \
  | grep -v "PRODUCTION_SECRETS_HYGIENE.md"

# Should return NO results (except in .github/workflows/ as ${{ secrets.* }})

# Check for hardcoded passwords
grep -r "password.*=" src/ \
  --include="*.ts" \
  --include="*.tsx" \
  | grep -v "passwordStrength" \
  | grep -v "passwordError" \
  | grep -v "passwordField"

# Should return NO results
```

### **2. Automated Audit** (runs in CI)

**Location:** `.github/workflows/security-scan.yml`

```bash
# Runs automatically on every PR
# Checks for:
# - Hardcoded passwords
# - API keys in source code
# - Secrets in configuration files

# View results:
gh run view --job=dependency-check
```

### **3. CodeQL Analysis** (runs in CI)

**Location:** `.github/workflows/codeql-analysis.yml`

Scans for:
- Hardcoded credentials
- SQL injection vulnerabilities
- XSS vulnerabilities
- Insecure randomness
- Path traversal
- And 200+ other security issues

---

## 🔄 **Secret Rotation Policy**

### **Immediate Rotation Required:**

Rotate immediately if:
- ✅ Secret appears in git history (even if removed later)
- ✅ Secret was committed to public repository
- ✅ Security scan detects potential exposure
- ✅ Employee with access leaves the company
- ✅ Breach or security incident occurs

### **Scheduled Rotation:**

| Secret Type | Rotation Frequency | Last Rotated | Next Rotation |
|-------------|-------------------|--------------|---------------|
| Supabase Service Role Key | Quarterly | - | - |
| Twilio Auth Token | Quarterly | - | - |
| Resend API Key | Semi-annually | - | - |
| GitHub Personal Access Tokens | Quarterly | - | - |

### **Rotation Procedure:**

#### **Supabase Service Role Key:**
```bash
# 1. Generate new key in Supabase dashboard
# Settings → API → Service Role Key → Reset

# 2. Update GitHub Secrets
gh secret set SUPABASE_SERVICE_ROLE_KEY < new-key.txt

# 3. Update Vercel
vercel env rm SUPABASE_SERVICE_ROLE_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production < new-key.txt

# 4. Redeploy
vercel --prod

# 5. Verify all functions work
npm run test:integration
```

#### **Twilio Auth Token:**
```bash
# 1. Generate new token in Twilio console
# Account → API Keys & Tokens → Create new token

# 2. Update GitHub Secrets
gh secret set TWILIO_AUTH_TOKEN < new-token.txt

# 3. Update all Supabase functions that use Twilio
supabase secrets set TWILIO_AUTH_TOKEN < new-token.txt

# 4. Verify webhook signatures
npm run test:twilio-webhooks
```

---

## 📋 **Pre-deployment Checklist**

Before every production deployment:

```bash
# 1. Verify no secrets in source code
npm run audit:secrets

# 2. Verify .env.local is gitignored
test -f .gitignore && grep -q ".env.local" .gitignore

# 3. Verify .env.example has no real secrets
! grep -E "eyJ|sk_live|pk_live" .env.example

# 4. Run security gates
bash scripts/predeploy-security.sh

# 5. Verify Twilio webhook security
test "$ALLOW_INSECURE_TWILIO_WEBHOOKS" != "true" || exit 1

# 6. All checks pass
echo "✅ All security checks passed"
```

---

## 🚨 **Incident Response**

### **If a secret is leaked:**

**IMMEDIATE ACTIONS (within 1 hour):**

1. **Rotate the leaked secret immediately**
   ```bash
   # Example for Supabase service key
   gh secret set SUPABASE_SERVICE_ROLE_KEY < new-key.txt
   ```

2. **Revoke the old secret**
   - Supabase: Dashboard → API → Reset key
   - Twilio: Console → Revoke token
   - Resend: Dashboard → Delete API key

3. **Audit access logs**
   ```bash
   # Check Supabase logs for unauthorized access
   supabase db logs --filter "service_role"

   # Check Twilio usage for unexpected calls
   # Twilio Console → Monitor → Logs
   ```

4. **Notify the team**
   - Post in #security Slack channel
   - Create incident ticket
   - Update incident log

**FOLLOW-UP ACTIONS (within 24 hours):**

5. **Investigate the leak**
   - How did it happen?
   - What was exposed?
   - For how long?

6. **Prevent recurrence**
   - Add pre-commit hooks
   - Update documentation
   - Train team members

7. **Document the incident**
   - Create post-mortem
   - Update runbooks
   - Review with team

---

## 🔧 **Developer Setup**

### **Local Development**

1. **Copy .env.example to .env.local**
   ```bash
   cp .env.example .env.local
   ```

2. **NEVER commit .env.local**
   ```bash
   # Verify it's gitignored
   git check-ignore .env.local
   # Should output: .env.local
   ```

3. **Get secrets from password manager or team lead**
   ```bash
   # DO NOT share secrets via:
   # - Email
   # - Slack
   # - Text message
   # - Git commits

   # DO share via:
   # - 1Password/LastPass
   # - Encrypted channels
   # - In-person transfer
   ```

4. **For local Twilio testing, use ngrok**
   ```bash
   # Set ALLOW_INSECURE_TWILIO_WEBHOOKS=true in .env.local ONLY
   echo "ALLOW_INSECURE_TWILIO_WEBHOOKS=true" >> .env.local

   # Start ngrok
   ngrok http 8080

   # Use ngrok URL for Twilio webhooks
   ```

---

## 📖 **Git History Cleanup**

### **If a secret was committed:**

```bash
# 1. Use BFG Repo-Cleaner (recommended)
brew install bfg
bfg --replace-text secrets.txt  # File with secrets to remove
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 2. OR use git-filter-repo
pip install git-filter-repo
git filter-repo --path-glob '*.env' --invert-paths

# 3. Force push (requires admin access)
git push origin --force --all
git push origin --force --tags

# 4. Notify all contributors to re-clone
# They must delete their local repo and re-clone
```

**⚠️ WARNING:** This rewrites git history. Only do this if absolutely necessary and coordinate with the entire team.

---

## ✅ **Verification Tests**

### **1. Client Bundle Test**
```bash
# Build production bundle
npm run build

# Search for secrets in bundle
grep -r "SERVICE_ROLE_KEY" dist/
grep -r "AUTH_TOKEN" dist/

# Should return NO results
```

### **2. Environment Variable Test**
```bash
# Start dev server
npm run dev

# In browser console:
console.log(import.meta.env)

# Should ONLY show VITE_* variables
# Should NOT show SERVICE_ROLE_KEY or AUTH_TOKEN
```

### **3. Server Function Test**
```bash
# Test Supabase function can access secrets
supabase functions serve voice-frontdoor

# Should have access to Deno.env.get("TWILIO_AUTH_TOKEN")
# Should NOT be accessible from client
```

---

## 📚 **Additional Resources**

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [Twilio Security Best Practices](https://www.twilio.com/docs/usage/security)

---

## 🎯 **Success Criteria**

Secrets hygiene is properly maintained when:

1. ✅ Zero secrets in git history
2. ✅ Zero secrets in client bundle (dist/)
3. ✅ All server secrets in GitHub Secrets/Vercel
4. ✅ .env.local is gitignored
5. ✅ .env.example has no real values
6. ✅ Automated scans pass on every PR
7. ✅ Rotation schedule is followed
8. ✅ Incident response plan is documented

---

**Last Updated:** 2025-11-02
**Maintained By:** DevOps/Security Team
**Review Schedule:** Monthly
**Next Rotation Due:** [Set dates for each secret type]
