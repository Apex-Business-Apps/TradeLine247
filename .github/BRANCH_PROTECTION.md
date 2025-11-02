# Branch Protection Configuration Guide

## 🛡️ **ENTERPRISE-GRADE BRANCH PROTECTION SETTINGS**

This document provides step-by-step instructions for configuring branch protection rules to ensure all code changes meet security and quality standards before merging.

---

## 📋 **Required Branch Protection Rules**

### **For `main` and `master` branches:**

Navigate to: **Settings → Branches → Add branch protection rule**

### **1. Branch name pattern**
```
main
```
(Create separate rules for `master` if you use both)

### **2. Protect matching branches**

✅ **Require a pull request before merging**
- ✅ Require approvals: `1`
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from Code Owners (if CODEOWNERS file exists)

✅ **Require status checks to pass before merging**
- ✅ Require branches to be up to date before merging

**Required status checks** (add all of these):
```
ci/build
ci/lint
ci/test
security/codeql
security/npm-audit
security-checks
```

✅ **Require conversation resolution before merging**
- Ensures all PR comments are addressed

✅ **Require signed commits**
- Recommended for enterprise environments

✅ **Require linear history**
- Prevents merge commits, enforces rebase/squash

✅ **Include administrators**
- Applies rules to repository administrators

✅ **Restrict who can push to matching branches**
- Leave empty to allow all repository members (recommended)
- OR specify teams/users for stricter control

✅ **Allow force pushes**
- ❌ **DISABLED** (Never allow force pushes to main/master)

✅ **Allow deletions**
- ❌ **DISABLED** (Never allow branch deletion)

---

## 🔍 **Status Check Details**

### **CI Status Checks** (from `.github/workflows/ci.yml`):
- **`ci/build`** - Verifies the application builds successfully
- **`ci/lint`** - Ensures code style and quality standards
- **`ci/test`** - Runs all test suites (166 tests must pass)

### **Security Status Checks**:
- **`security/codeql`** - CodeQL static analysis (from `.github/workflows/codeql-analysis.yml`)
- **`security/npm-audit`** - NPM dependency vulnerability scanning (from `.github/workflows/security-scan.yml`)
- **`security-checks`** - Twilio webhook security validation (from `.github/workflows/security.yml`)

---

## ⚙️ **Auto-merge Configuration**

### **For Lovable PRs** (`.github/workflows/auto-merge-lovable.yml`):

The auto-merge workflow requires ALL status checks to pass before merging:

```yaml
# These checks must pass:
- ci/build ✅
- ci/lint ✅
- ci/test ✅
- security/codeql ✅
- security/npm-audit ✅
- security-checks ✅
```

**How it works:**
1. Lovable creates a PR
2. All CI and security checks run automatically
3. PR auto-merges ONLY if all checks pass
4. If any check fails, PR remains open for manual review

---

## 🔒 **Security Gate: Twilio Webhooks**

### **Critical Security Check** (`.github/workflows/security.yml`):

```bash
ALLOW_INSECURE_TWILIO_WEBHOOKS=false  # Must be false in production
```

**Enforcement:**
- Blocks merges if `ALLOW_INSECURE_TWILIO_WEBHOOKS=true` in production
- Validates Twilio signature verification is enabled
- Runs on every push and PR

**Server-side validation:**
- `supabase/functions/_shared/twilio_sig.ts` - Signature validation
- `supabase/functions/_shared/twilioValidator.ts` - Core validator

---

## 📊 **Verification Steps**

### **1. Verify Branch Protection is Active**
```bash
# Check via GitHub CLI
gh api repos/:owner/:repo/branches/main/protection | jq .

# Expected output should show:
# - required_status_checks
# - required_pull_request_reviews
# - enforce_admins
```

### **2. Test Status Checks**
```bash
# Trigger CI locally
npm run build
npm run lint
npm run test

# All should pass before pushing
```

### **3. Verify Auto-merge**
```bash
# Check workflow status
gh workflow view "Auto-merge Lovable PRs"

# List recent runs
gh run list --workflow=auto-merge-lovable.yml
```

---

## 🚨 **Critical Production Secrets**

### **Environment Variables Audit:**

#### **✅ SAFE - Public Frontend Variables** (in `.env.example`):
```bash
VITE_SUPABASE_URL=https://hysvqdwmhxnblxfqnszn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...  # Public anon key (safe)
BASE_URL=https://www.tradeline247ai.com
```

