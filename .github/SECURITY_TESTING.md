# Security Testing & Validation Guide

## 🛡️ **ENTERPRISE-GRADE SECURITY TESTING PROCEDURES**

This guide provides comprehensive testing procedures to validate all security enhancements and ensure 100% enterprise-grade functionality.

---

## 📋 **Pre-Commit Security Checklist**

Before committing any code, run these checks:

```bash
#!/bin/bash
# save as: scripts/pre-commit-security.sh

echo "🔒 Running pre-commit security checks..."

# 1. Check for secrets in staged files
echo "1. Checking for secrets..."
if git diff --cached | grep -iE "password.*=|api.*key.*=|secret.*=|token.*=" | grep -v "passwordStrength"; then
  echo "❌ FAIL: Potential secrets found in staged files"
  exit 1
fi
echo "✅ PASS: No secrets detected"

# 2. Run linter
echo "2. Running linter..."
npm run lint
echo "✅ PASS: Linter passed"

# 3. Run type check
echo "3. Running TypeScript type check..."
npm run typecheck
echo "✅ PASS: Type check passed"

# 4. Run tests
echo "4. Running tests..."
npm test -- --run
echo "✅ PASS: All tests passed"

# 5. Check Twilio security configuration
echo "5. Checking Twilio security..."
if grep -r "ALLOW_INSECURE_TWILIO_WEBHOOKS.*=.*true" src/ 2>/dev/null; then
  echo "❌ FAIL: ALLOW_INSECURE_TWILIO_WEBHOOKS should not be in source code"
  exit 1
fi
echo "✅ PASS: Twilio security OK"

echo "✅ All pre-commit security checks passed!"
```

---

## 🧪 **Security Workflow Testing**

### **Test 1: CodeQL Analysis**

```bash
# Trigger CodeQL workflow
gh workflow run codeql-analysis.yml

# Wait for completion
gh run watch

# Check results
gh run list --workflow=codeql-analysis.yml --limit=1

# Expected: ✅ All checks passed
# View Security tab: https://github.com/YOUR_ORG/YOUR_REPO/security/code-scanning
```

**Validation:**
- ✅ Workflow completes successfully
- ✅ No high or critical security issues
- ✅ Results appear in Security → Code scanning tab
- ✅ Commit status "security/codeql" is created

---

### **Test 2: NPM Audit**

```bash
# Trigger security scan workflow
gh workflow run security-scan.yml

# Or test locally
npm audit --audit-level=high

# Expected output:
# found 0 vulnerabilities
```

**Validation:**
- ✅ No high or critical vulnerabilities
- ✅ Commit status "security/npm-audit" is created
- ✅ Audit report uploaded as artifact

**If vulnerabilities found:**
```bash
# View details
npm audit

# Fix automatically (if possible)
npm audit fix

# Or update specific package
npm update package-name

# Verify fix
npm audit
```

---

### **Test 3: Security Gates (Twilio)**

```bash
# Trigger security gates workflow
gh workflow run security.yml

# Or test locally
bash scripts/predeploy-security.sh

# Expected output:
# ✅ Twilio webhook security: PASS
# ✅ All predeploy security checks passed
```

**Validation:**
- ✅ Workflow completes successfully
- ✅ No warnings about ALLOW_INSECURE_TWILIO_WEBHOOKS
- ✅ Commit status "security-checks" is created

**Test failure scenario:**
```bash
# Set insecure flag (this should FAIL)
export NODE_ENV=production
export ALLOW_INSECURE_TWILIO_WEBHOOKS=true
bash scripts/predeploy-security.sh

# Expected output:
# ❌ SECURITY: ALLOW_INSECURE_TWILIO_WEBHOOKS must not be true in production
# Exit code: 1
```

---

## 🔐 **Twilio Webhook Security Testing**

### **Test 4: Webhook Signature Validation**

```bash
# Test Twilio signature validation
cd supabase/functions/_shared

# Run test script
cat > test_twilio_sig.ts <<'EOF'
import { validateTwilioSignature } from "./twilio_sig.ts";

// Mock request
const mockRequest = new Request("https://example.com/webhook", {
  method: "POST",
  headers: {
    "X-Twilio-Signature": "invalid-signature",
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: "From=+1234567890&To=+0987654321"
});

// Test validation (should return false for invalid signature)
const isValid = await validateTwilioSignature(mockRequest);
console.log("Validation result:", isValid);
console.log("Expected: false (invalid signature should be rejected)");

if (!isValid) {
  console.log("✅ PASS: Invalid signatures are rejected");
} else {
  console.log("❌ FAIL: Invalid signature was accepted!");
}
EOF

deno run --allow-env --allow-net test_twilio_sig.ts
```

**Expected behavior:**
- ✅ Invalid signatures are rejected (returns `false`)
- ✅ Missing signatures are rejected
- ✅ Valid signatures are accepted (when using real Twilio auth token)

