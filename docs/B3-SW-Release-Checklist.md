# B3 — Service Worker Release Checklist

**Purpose:** Ensure Service Worker updates are properly deployed and all users receive the new version with correct security headers.

**When to Use:** Before every production release that modifies `public/sw.js`

---

## Pre-Release Checklist

### 1. Code Review

- [ ] **Cache Version Updated**
  - Open `public/sw.js`
  - Verify `CACHE_NAME` includes new version marker
  - Format: `autorepai-v[N]-[feature-marker]`
  - Example: `autorepai-v4-20251005-embed-fix`
  - Reason: Forces all clients to update SW and purge stale caches

- [ ] **Security Headers Correct**
  - Open `public/sw.js` → `SECURITY_HEADERS` object
  - Verify X-Frame-Options is **NOT** present
  - Verify CSP includes correct `frame-ancestors` allow-list:
    ```javascript
    'frame-ancestors': "'self' https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app"
    ```
  - Verify all baseline headers present:
    - Content-Security-Policy
    - X-Content-Type-Options: nosniff
    - Strict-Transport-Security
    - Referrer-Policy
    - Permissions-Policy

- [ ] **Precache Assets Up-to-Date**
  - Review `PRECACHE_ASSETS` array
  - Add any new critical assets (e.g., new fonts, images)
  - Remove any deleted assets
  - Keep list minimal (only offline-critical assets)

- [ ] **Event Handlers Functional**
  - `install` event: Precaches assets, calls `skipWaiting()`
  - `activate` event: Cleans old caches, claims clients
  - `fetch` event: Applies security headers, uses correct cache strategies

---

### 2. Local Testing

- [ ] **Clean Profile Test**
  - Open browser in incognito/private mode OR with fresh profile:
    ```bash
    # Chrome
    google-chrome --user-data-dir=/tmp/sw-test https://localhost:8080
    
    # Firefox
    firefox -profile /tmp/sw-test-profile https://localhost:8080
    ```
  - Open DevTools → Application → Service Workers
  - Verify new SW installs and activates
  - Check status: "activated and is running"
  - Note registration scope: Should be `/` (root)

- [ ] **Cache Verification**
  - DevTools → Application → Cache Storage
  - Verify cache name matches `CACHE_NAME` in `public/sw.js`
  - Verify all precached assets are present
  - Verify no old cache versions remain

- [ ] **Header Verification**
  - DevTools → Network tab
  - Reload page (ensure SW is active)
  - Click root document request (`/`)
  - Inspect Response Headers
  - Verify:
    - ✅ Content-Security-Policy with correct frame-ancestors
    - ✅ X-Content-Type-Options: nosniff
    - ✅ Strict-Transport-Security present
    - ❌ X-Frame-Options absent

- [ ] **Offline Functionality**
  - DevTools → Network tab → Throttling → Offline
  - Reload page
  - Verify app loads from cache (check Network tab for "(ServiceWorker)" responses)
  - Test navigation between cached pages
  - Return online, verify SW syncs new data

- [ ] **Update Behavior**
  - With SW already active, simulate an update:
    1. Modify `CACHE_NAME` in `public/sw.js` (e.g., add `-test`)
    2. Reload page
    3. DevTools → Application → Service Workers
    4. Verify new SW is "waiting to activate"
    5. Click "skipWaiting" OR close all tabs and reopen
    6. Verify new SW activates and old cache is deleted

---

### 3. Automated Tests

- [ ] **Embed Gate Tests Pass**
  ```bash
  npm run test:e2e tests/security/embed-gate.spec.ts
  ```
  - All 4 tests must pass:
    - ✓ X-Frame-Options absent
    - ✓ CSP frame-ancestors correct
    - ✓ Security baseline headers present
    - ✓ SW cache version updated
  - No timeouts or flakes

- [ ] **E2E Tests Pass**
  ```bash
  npm run test:e2e
  ```
  - All end-to-end tests pass with SW active
  - No regressions in functionality

- [ ] **CI Pipeline Green**
  - Check GitHub Actions status for latest commit
  - Verify `embed-gate` job passed
  - Verify `security-scan` job passed
  - Verify `merge-gate` job passed

---

## Deployment Steps

### 4. Staging Deployment

- [ ] **Deploy to Staging**
  - Deploy build to staging environment
  - Note: Staging must be HTTPS (SW requires secure context)

- [ ] **Staging Smoke Tests**
  - Open staging URL in clean browser profile
  - Verify SW installs automatically
  - Check DevTools → Application → Service Workers → Status: activated
  - Check Network → Headers → Verify security headers
  - Test offline mode (go offline, reload page)
  - Test Preview embed (if staging is embeddable)

