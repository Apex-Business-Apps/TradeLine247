# B2 — Security Headers Snapshot

**Build:** v4-20251005-embed-fix  
**Date:** 2025-10-05  
**Status:** ✅ Production-Ready

---

## Executive Summary

This document captures the final security header configuration for AutoRepAi after the embed fix. All headers balance **security** (preventing attacks) with **functionality** (allowing Preview embedding).

**Key Changes from Previous Version:**
- ❌ Removed: `X-Frame-Options` (obsolete, conflicts with CSP)
- ✅ Updated: `Content-Security-Policy` → `frame-ancestors` now includes Lovable domains
- ✅ Maintained: All other security headers (HSTS, nosniff, referrer-policy, permissions-policy)

---

## Complete Header Set

### Applied to All Responses
**Source:** Service Worker (`public/sw.js` → `SECURITY_HEADERS` object)  
**Scope:** All HTML, CSS, JS, API responses served through the app

```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com;
  frame-ancestors 'self' https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app;
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;

X-Content-Type-Options: nosniff

Strict-Transport-Security: max-age=31536000; includeSubDomains

Referrer-Policy: strict-origin-when-cross-origin

Permissions-Policy: 
  geolocation=(), 
  microphone=(), 
  camera=(), 
  payment=(), 
  usb=(), 
  magnetometer=(), 
  gyroscope=(), 
  accelerometer=()
```

---

## Header-by-Header Analysis

### 1. Content-Security-Policy (CSP)

**Purpose:** Defines trusted sources for content and embedding behavior.

**Directives Breakdown:**

| Directive | Value | Purpose |
|-----------|-------|---------|
| `default-src` | `'self'` | Default policy: only load resources from same origin |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://cdn.jsdelivr.net` | Allow scripts from self, Supabase (auth/DB), and CDN. `unsafe-inline`/`unsafe-eval` needed for React dev mode and third-party libs. |
| `style-src` | `'self' 'unsafe-inline'` | Allow stylesheets from self and inline styles (Tailwind, component styles) |
| `img-src` | `'self' data: https: blob:` | Allow images from self, data URIs, any HTTPS source, and blob URLs (file uploads) |
| `font-src` | `'self' data:` | Allow fonts from self and data URIs (embedded fonts) |
| `connect-src` | `'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com` | Allow API calls to self, Supabase (REST + WebSocket), and OpenAI (AI chat) |
| **`frame-ancestors`** | **`'self' https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app`** | **Allow embedding in same origin + Lovable Preview domains** |
| `base-uri` | `'self'` | Restrict `<base>` tag to prevent URL injection |
| `form-action` | `'self'` | Forms can only submit to same origin |
| `upgrade-insecure-requests` | (directive only) | Upgrade HTTP requests to HTTPS automatically |

**Security Impact:**
- ✅ Prevents XSS by restricting script sources
- ✅ Prevents clickjacking via `frame-ancestors` allow-list
- ✅ Prevents data exfiltration by limiting `connect-src`
- ⚠️ `unsafe-inline` and `unsafe-eval` reduce XSS protection but are required for React/Vite dev builds

**Functionality Impact:**
- ✅ Allows embedding in Lovable Preview (frame-ancestors)
- ✅ Supabase auth/DB works (script-src, connect-src)
- ✅ AI chat works (connect-src → OpenAI)
- ✅ File uploads work (img-src → blob:)

---

### 2. X-Content-Type-Options

```http
X-Content-Type-Options: nosniff
```

**Purpose:** Prevents MIME-type sniffing attacks.  
**Protection:** Browsers must respect `Content-Type` header and won't execute files with wrong MIME type.

**Example Attack Prevented:**
- Attacker uploads `evil.jpg` (actually contains JavaScript)
- Without `nosniff`: Browser might execute it as script
- With `nosniff`: Browser refuses to execute (MIME mismatch)

**Status:** ✅ Always enabled, no exceptions needed.

---

### 3. Strict-Transport-Security (HSTS)

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Purpose:** Force HTTPS for all requests.  
**Settings:**
- `max-age=31536000` → 1 year HTTPS enforcement
- `includeSubDomains` → Applies to all subdomains

**Protection:**
- ✅ Prevents SSL-stripping attacks
- ✅ Prevents accidental HTTP fallback
- ✅ Protects all subdomains (e.g., `api.autorepai.com`)

**Note:** `preload` directive not included (requires manual submission to HSTS preload list).

