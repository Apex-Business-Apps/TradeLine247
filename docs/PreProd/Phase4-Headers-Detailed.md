# PHASE 4: Header Posture & Offline Contract — Detailed Report

**Date:** 2025-10-11 (America/Edmonton)  
**Status:** ✅ CODE READY — Awaiting production verification  
**Gate:** P0 — Blocks production deploy

---

## Objective

Verify that production HTML responses include correct security headers (`Content-Security-Policy` with `frame-ancestors`) without `X-Frame-Options`, and confirm Service Worker provides offline app-shell fallback for all navigation requests.

---

## Test Commands

### Test #1: Root Path Headers (`/`)

```bash
curl -sI https://www.autorepai.ca/ | grep -E 'HTTP/|Content-Security-Policy|X-Frame-Options|Cache-Control'
```

**Expected Output:**

```
HTTP/2 200
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://niorocndzcflrwdrofsp.supabase.co wss://niorocndzcflrwdrofsp.supabase.co; frame-ancestors 'self' https://lovable.app https://*.lovable.app https://lovable.dev https://*.lovable.dev; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'self' https://accounts.google.com
cache-control: no-cache, no-store, must-revalidate
```

**Critical Checks:**
- ✅ `frame-ancestors` includes `'self'` and Lovable domains
- ✅ `X-Frame-Options` header **NOT PRESENT**
- ✅ HTTP status is `200`

---

### Test #2: 404 Route Headers

```bash
curl -sI https://www.autorepai.ca/this-does-not-exist-404 | grep -E 'HTTP/|Content-Security-Policy|X-Frame-Options'
```

**Expected Output:**

```
HTTP/2 200
content-security-policy: [same as above]
```

**Why 200?** SPA routing — all unknown paths serve `index.html` with app-shell, React Router handles 404 view client-side.

---

### Test #3: SSL/TLS Configuration

```bash
curl -vI https://www.autorepai.ca/ 2>&1 | grep -E 'subject:|issuer:|SSL|TLS'
```

**Expected Output:**

```
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
subject: CN=www.autorepai.ca
issuer: C=US; O=Let's Encrypt; CN=R3
SSL certificate verify ok.
```

**Critical Checks:**
- ✅ TLS 1.3 negotiated
- ✅ Certificate subject matches `www.autorepai.ca`
- ✅ Valid Let's Encrypt issuer

---

### Test #4: Service Worker Registration

**Action:** Open browser DevTools → Application → Service Workers

**Expected State:**
```
Service Worker: ACTIVATED and is running
Source: /sw.js
Status: activated
Scope: https://www.autorepai.ca/
```

**Test Offline:**
1. Check "Offline" in DevTools → Network tab
2. Navigate to `/dashboard`
3. **Expected:** App loads from cache (no network request)

---

## Configuration Review

### CSP Directive Breakdown

```csp
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: https: blob:;
connect-src 'self' https://niorocndzcflrwdrofsp.supabase.co wss://niorocndzcflrwdrofsp.supabase.co;
frame-ancestors 'self' https://lovable.app https://*.lovable.app https://lovable.dev https://*.lovable.dev;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-src 'self' https://accounts.google.com;
```

**Key Security Features:**
- ✅ `frame-ancestors` prevents clickjacking (replaces `X-Frame-Options`)
- ✅ `object-src 'none'` blocks Flash/Java plugins
- ✅ `base-uri 'self'` prevents base tag injection
- ✅ Supabase origins whitelisted for API calls

**Known Trade-offs:**
- ⚠️ `'unsafe-inline'` + `'unsafe-eval'` in `script-src` (required for Vite HMR in dev, consider nonces in prod)
- ⚠️ `img-src https:` is broad (consider restricting to specific CDNs)

---

## Service Worker Contract

### File: `public/sw.js`