- [ ] **Staging Cache Purge**
  - If using CDN (Cloudflare, AWS CloudFront):
    - Purge all cached HTML files
    - Purge `/sw.js` specifically
  - Verify purge: curl staging URL and check `x-cache` header (should be MISS)

- [ ] **Staging SW Update Test**
  - Access staging in browser that previously visited staging
  - Old SW should detect new version and update automatically
  - Check DevTools → Application → Service Workers
  - Should see: "Update on reload" OR new SW waiting
  - Reload → Verify new SW activates

---

### 5. Production Deployment

- [ ] **Pre-Deployment Communication**
  - Notify team of deployment window
  - Mention SW update (users may see brief "Update available" message)
  - Prepare rollback plan (keep previous build artifact)

- [ ] **Deploy to Production**
  - Deploy build to production
  - Verify deployment success (check health endpoint, app loads)

- [ ] **CDN Cache Purge (Critical)**
  - Purge ALL cached HTML files
  - Purge `/sw.js` file specifically
  - Purge `/index.html`
  - Purge any HTML routes (e.g., `/dashboard`, `/leads`)
  - Verify purge successful:
    ```bash
    curl -I https://autorepai.com/sw.js | grep -i cache
    # Should see: x-cache: MISS or no x-cache header
    ```

- [ ] **Production Smoke Tests (Immediate)**
  - Open production URL in clean browser profile
  - DevTools → Application → Service Workers
  - Verify new SW installs and activates
  - Check cache name includes new version marker
  - Network → Headers → Verify security headers correct
  - Test critical user flows:
    - Homepage loads
    - Inventory page loads
    - Lead form submits
    - Auth works (login/logout)
  - Test offline mode

---

## Post-Deployment Monitoring

### 6. Service Worker Adoption Tracking

- [ ] **Real User Monitoring (First 1 Hour)**
  - Monitor browser console logs for SW errors
  - Check error tracking service (Sentry, etc.) for SW-related errors
  - Watch for reports of:
    - "Failed to register service worker"
    - "Service worker update failed"
    - "Cache storage quota exceeded"

- [ ] **SW Version Rollout (First 24 Hours)**
  - Check SW adoption rate:
    ```javascript
    // Add telemetry to track active SW version
    navigator.serviceWorker.ready.then(registration => {
      fetch('/api/telemetry', {
        method: 'POST',
        body: JSON.stringify({
          event: 'sw_active',
          version: 'v4-20251005-embed-fix', // Read from SW
          timestamp: Date.now()
        })
      });
    });
    ```
  - Expected: >80% of active users on new SW within 24 hours
  - If <50% after 6 hours, investigate:
    - CDN cache not purged?
    - Users not reloading app?
    - SW update blocked by browser?

- [ ] **Header Verification in Production**
  - Periodically check production headers:
    ```bash
    curl -I https://autorepai.com/ | grep -E "(x-frame-options|content-security-policy)"
    ```
  - Expected:
    - ✅ content-security-policy present with frame-ancestors
    - ❌ x-frame-options absent
  - If headers wrong:
    - Check CDN/proxy config (might be injecting headers)
    - Check if old SW still active for some users
    - Manually unregister SW for affected users (support script)

---

### 7. Preview & Embed Verification

- [ ] **Lovable Preview Test**
  - Open production app in Lovable Preview iframe
  - Verify app renders (no blank screen)
  - Open DevTools in Preview
  - Console: No errors like "Refused to display in a frame"
  - Network → Headers → Verify CSP frame-ancestors includes lovable.dev

- [ ] **Restored Build Test**
  - In Lovable, restore a previous build
  - Open restored build in Preview
  - Verify it also renders (should inherit current SW)
  - If restored build blanks, check:
    - SW scope (should be `/`)
    - Cache version (old build might have conflicting SW)
    - Solution: Unregister all SWs, reload

---

### 8. Rollback Triggers

**Roll back if any of the following occur:**

- [ ] **Critical SW Error**
  - >5% of users report "App won't load" or "Stuck on loading screen"
  - Error tracking shows spike in SW registration failures
  - **Rollback Action:** Deploy previous build, purge CDN cache

- [ ] **Header Regression**
  - X-Frame-Options reappears (breaks Preview)
  - frame-ancestors missing or misconfigured (blocks embedding)
  - **Rollback Action:** Revert `public/sw.js`, redeploy

- [ ] **Cache Storage Quota Exceeded**
  - Users report "Out of storage space" errors
  - Precache list too large
  - **Rollback Action:** Deploy previous build, reduce `PRECACHE_ASSETS`, redeploy

- [ ] **Performance Degradation**
  - Page load time increases >50%
  - SW fetch handler causing delays
  - **Rollback Action:** Investigate, optimize SW, redeploy

---

## Rollback Procedure

**If rollback is needed:**

1. **Stop Deployment**
   - Halt any in-progress rollouts
   - Notify team immediately