---

### 4. Referrer-Policy

```http
Referrer-Policy: strict-origin-when-cross-origin
```

**Purpose:** Controls how much referrer information is sent in requests.

**Behavior:**
- **Same-origin requests:** Send full URL (e.g., `https://autorepai.com/leads/123`)
- **Cross-origin HTTPS → HTTPS:** Send origin only (e.g., `https://autorepai.com`)
- **HTTPS → HTTP:** Send nothing (prevents leaking secure URLs to insecure sites)

**Privacy Impact:**
- ✅ Protects user data in URLs (e.g., tokens, IDs)
- ✅ Prevents leaking internal paths to third parties
- ⚠️ May break some analytics tools expecting full referrer

---

### 5. Permissions-Policy

```http
Permissions-Policy: 
  geolocation=(), 
  microphone=(), 
  camera=(), 
  payment=(), 
  usb=(), 
  magnetometer=(), 
  gyroscope=(), 
  accelerometer=()
```

**Purpose:** Disable unused powerful browser features.

**Features Disabled:**
- `geolocation` → No location tracking
- `microphone` → No audio recording
- `camera` → No video recording
- `payment` → No Payment Request API
- `usb` → No USB device access
- Motion sensors → No accelerometer/gyroscope/magnetometer

**Security Impact:**
- ✅ Reduces attack surface (can't exploit disabled features)
- ✅ Prevents third-party scripts from accessing these APIs
- ✅ Improves privacy (no unexpected permission prompts)

**Future Adjustment:**
If features are needed (e.g., geolocation for dealership finder), update policy:
```http
Permissions-Policy: geolocation=(self), microphone=(), camera=(), ...
```

---

### 6. X-Frame-Options

```http
[ABSENT]
```

**Status:** ❌ **Intentionally removed** (was causing Preview to blank).

**Why Removed:**
- X-Frame-Options is **obsolete** (replaced by CSP `frame-ancestors`)
- Conflicts with CSP in modern browsers (X-Frame-Options wins in older browsers)
- Any value (DENY, SAMEORIGIN, ALLOW-FROM) would block Lovable Preview

**Replacement:** CSP `frame-ancestors 'self' https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app`

**Security Posture:**
- ✅ CSP `frame-ancestors` provides **equivalent protection** in modern browsers
- ✅ Allow-list is more flexible than X-Frame-Options (supports wildcards)
- ⚠️ Very old browsers (<IE11) won't respect CSP (acceptable risk for modern web app)

---

## Security Compliance

### OWASP Top 10 Coverage

| OWASP Risk | Mitigated By | Status |
|------------|--------------|--------|
| A01: Broken Access Control | RLS policies (Supabase) + CSP frame-ancestors | ✅ |
| A02: Cryptographic Failures | HSTS (force HTTPS) | ✅ |
| A03: Injection | CSP (restrict script sources) | ⚠️ Partial (unsafe-inline) |
| A04: Insecure Design | N/A (header layer) | - |
| A05: Security Misconfiguration | All headers present and configured | ✅ |
| A06: Vulnerable Components | Dependabot + npm audit | ✅ |
| A07: Auth Failures | Supabase Auth + RLS | ✅ |
| A08: Data Integrity Failures | nosniff, CSP | ✅ |
| A09: Logging Failures | N/A (header layer) | - |
| A10: SSRF | CSP connect-src limits | ✅ |

---

## Testing & Verification

### Automated Tests
**File:** `tests/security/embed-gate.spec.ts`

```javascript
test('Security baseline: Required security headers present', async ({ page }) => {
  const response = await page.goto('/');
  const headers = response!.headers();
  
  expect(headers['content-security-policy']).toBeDefined();
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBeDefined();
  expect(headers['permissions-policy']).toBeDefined();
  expect(headers['x-frame-options']).toBeUndefined(); // ← Critical
});
```

**CI Job:** `.github/workflows/ci.yml` → `embed-gate`

---

### Manual Verification (DevTools)

1. Open app in browser
2. Open DevTools → Network tab
3. Reload page
4. Click root document request (`/` or `/index.html`)
5. Inspect **Response Headers** section

**Expected Result:**
```
✅ content-security-policy: [full CSP string]
✅ x-content-type-options: nosniff
✅ strict-transport-security: max-age=31536000; includeSubDomains
✅ referrer-policy: strict-origin-when-cross-origin
✅ permissions-policy: [list of disabled features]
❌ x-frame-options: [MUST BE ABSENT]
```

---

### Security Scanning Tools

**Mozilla Observatory:**
```bash
curl https://observatory.mozilla.org/api/v1/analyze?host=autorepai.com
```

**Expected Score:** A- or better (A+ requires removing unsafe-inline)

**SecurityHeaders.com:**
```bash
curl https://securityheaders.com/?q=autorepai.com
```

**Expected Grade:** A (missing X-Frame-Options is OK if CSP frame-ancestors present)

---

## Known Trade-offs & Risks

### Trade-off 1: CSP `unsafe-inline` and `unsafe-eval`

**Why Needed:**
- React development builds use inline scripts
- Vite HMR (Hot Module Replacement) requires eval
- Some third-party libraries expect inline execution

**Risk:**
- ⚠️ Reduces XSS protection (attackers can inject inline scripts)

**Mitigation:**
- Use `nonce` or `hash` for inline scripts in production (future improvement)
- Regularly audit dependencies for XSS vulnerabilities
- Implement input sanitization in all user-facing forms

**Timeline:** Consider removing `unsafe-inline` in production builds (Phase C task).

---

### Trade-off 2: Wildcard in frame-ancestors

**Current:** `https://*.lovable.dev`  
**Risk:** Any subdomain of lovable.dev can embed the app

**Why Acceptable:**
- All Lovable subdomains are controlled by Lovable (trusted)
- Lovable preview uses dynamic subdomains (can't enumerate all)
- Alternative would be to list all subdomains (impractical)

**Future:** If Lovable provides a single embedding origin, replace wildcard with exact domain.

---

### Trade-off 3: No X-Frame-Options for Legacy Browsers

**Impact:** IE10 and older won't respect CSP frame-ancestors

**Mitigation:**
- Acceptable risk: <0.1% of users on IE10 or older
- App already uses modern web APIs (React, Vite) that don't support IE
- If needed, add `X-Frame-Options: SAMEORIGIN` with proxy/CDN that removes it for Lovable origins

---

## Monitoring & Alerts

### CSP Violation Reporting (Future Enhancement)

**Add to CSP:**
```http
Content-Security-Policy: ...; report-uri https://autorepai.com/api/csp-report
```

**Benefits:**
- Real-time alerts when CSP blocks a resource
- Helps identify legitimate resources to whitelist
- Detects XSS attempts in production

**Implementation:** Create endpoint to receive and log CSP violation reports.

---

### Header Regression Monitoring

**Current:** CI embed-gate tests catch regressions before merge

**Production Monitoring (Recommended):**
- Set up synthetic monitor (Pingdom, Uptime Robot) to check headers every 5 minutes
- Alert if X-Frame-Options appears or CSP changes
- Store header snapshots for audit trail

**Example Monitor Check:**
```bash
#!/bin/bash
HEADERS=$(curl -sI https://autorepai.com)

# Fail if X-Frame-Options present
if echo "$HEADERS" | grep -i "x-frame-options"; then
  echo "❌ ALERT: X-Frame-Options detected!"
  exit 1
fi

# Fail if frame-ancestors missing
if ! echo "$HEADERS" | grep -i "frame-ancestors"; then
  echo "❌ ALERT: frame-ancestors missing!"
  exit 1
fi

echo "✅ Headers OK"
```

---

## Version History

| Version | Date | Changes | Reason |
|---------|------|---------|--------|
| v3-stable | 2025-09-01 | X-Frame-Options: SAMEORIGIN | Original security baseline |
| v4-embed-fix | 2025-10-05 | Removed X-Frame-Options, added frame-ancestors allow-list | Fix Preview blanking issue |

---

## References

- **CSP Spec:** https://www.w3.org/TR/CSP3/
- **CSP Evaluator:** https://csp-evaluator.withgoogle.com/
- **OWASP Secure Headers:** https://owasp.org/www-project-secure-headers/
- **MDN Security Headers:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security
- **Mozilla Observatory:** https://observatory.mozilla.org/

---

## Maintenance

**Review Frequency:** Quarterly or when:
- New third-party service is integrated (update CSP)
- Security incident occurs (reassess headers)
- Browser support changes (e.g., new CSP directives available)

**Owner:** Security + DevOps Team  
**Next Review:** 2026-01-05

---

**Last Updated:** 2025-10-05  
**Approver:** CTO  
**Status:** ✅ Production-Ready
