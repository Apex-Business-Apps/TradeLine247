# Phase 4: Security Headers Baseline Check

**Purpose:** Automated verification that essential security headers remain in place while allowing embed functionality.

## Test Configuration

**Test File:** `tests/security/security-baseline.spec.ts` (to be created)  
**CI Job:** `security-baseline` in `.github/workflows/ci.yml`

## Required Security Headers

### 1. Content-Security-Policy (CSP)

**Requirement:**
```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  font-src 'self' data:; 
  connect-src 'self' https://niorocndzcflrwdrofsp.supabase.co wss://niorocndzcflrwdrofsp.supabase.co https://api.lovable.app; 
  frame-ancestors 'self' https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app; 
  base-uri 'self'; 
  form-action 'self';
```

**Critical Elements:**
- ✅ `default-src 'self'` - Default fallback to same-origin
- ✅ `frame-ancestors` - Clickjacking protection with Lovable allow-list
- ✅ `connect-src` - Supabase and Lovable API allowed
- ⚠️ `unsafe-inline`, `unsafe-eval` - Required for React dev (acceptable risk)

**Test:**
```typescript
expect(csp).toBeDefined();
expect(csp).toContain("frame-ancestors 'self' https://*.lovable.dev");
expect(csp).toContain("default-src 'self'");
```

---

### 2. X-Content-Type-Options

**Requirement:**
```
X-Content-Type-Options: nosniff
```

**Purpose:** Prevents MIME-sniffing attacks

**Test:**
```typescript
expect(headers['x-content-type-options']).toBe('nosniff');
```

---

### 3. X-XSS-Protection

**Requirement:**
```
X-XSS-Protection: 1; mode=block
```

**Purpose:** Legacy XSS protection (defense-in-depth)

**Test:**
```typescript
expect(headers['x-xss-protection']).toBe('1; mode=block');
```

---

### 4. Referrer-Policy

**Requirement:**
```
Referrer-Policy: strict-origin-when-cross-origin
```

**Purpose:** Limits referrer information leakage

**Test:**
```typescript
expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
```

---

### 5. Permissions-Policy

**Requirement:**
```
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()
```

**Purpose:** Disables unused browser features

**Test:**
```typescript
expect(headers['permissions-policy']).toBeDefined();
expect(headers['permissions-policy']).toContain('geolocation=()');
expect(headers['permissions-policy']).toContain('camera=()');
```

---

### 6. Strict-Transport-Security (HSTS)

**Requirement:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

**Purpose:** Forces HTTPS connections

**Test:**
```typescript
expect(headers['strict-transport-security']).toContain('max-age=31536000');
expect(headers['strict-transport-security']).toContain('includeSubDomains');
```

---

## Explicitly Absent Headers

### X-Frame-Options

**Status:** ❌ MUST NOT be present

**Reason:** 
- Obsolete (CSP `frame-ancestors` is superior)
- Overrides CSP in some browsers
- Breaks Lovable preview embedding

**Test:**
```typescript
expect(headers['x-frame-options']).toBeUndefined();
```

**Historical Context:** See `docs/EMBED_FIX_REPORT.md`

---

## Test Implementation

### Create Test File

**File:** `tests/security/security-baseline.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Security Baseline Headers', () => {
  test('All required security headers present and correct', async ({ page }) => {
    const response = await page.goto('/');
    expect(response).toBeTruthy();
    
    const headers = response!.headers();
    
    // CSP with frame-ancestors
    const csp = headers['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain('frame-ancestors');
    expect(csp).toContain("'self'");
    expect(csp).toContain('https://*.lovable.dev');
    
    // MIME-sniffing protection
    expect(headers['x-content-type-options']).toBe('nosniff');
    
    // XSS protection
    expect(headers['x-xss-protection']).toBe('1; mode=block');
    
    // Referrer policy
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    
    // Permissions policy
    expect(headers['permissions-policy']).toBeDefined();
    expect(headers['permissions-policy']).toContain('geolocation=()');
    
    // HSTS
    expect(headers['strict-transport-security']).toContain('max-age=31536000');
    
    // X-Frame-Options MUST be absent
    expect(headers['x-frame-options']).toBeUndefined();
    
    console.log('✅ Security baseline: All headers correct');
  });
  
  test('CSP allows Supabase connections', async ({ page }) => {
    const response = await page.goto('/');
    const csp = response!.headers()['content-security-policy'];
    
    expect(csp).toContain('https://niorocndzcflrwdrofsp.supabase.co');
    expect(csp).toContain('wss://niorocndzcflrwdrofsp.supabase.co');
  });
  
  test('CSP allows Lovable API', async ({ page }) => {
    const response = await page.goto('/');
    const csp = response!.headers()['content-security-policy'];
    
    expect(csp).toContain('https://api.lovable.app');
  });
});
```