2. **Revert Code**
   ```bash
   git revert <commit-hash-of-broken-sw>
   git push origin main
   ```

3. **Redeploy Previous Version**
   - Deploy last known good build
   - Purge CDN cache (HTML + /sw.js)

4. **Force SW Update**
   - Increment cache version in reverted SW
   - This forces users to re-download and activate old SW

5. **Verify Rollback**
   - Test production in clean profile
   - Verify old SW version active
   - Verify headers correct (if header issue caused rollback)

6. **Communicate**
   - Notify users of brief disruption (if user-facing)
   - Post-mortem: Document what went wrong and how to prevent

---

## Troubleshooting

### Issue: SW Not Updating for Some Users

**Symptoms:**
- Users report old features still visible
- DevTools shows old cache version

**Causes:**
- User hasn't reloaded app since deployment
- Browser cached old SW file (`/sw.js`)
- CDN still serving old SW

**Solutions:**
1. **Force Reload:** Ask user to hard refresh (Ctrl+Shift+R)
2. **Unregister SW:**
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => 
     regs.forEach(r => r.unregister())
   );
   location.reload();
   ```
3. **CDN Purge:** Re-purge `/sw.js` on CDN
4. **skipWaiting:** Ensure SW calls `self.skipWaiting()` in install event

---

### Issue: Preview Still Blanks After Deployment

**Symptoms:**
- Production app loads fine
- Preview shows blank screen or frame-block error

**Causes:**
- Headers not applied to iframe context
- CSP frame-ancestors missing Lovable domains
- Browser cached old response

**Solutions:**
1. **Check Headers in Preview:**
   - Open Preview → DevTools → Network
   - Inspect root document headers
   - Verify CSP and X-Frame-Options
2. **Hard Refresh in Preview:** Ctrl+Shift+R
3. **Unregister SW in Preview:**
   - DevTools → Application → Service Workers → Unregister
   - Reload
4. **Verify SW Scope:** Must be `/` (not `/app/` or nested)

---

### Issue: "Service worker registration failed"

**Symptoms:**
- Console error: `Failed to register a ServiceWorker`
- App loads but no offline support

**Causes:**
- Syntax error in `public/sw.js`
- HTTPS not enabled (SW requires secure context)
- Browser doesn't support SW (very old browsers)

**Solutions:**
1. **Check SW Syntax:**
   ```bash
   # Validate JS syntax
   node -c public/sw.js
   ```
2. **Ensure HTTPS:** SW only works on HTTPS or localhost
3. **Check Browser Support:** Open DevTools → Console, run:
   ```javascript
   'serviceWorker' in navigator
   // Should return true
   ```
4. **Check CORS:** If SW served from CDN, ensure CORS headers allow it

---

## Success Criteria

**Deployment is successful if:**

✅ New SW active for >95% of users within 48 hours  
✅ No spike in SW-related errors  
✅ Preview and restored builds render without errors  
✅ Security headers correct in production  
✅ Offline mode works  
✅ No performance regressions  
✅ CI embed-gate tests pass  

---

## Post-Release

### 9. Documentation Updates

- [ ] Update `docs/B2-Security-Headers-Snapshot.md` with new header values (if changed)
- [ ] Update `CHANGELOG.md` with SW version and changes
- [ ] Update `README.md` if SW behavior changed (e.g., new offline features)

### 10. Team Communication

- [ ] Post release notes in team chat
- [ ] Highlight any SW changes that affect users
- [ ] Share link to this checklist for next release

### 11. Retrospective (If Issues Occurred)

- [ ] Document what went wrong
- [ ] Root cause analysis
- [ ] Action items to prevent recurrence
- [ ] Update this checklist with lessons learned

---

## Quick Reference

**Key Files:**
- SW Code: `public/sw.js`
- SW Tests: `tests/security/embed-gate.spec.ts`
- CI Config: `.github/workflows/ci.yml`
- Security Headers Doc: `docs/B2-Security-Headers-Snapshot.md`

**Key Commands:**
```bash
# Run SW tests locally
npm run test:e2e tests/security/embed-gate.spec.ts

# Check SW status in browser console
navigator.serviceWorker.getRegistration().then(reg => console.log(reg));

# Unregister all SWs (troubleshooting)
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(r => r.unregister())
);

# Check production headers
curl -I https://autorepai.com/ | grep -E "(frame-options|security-policy)"
```

**CDN Purge Commands (Examples):**
```bash
# Cloudflare
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -d '{"files":["https://autorepai.com/sw.js","https://autorepai.com/"]}'

# AWS CloudFront
aws cloudfront create-invalidation \
  --distribution-id {dist_id} \
  --paths "/sw.js" "/index.html" "/"
```

---

**Last Updated:** 2025-10-05  
**Owner:** DevOps Team  
**Next Review:** After every SW deployment