**Core Responsibilities:**
1. Cache app-shell (`index.html`, core JS/CSS bundles)
2. Intercept navigation requests (`/dashboard`, `/leads`, etc.)
3. Return cached `index.html` for offline navigation (SPA fallback)
4. Network-first for API calls, cache-first for static assets

**Version Control:**
```javascript
const CACHE_NAME = 'autorepai-v1-embed-fix';
```

**Critical:** Version string must increment on every SW change to force cache refresh.

---

## Verification Checklist

### Root Path (`/`)

- [ ] HTTP 200 response
- [ ] `Content-Security-Policy` header present
- [ ] `frame-ancestors` includes `'self'` + Lovable domains
- [ ] `X-Frame-Options` header **NOT PRESENT**
- [ ] `Cache-Control: no-cache` (for HTML document)

### 404 Route

- [ ] HTTP 200 response (SPA routing)
- [ ] Same CSP as root path
- [ ] `X-Frame-Options` **NOT PRESENT**

### SSL/TLS

- [ ] TLS 1.3 negotiated
- [ ] Certificate matches `www.autorepai.ca`
- [ ] Valid Let's Encrypt issuer
- [ ] No certificate warnings in browser

### Service Worker

- [ ] Registered and activated
- [ ] Scope covers entire domain (`/`)
- [ ] Offline navigation loads cached app-shell
- [ ] Cache name includes version marker

---

## Known Issues & Blockers

### Issue #1: X-Frame-Options Still Present

**Symptom:**
```bash
curl -sI https://www.autorepai.ca/ | grep -i x-frame
# Output: x-frame-options: DENY
```

**Impact:** CRITICAL — Blocks embedding in Lovable preview  
**Root Cause:** Hosting platform (Lovable) may inject default headers

**Remediation:**
1. Verify `vite.config.ts` does NOT set `X-Frame-Options`
2. Check if Lovable platform allows header overrides
3. Contact Lovable support if CSP is present but `X-Frame-Options` persists

**Example Fix (if platform allows):**

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'X-Frame-Options': undefined, // Remove default
      'Content-Security-Policy': '...frame-ancestors...'
    }
  }
});
```

---

### Issue #2: frame-ancestors Missing or Wrong

**Symptom:**
```bash
curl -sI https://www.autorepai.ca/ | grep -i content-security
# Output: content-security-policy: ...frame-ancestors 'none'...
```

**Impact:** CRITICAL — Prevents all framing (same as DENY)  
**Root Cause:** Incorrect CSP configuration

**Remediation:**
1. Update CSP to allow required origins:
   ```
   frame-ancestors 'self' https://lovable.app https://*.lovable.app
   ```
2. Redeploy and re-test

---

## Test Results

### Execution Metadata

**Executed:** _[Pending production deploy]_  
**Tester:** _[Pending]_  
**Production URL:** `https://www.autorepai.ca/`

---

### Test #1: Root Path Headers

**Command:**
```bash
curl -sI https://www.autorepai.ca/
```

**Output:**
```
[Paste raw output here]
```

**Analysis:**
- [ ] ✅ HTTP 200
- [ ] ✅ CSP present with `frame-ancestors`
- [ ] ✅ No `X-Frame-Options`
- [ ] ❌ Issue: _[describe any problems]_

---

### Test #2: 404 Route

**Command:**
```bash
curl -sI https://www.autorepai.ca/nonexistent-route-test
```

**Output:**
```
[Paste raw output here]
```

**Analysis:**
- [ ] ✅ HTTP 200 (SPA routing)
- [ ] ✅ Same CSP as root
- [ ] ❌ Issue: _[describe any problems]_

---

### Test #3: SSL/TLS

**Command:**
```bash
curl -vI https://www.autorepai.ca/ 2>&1 | grep -E 'subject:|TLS'
```

**Output:**
```
[Paste raw output here]
```

**Analysis:**
- [ ] ✅ TLS 1.3
- [ ] ✅ Valid certificate
- [ ] ❌ Issue: _[describe any problems]_

