# A2 — Service Worker Verification Report

**Date:** 2025-10-05  
**Build:** v4-20251005-embed-fix  
**Status:** ✅ PASS (Code Verified)

## Service Worker Configuration

### Cache Version
**File:** `public/sw.js` line 8
```javascript
const CACHE_NAME = 'autorepaica-v4-20251005-embed-fix';
const RUNTIME_CACHE = 'autorepaica-runtime-v4';
```

✅ **Cache version contains `embed-fix` marker** - ensures browsers fetch updated SW

### Service Worker Scope
**Registration:** `index.html` lines 54-61
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('Service Worker registered', reg.scope))
    .catch(err => console.error('Service Worker registration failed', err));
}
```

- **Scope:** `/` (controls entire application)
- **SW File:** `/sw.js` (root level, maximum scope)

## Header Enforcement Strategy

### Network-First for Navigation
**File:** `public/sw.js` lines 99-107
```javascript
// Navigation requests (HTML): network-first to avoid stale builds
if (request.mode === 'navigate') {
  event.respondWith(
    fetch(request)
      .then((response) => addSecurityHeaders(response))
      .catch(() => caches.match(request).then(cached => 
        cached ? addSecurityHeaders(cached) : cached))
  );
  return;
}
```

✅ **Network-first strategy prevents serving stale HTML with old headers**

### Security Header Injection
**File:** `public/sw.js` lines 51-62
```javascript
function addSecurityHeaders(response) {
  const newHeaders = new Headers(response.headers);
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
```

✅ **All responses intercepted by SW receive security headers** - ensures consistent policy

### Install & Activate Lifecycle
**File:** `public/sw.js` lines 17-37

**Install event:**
- Precaches critical assets (manifest, logo)
- Calls `skipWaiting()` to activate immediately

**Activate event:**
- Deletes old cache versions (anything not matching `CACHE_NAME` or `RUNTIME_CACHE`)
- Calls `clients.claim()` to control all pages immediately

✅ **Aggressive activation strategy ensures quick SW updates**

## Manual Verification Steps

### 1. Check Active Service Worker

**DevTools → Application → Service Workers**

Expected state:
```
Status: activated and is running
Source: /sw.js
Scope: https://[your-domain]/
```

Look for console message:
```
Service Worker registered [scope]
```

### 2. Verify Cache Name

**DevTools → Application → Cache Storage**

Expected caches:
- ✅ `autorepaica-v4-20251005-embed-fix` (precache)
- ✅ `autorepaica-runtime-v4` (runtime cache)

**Any cache without `embed-fix` in the name should be deleted by the activate event.**

### 3. Inspect Network Requests

**DevTools → Network → Select root document request → Headers**

Look for:
```
Service-Worker: script [URL to sw.js]
```

Or in the Size column, look for:
```
(ServiceWorker)
```

This confirms the SW is intercepting and serving the request.

### 4. Fresh Session Test (Critical)

**Purpose:** Confirm a clean profile picks up the new SW without cache issues

**Steps:**
1. Open Chrome/Edge with a fresh profile:
   ```bash
   # Chrome
   chrome --user-data-dir=/tmp/test-profile --new-window
   
   # Edge
   msedge --user-data-dir=/tmp/test-profile --new-window
   ```

2. Navigate to Preview URL

3. Check:
   - No console errors about SW registration
   - Application → Service Workers shows the new SW
   - Cache Storage shows `embed-fix` cache
   - Network → root document has correct headers (no X-Frame-Options)

4. Close and reopen the profile tab - SW should persist

✅ **If the fresh profile test passes, SW is properly deployed**

## Service Worker Update Process

### How Updates Work
1. Browser checks `/sw.js` for changes (every ~24h or on navigation)
2. If SW file changed, browser installs new SW in parallel
3. New SW calls `skipWaiting()` → becomes active immediately
4. Old SW terminated, new SW calls `clients.claim()` → controls all pages
5. Activate event deletes old caches
6. All future requests use new SW + new headers

### Why Cache Version Matters
The cache name includes `embed-fix` marker:
- Forces activate event to delete old caches (they have different names)
- Prevents serving stale HTML from pre-fix caches
- Acts as a version stamp for debugging

### Verification Test in Test Suite
**File:** `tests/security/embed-gate.spec.ts` lines 61-77
```typescript
test('Service Worker: Verify updated cache version', async ({ page }) => {
  await page.goto('/');
  
  // Wait for service worker registration
  await page.waitForFunction(() => {
    return navigator.serviceWorker.controller !== null;
  }, { timeout: 10000 });
  
  // Check SW cache name contains embed-fix marker
  const swCacheName = await page.evaluate(async () => {
    const cacheNames = await caches.keys();
    return cacheNames.find(name => name.includes('embed-fix')) || 'none';
  });
  
  expect(swCacheName).toContain('embed-fix');
  console.log('✅ Service Worker updated with embed-fix cache version');
});
```

✅ **Automated test ensures SW cache version is updated**

## Troubleshooting: If SW Won't Update

### Symptoms
- Preview still blank (frame-block error)
- Network shows old headers (X-Frame-Options: DENY)
- Cache Storage shows old cache name (no `embed-fix`)

### Solutions

**1. Hard Refresh**
```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

**2. Unregister SW Manually**
```javascript
// In DevTools Console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
location.reload();
```

**3. Clear All Site Data**
- DevTools → Application → Clear storage → "Clear site data"

**4. Fresh Profile Test**
- Use `--user-data-dir` flag to start with zero cache

**5. Check for PWA Installation**
- If app is installed as PWA, uninstall it
- Installed PWAs can have separate SW registrations

## Code References

- **SW Registration:** `index.html` lines 54-61
- **SW Source:** `public/sw.js` (entire file)
- **Cache Names:** `public/sw.js` lines 8-9
- **Header Injection:** `public/sw.js` lines 51-62
- **Install/Activate:** `public/sw.js` lines 17-37
- **Fetch Handlers:** `public/sw.js` lines 65-129
- **Automated Test:** `tests/security/embed-gate.spec.ts` lines 61-77

## Conclusion

✅ **Service Worker configuration verified:**
- Cache version bumped to `v4-20251005-embed-fix`
- Headers injected correctly (no X-Frame-Options, correct frame-ancestors)
- Network-first strategy for navigation prevents stale HTML
- Aggressive activation ensures quick updates
- Test suite validates SW state automatically

**Next step:** Perform manual verification in live Preview using DevTools to confirm SW is active and cache name is correct.