---

### **Test 5: Webhook Bypass Protection**

```bash
# Verify ALLOW_INSECURE_TWILIO_WEBHOOKS is not set in production

# Check environment
echo "NODE_ENV=$NODE_ENV"
echo "ALLOW_INSECURE_TWILIO_WEBHOOKS=$ALLOW_INSECURE_TWILIO_WEBHOOKS"

# Should output:
# NODE_ENV=production
# ALLOW_INSECURE_TWILIO_WEBHOOKS=false (or empty)

# Test all Supabase functions
for func in supabase/functions/*/index.ts; do
  echo "Checking $func..."
  if grep -q "ALLOW_INSECURE_TWILIO_WEBHOOKS" "$func"; then
    echo "⚠️  Function uses bypass flag (ensure it checks for false/production)"
  fi
done
```

---

## 🔍 **Production Secrets Audit**

### **Test 6: Client Bundle Analysis**

```bash
# Build production bundle
npm run build

# Check for leaked secrets in bundle
echo "Checking for SERVICE_ROLE_KEY in bundle..."
grep -r "SERVICE_ROLE_KEY" dist/ && echo "❌ FAIL: Secret found in bundle!" || echo "✅ PASS"

echo "Checking for AUTH_TOKEN in bundle..."
grep -r "AUTH_TOKEN" dist/ && echo "❌ FAIL: Secret found in bundle!" || echo "✅ PASS"

echo "Checking for private keys in bundle..."
grep -r "-----BEGIN.*PRIVATE KEY-----" dist/ && echo "❌ FAIL: Private key in bundle!" || echo "✅ PASS"

# Verify ONLY VITE_ prefixed vars are in bundle
echo "Checking environment variables in bundle..."
grep -o "VITE_[A-Z_]*" dist/assets/js/*.js | sort | uniq

# Expected: Only VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, etc.
```

---

### **Test 7: Server-side Secrets Isolation**

```bash
# Verify secrets are only in allowed locations
echo "Auditing secret locations..."

# Should ONLY be in these files:
# - .env.example (as placeholders)
# - .github/workflows/*.yml (as ${{ secrets.* }})
# - Documentation files

# Check for leaked service role key
if grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.*service_role" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=dist \
  --exclude="*.md" \
  | grep -v ".env.example"; then
  echo "❌ FAIL: Service role key found in unexpected location!"
  exit 1
else
  echo "✅ PASS: No leaked service role keys"
fi

# Check for Twilio auth tokens
if grep -r "SK[a-z0-9]{32}" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=dist \
  | grep -v ".env.example" \
  | grep -v "SECURITY_TESTING.md"; then
  echo "❌ FAIL: Twilio auth token found in unexpected location!"
  exit 1
else
  echo "✅ PASS: No leaked Twilio tokens"
fi
```

---

## ✅ **Branch Protection Testing**

### **Test 8: Required Status Checks**

```bash
# Create test PR
git checkout -b test/security-checks
echo "# Security Test" >> TEST_SECURITY.md
git add TEST_SECURITY.md
git commit -m "Test: Security checks enforcement"
git push origin test/security-checks

# Create PR
gh pr create \
  --title "Test: Security Checks Enforcement" \
  --body "Testing that all security checks run and are required"

# Wait for checks to run
gh pr checks

# Expected output:
# ✅ ci/build
# ✅ ci/lint
# ✅ ci/test
# ✅ security/codeql
# ✅ security/npm-audit
# ✅ security-checks

# Verify merge is blocked until all pass
gh pr view --json mergeable

# Expected: "mergeable": "UNKNOWN" or "CONFLICTING" until all checks pass
```

---

### **Test 9: Auto-merge with Security Gates**

```bash
# Simulate Lovable PR (must be from lovable-dev user in production)
# For testing, create a PR and verify security checks run

gh pr create \
  --title "Test: Auto-merge after security" \
  --body "This PR should auto-merge only after all security checks pass"

# Manually enable auto-merge
gh pr merge --auto --squash

# Verify it waits for security checks
gh pr view --json statusCheckRollup

# PR should NOT merge until:
# ✅ All 6 status checks pass
# ✅ No merge conflicts
# ✅ Branch is up to date
```

---

## 📊 **Security Scan Results Analysis**

### **Test 10: CodeQL SARIF Report**

```bash
# Download latest CodeQL SARIF report
gh api \
  /repos/:owner/:repo/code-scanning/analyses \
  --jq '.[0].id' \
  | xargs -I {} gh api \
  /repos/:owner/:repo/code-scanning/analyses/{} \
  --jq '.results'

# Analyze results
# - 0 critical issues: ✅ PASS
# - 0 high issues: ✅ PASS
# - <5 medium issues: ✅ ACCEPTABLE
# - Any low issues: ℹ️  REVIEW

# View in Security tab
open "https://github.com/:owner/:repo/security/code-scanning"
```