These are SAFE to be public because:
- Supabase anon key has Row Level Security (RLS) policies
- URL is public anyway
- No elevated privileges

#### **🔒 SECURE - Server-side Secrets** (GitHub Secrets only):
```bash
SUPABASE_SERVICE_ROLE_KEY  # Never in .env, only GitHub Secrets
TWILIO_AUTH_TOKEN          # Never in .env, only GitHub Secrets
TWILIO_ACCOUNT_SID         # Server-side only
RESEND_API_KEY             # Server-side only
```

**Verification:**
```bash
# Audit .env files for secrets
grep -r "SERVICE_ROLE_KEY" . --exclude-dir=node_modules
grep -r "AUTH_TOKEN" . --exclude-dir=node_modules

# Should ONLY appear in:
# - .env.example (as placeholder)
# - .github/workflows/*.yml (as ${{ secrets.* }})
```

---

## 🔄 **Secret Rotation Schedule**

After enabling security scans, rotate the following:

1. **Supabase Service Role Key**
   - Rotate immediately after enabling CodeQL
   - Update GitHub Secret: `SUPABASE_SERVICE_ROLE_KEY`
   - Update in Vercel/deployment platform

2. **Twilio Auth Token**
   - Rotate quarterly or after any security scan alerts
   - Update GitHub Secret: `TWILIO_AUTH_TOKEN`
   - Update all webhook configurations

3. **API Keys**
   - Resend API: Rotate semi-annually
   - Any third-party integrations: Follow vendor guidelines

---

## 📋 **Implementation Checklist**

```
[ ] Configure branch protection for main branch
[ ] Add all 6 required status checks
[ ] Enable "Require conversation resolution"
[ ] Enable "Require signed commits" (recommended)
[ ] Disable force pushes and deletions
[ ] Verify security-checks workflow runs on PR
[ ] Verify CodeQL workflow runs on PR
[ ] Verify npm-audit workflow runs on PR
[ ] Test auto-merge with a sample Lovable PR
[ ] Audit all .env files for leaked secrets
[ ] Rotate secrets after security scan enablement
[ ] Document secret rotation schedule
[ ] Set up alerts for failed security checks
```

---

## 🎯 **Testing Branch Protection**

### **Create a test PR:**
```bash
git checkout -b test/branch-protection
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "Test: Branch protection"
git push origin test/branch-protection
gh pr create --title "Test: Branch Protection" --body "Testing required status checks"
```

### **Expected behavior:**
1. ✅ CI workflows trigger automatically
2. ✅ Security workflows trigger automatically
3. ⏸️ Merge button is blocked until all checks pass
4. ✅ After all checks pass, merge button becomes available
5. ✅ PR can be merged (or auto-merged by Lovable)

---

## 🔧 **Troubleshooting**

### **Status check not appearing:**
```bash
# Check workflow runs
gh run list --branch=your-branch

# Check workflow file syntax
yamllint .github/workflows/ci.yml
```

### **Auto-merge not working:**
```bash
# Check auto-merge workflow status
gh workflow view "Auto-merge Lovable PRs"

# Verify PR is from Lovable (lovable-dev user)
gh pr view --json author

# Check if all required checks passed
gh pr checks
```

### **Security check failing:**
```bash
# View security workflow logs
gh run view --job=security-checks

# Check Twilio configuration
echo $ALLOW_INSECURE_TWILIO_WEBHOOKS  # Should be 'false' or empty
```

---

## 📚 **Additional Resources**

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [npm audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Twilio Webhook Security](https://www.twilio.com/docs/usage/webhooks/webhooks-security)

---

## ✅ **Success Criteria**

Branch protection is properly configured when:

1. ✅ No PR can be merged without passing ALL status checks
2. ✅ All 6 required checks are enforced
3. ✅ Auto-merge only works after checks pass
4. ✅ Lovable PRs merge automatically after validation
5. ✅ Manual PRs require approval + passing checks
6. ✅ Force pushes are blocked
7. ✅ Twilio webhook security is enforced
8. ✅ No secrets leaked in client code

---

**Last Updated:** 2025-11-02
**Maintained By:** DevOps/Security Team
**Review Schedule:** Quarterly