---

### Test #4: Service Worker (Manual Browser Test)

**Steps:**
1. Open DevTools → Application → Service Workers
2. Screenshot showing "activated" state
3. Enable offline mode, navigate to `/dashboard`
4. Verify app loads from cache

**Evidence:**
- [ ] Screenshot: `artifacts/phase4/sw-activated.png`
- [ ] Screenshot: `artifacts/phase4/offline-navigation.png`

**Analysis:**
- [ ] ✅ Service Worker active
- [ ] ✅ Offline navigation works
- [ ] ❌ Issue: _[describe any problems]_

---

## Gate Approval Criteria

### ✅ PASS Conditions

1. **Headers on `/` and `/404`:**
   - HTTP 200
   - `Content-Security-Policy` includes `frame-ancestors 'self' https://lovable.app ...`
   - `X-Frame-Options` **NOT PRESENT**

2. **SSL/TLS:**
   - TLS 1.3 negotiated
   - Valid certificate for `www.autorepai.ca`

3. **Service Worker:**
   - Registered and activated
   - Offline navigation returns cached app-shell

4. **Evidence:**
   - Raw `curl` outputs saved
   - Screenshots of DevTools SW panel
   - Offline test video/GIF

### ❌ FAIL Conditions (NO-GO)

- `X-Frame-Options: DENY` or `SAMEORIGIN` present
- `frame-ancestors 'none'` in CSP
- Service Worker not registered
- Offline navigation fails (network error instead of cached page)

---

## Evidence Attachments

### Command Outputs

- [ ] `artifacts/phase4/root-headers.txt` — `curl -sI https://www.autorepai.ca/`
- [ ] `artifacts/phase4/404-headers.txt` — `curl -sI .../nonexistent`
- [ ] `artifacts/phase4/ssl-details.txt` — `curl -vI ...` TLS output

### Screenshots

- [ ] `artifacts/phase4/devtools-security.png` — Chrome → DevTools → Security tab showing valid cert
- [ ] `artifacts/phase4/sw-registration.png` — Service Worker "activated" state
- [ ] `artifacts/phase4/offline-test.gif` — Screen recording of offline navigation

---

## Manual Verification Steps

### Step 1: Deploy to Production

```bash
# Ensure latest code is pushed
git push origin main

# Trigger Lovable deploy (if not automatic)
# Wait for deploy to complete
```

### Step 2: Run Header Tests

```bash
# Root path
curl -sI https://www.autorepai.ca/ > artifacts/phase4/root-headers.txt

# 404 route
curl -sI https://www.autorepai.ca/test-404-route > artifacts/phase4/404-headers.txt

# SSL details
curl -vI https://www.autorepai.ca/ 2>&1 | grep -E 'TLS|subject:' > artifacts/phase4/ssl-details.txt
```

### Step 3: Browser DevTools Checks

1. Open `https://www.autorepai.ca/` in Chrome
2. F12 → Application → Service Workers
3. **Screenshot** showing activated state
4. Network tab → Check "Offline"
5. Navigate to `/dashboard`
6. **Screenshot** showing page loaded from cache

### Step 4: Update This Document

Replace `[Pending]` sections with actual outputs and timestamps.

---

## Sign-Off

- [ ] All header tests **PASSED** (correct CSP, no X-Frame-Options)
- [ ] SSL/TLS **VALID** (TLS 1.3, correct certificate)
- [ ] Service Worker **ACTIVE** (offline navigation works)
- [ ] All evidence collected and saved to `artifacts/phase4/`

**Approved By:** _[Pending]_  
**Date:** _[Pending]_  

---

## References

- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)
- [X-Frame-Options Deprecation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Chrome DevTools: Service Workers](https://developer.chrome.com/docs/devtools/progressive-web-apps/)

---

**Next Phase:** Phase 5 — DNS & SSL (CNAME + 301 redirect)