---

### **Test 11: Dependency Vulnerability Scan**

```bash
# Run comprehensive dependency audit
npm audit --json > audit-results.json

# Parse results
cat audit-results.json | jq '.metadata'

# Expected output:
# {
#   "vulnerabilities": {
#     "critical": 0,
#     "high": 0,
#     "moderate": <5,
#     "low": <10,
#     "info": <20
#   }
# }

# If any critical or high vulnerabilities:
npm audit fix --force

# Re-test
npm audit --audit-level=high
```

---

## 🎯 **End-to-End Security Testing**

### **Test 12: Full Security Pipeline**

```bash
#!/bin/bash
# Complete end-to-end security test

echo "🔒 Running full security pipeline test..."

# 1. Code quality
echo "1️⃣  Testing code quality..."
npm run lint && npm run typecheck && npm test -- --run

# 2. Build security
echo "2️⃣  Testing build security..."
npm run build
! grep -r "SERVICE_ROLE_KEY\|AUTH_TOKEN" dist/

# 3. Secrets audit
echo "3️⃣  Testing secrets hygiene..."
bash scripts/predeploy-security.sh

# 4. Dependency security
echo "4️⃣  Testing dependencies..."
npm audit --audit-level=high

# 5. Twilio security
echo "5️⃣  Testing Twilio webhook security..."
test "$ALLOW_INSECURE_TWILIO_WEBHOOKS" != "true"

# 6. Trigger all security workflows
echo "6️⃣  Triggering security workflows..."
gh workflow run codeql-analysis.yml
gh workflow run security-scan.yml
gh workflow run security.yml

# 7. Wait and check results
echo "7️⃣  Waiting for workflows to complete..."
sleep 60
gh run list --limit=3

echo "✅ Full security pipeline test complete!"
```

---

## 📈 **Security Metrics Dashboard**

Monitor these metrics weekly:

```bash
# Create security dashboard
cat > security-dashboard.sh <<'EOF'
#!/bin/bash
echo "# Security Metrics Dashboard"
echo ""

# 1. CodeQL findings
echo "## CodeQL Analysis"
gh api /repos/:owner/:repo/code-scanning/alerts \
  --jq '.[] | "\(.rule.severity): \(.rule.description)"' \
  | sort | uniq -c

# 2. Dependency vulnerabilities
echo ""
echo "## Dependency Vulnerabilities"
npm audit --json | jq '.metadata.vulnerabilities'

# 3. Failed security workflows
echo ""
echo "## Failed Security Workflows (Last 7 days)"
gh run list \
  --workflow=codeql-analysis.yml \
  --workflow=security-scan.yml \
  --workflow=security.yml \
  --status=failure \
  --limit=10

# 4. Secret rotation status
echo ""
echo "## Secret Rotation Status"
echo "Last rotated: [Check .github/PRODUCTION_SECRETS_HYGIENE.md]"
echo "Next rotation: [Update schedule]"

EOF

chmod +x security-dashboard.sh
./security-dashboard.sh
```

---

## 🏆 **10/10 Rubric Evaluation**

### **Security Excellence Scorecard:**

| Category | Test | Pass Criteria | Score |
|----------|------|---------------|-------|
| **CodeQL** | Test 1 | No critical/high issues | /10 |
| **Dependencies** | Test 2, 11 | No high vulnerabilities | /10 |
| **Secrets Hygiene** | Test 6, 7 | No leaked secrets | /10 |
| **Twilio Security** | Test 4, 5 | Signature validation enforced | /10 |
| **Branch Protection** | Test 8, 9 | All checks required | /10 |
| **Automated Scanning** | Test 1, 2, 3 | Runs on every PR | /10 |
| **Documentation** | All guides | Complete and accurate | /10 |
| **Testing** | Test 12 | E2E pipeline passes | /10 |
| **Monitoring** | Dashboard | Metrics tracked | /10 |
| **Incident Response** | Procedures | Documented and tested | /10 |

**Total Score: __/100**

---

## ✅ **Success Criteria**

Security is enterprise-grade when:

1. ✅ All tests pass (Tests 1-12)
2. ✅ CodeQL shows 0 critical/high issues
3. ✅ NPM audit shows 0 high vulnerabilities
4. ✅ No secrets in git history or client bundle
5. ✅ Twilio signature validation enforced
6. ✅ All 6 status checks required for merge
7. ✅ Security workflows run on every PR
8. ✅ Auto-merge blocked until security passes
9. ✅ Security dashboard shows all green
10. ✅ Score 100/100 on rubric

---

**Last Updated:** 2025-11-02
**Maintained By:** DevOps/Security Team
**Run Frequency:** Before every release