---

## CI Integration

### Add to Workflow

**File:** `.github/workflows/ci.yml`

```yaml
security-baseline:
  name: Security Baseline Headers
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps chromium
    
    - name: Build app
      run: npm run build
    
    - name: Run security baseline tests
      run: npx playwright test tests/security/security-baseline.spec.ts
    
    - name: Upload test results
      if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: security-baseline-failures
        path: playwright-report/

merge-gate:
  needs: [..., security-baseline, embed-gate]
  # Merge blocked if security baseline fails
```

---

## Production Monitoring

### Automated Header Checks

**Tool:** Synthetic monitoring (e.g., Datadog Synthetics, Pingdom)

**Frequency:** Every 5 minutes

**Checks:**
```bash
#!/bin/bash
# Production header verification script

PROD_URL="https://autorepaica.com"

# Fetch headers
HEADERS=$(curl -s -I "$PROD_URL")

# Check required headers
if ! echo "$HEADERS" | grep -q "content-security-policy:"; then
  echo "❌ CSP missing"
  exit 1
fi

if ! echo "$HEADERS" | grep -q "x-content-type-options: nosniff"; then
  echo "❌ X-Content-Type-Options missing"
  exit 1
fi

if echo "$HEADERS" | grep -q "x-frame-options:"; then
  echo "❌ X-Frame-Options present (should be absent)"
  exit 1
fi

echo "✅ All security headers correct"
```

**Alert Conditions:**
- 🚨 Critical: Any required header missing
- 🚨 Critical: X-Frame-Options present
- ⚠️ Warning: CSP frame-ancestors changed

---

## Security vs. Functionality Trade-offs

### Accepted Risks

| Risk | Mitigation | Justification |
|------|-----------|---------------|
| `unsafe-inline` in CSP | CSP other directives + code review | Required for React dev builds |
| `unsafe-eval` in CSP | CSP other directives + no user-generated code execution | Required for Vite HMR |
| No HSTS preload in dev | Enforced in production | Dev may use HTTP localhost |

### Defense-in-Depth Strategy

1. **Layer 1:** CSP with scoped directives
2. **Layer 2:** Additional headers (X-Content-Type-Options, etc.)
3. **Layer 3:** Secure coding practices (no eval, no innerHTML with user input)
4. **Layer 4:** Input validation and sanitization
5. **Layer 5:** Output encoding

---

## Compliance Mapping

| Standard | Requirement | Implementation |
|----------|-------------|----------------|
| OWASP Top 10 | A05:2021 Security Misconfiguration | ✅ All headers configured |
| OWASP ASVS | V14.4 HTTP Security Headers | ✅ CSP, HSTS, X-Content-Type-Options |
| NIST 800-53 | SC-7 Boundary Protection | ✅ CSP frame-ancestors |
| PCI DSS | 6.5.10 Broken Authentication | ✅ Referrer-Policy, HSTS |

---

## References

**Internal:**
- `docs/P4-Embed-Gate.txt` - Embed gate rules
- `docs/B2-Security-Headers-Snapshot.md` - Detailed header analysis
- `public/sw.js` - Header implementation

**External:**
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [securityheaders.com](https://securityheaders.com/)

---

**Last Updated:** 2025-01-05  
**Next Review:** Before each major release
