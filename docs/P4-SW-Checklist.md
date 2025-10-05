# Phase 4: Service Worker Freshness Check

**Purpose:** Ensure Service Worker updates are deployed and adopted by users after header changes.

## Problem Statement

### Why SW Freshness Matters

**Service Workers cache responses**, including HTTP headers. When we update headers in code:

1. ❌ **Old SW serves cached responses with OLD headers**
2. ❌ **Users see blank preview (if X-Frame-Options cached)**
3. ❌ **Hard refresh required to force SW update**

**Solution:** Cache version checks + automated SW update verification

---

## Cache Version Strategy

### Naming Convention

```javascript
const CACHE_NAME = 'autorepaica-v{major}-{date}-{change-type}';
```

**Examples:**
- `autorepaica-v4-20251005-embed-fix` - Header changes for embed fix
- `autorepaica-v4-20251010-security-update` - Security header updates
- `autorepaica-v4-20251015-performance` - Asset caching changes

**Rules:**
- ✅ ALWAYS bump version when headers change
- ✅ Include descriptive suffix for change type
- ✅ Use ISO date format (YYYYMMDD)
- ❌ NEVER reuse cache names

---

## Automated Freshness Checks

### Test 1: Cache Version Contains Change Marker

**File:** `tests/security/sw-freshness.spec.ts` (to be created)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Service Worker Freshness', () => {
  test('SW cache version includes required marker', async ({ page }) => {
    await page.goto('/');
    
    // Wait for SW registration
    await page.waitForFunction(() => {
      return navigator.serviceWorker.controller !== null;
    }, { timeout: 10000 });
    
    // Get cache name
    const swCacheName = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      return cacheNames.find(name => name.includes('autorepaica')) || 'none';
    });
    
    // Check for embed-fix marker (or current change marker)
    expect(swCacheName).toContain('embed-fix');
    
    console.log(`✅ SW cache: ${swCacheName}`);
  });
});
```

**CI Integration:**
```yaml
sw-freshness:
  name: Service Worker Freshness Check
  runs-on: ubuntu-latest
  steps:
    # ... setup steps
    
    - name: Run SW freshness tests
      run: npx playwright test tests/security/sw-freshness.spec.ts
      env:
        REQUIRED_SW_MARKER: embed-fix  # Update per release
```

---

### Test 2: SW Applies Correct Headers

```typescript
test('SW applies current security headers to responses', async ({ page }) => {
  await page.goto('/');
  
  // Intercept a static asset request
  const [response] = await Promise.all([
    page.waitForResponse(res => res.url().includes('/logo.png')),
    page.reload()
  ]);
  
  const headers = response.headers();
  
  // Verify SW-applied headers
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['content-security-policy']).toContain('frame-ancestors');
  expect(headers['x-frame-options']).toBeUndefined();
  
  console.log('✅ SW applying correct headers to assets');
});
```

---

### Test 3: SW Update Mechanism Functional

```typescript
test('SW update check triggers on navigation', async ({ page, context }) => {
  // Register SW
  await page.goto('/');
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  
  // Track update checks
  const updateChecks = [];
  await page.evaluate(() => {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] Controller changed - update applied');
    });
  });
  
  // Simulate update available (requires mock SW or test environment)
  // For now, verify registration is active
  const swState = await page.evaluate(() => {
    return navigator.serviceWorker.controller?.state || 'none';
  });
  
  expect(swState).toBe('activated');
  console.log('✅ SW registration active and ready for updates');
});
```

---

## Manual Verification Checklist

### Pre-Deployment

- [ ] Cache version bumped in `public/sw.js` line 8
- [ ] Cache name includes descriptive suffix
- [ ] New cache name is unique (not reused)
- [ ] Headers updated in `SECURITY_HEADERS` object
- [ ] Precache assets list reviewed

### Post-Deployment (Staging)

- [ ] Open DevTools > Application > Service Workers
- [ ] Verify new SW version shown
- [ ] Check cache name matches code
- [ ] Inspect cached responses for correct headers
- [ ] Test in clean browser profile

### Post-Deployment (Production)

- [ ] Monitor RUM telemetry for SW adoption rate
- [ ] Check CDN logs for SW fetch requests
- [ ] Verify no increase in "blank screen" errors
- [ ] Spot-check random user sessions for SW version

---

## User-Facing SW Update Strategy

### Current Approach (Passive)

**Behavior:**
- SW updates on next navigation AFTER new SW detected
- User may see old version for one session
- Hard refresh forces immediate update

**Limitations:**
- User might not see fixes until next visit
- Cached headers persist during session

---

### Enhanced Approach (Active - Future)

**Implementation:**

```javascript
// In public/sw.js
self.addEventListener('install', (event) => {
  self.skipWaiting();  // Already present
});

self.addEventListener('activate', (event) => {
  self.clients.claim();  // Already present
  
  // Future enhancement: notify clients of update
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'SW_UPDATED' });
      });
    })
  );
});
```

```typescript
// In src/main.tsx or App.tsx
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'SW_UPDATED') {
      // Show user-friendly toast
      toast({
        title: "Update Available",
        description: "A new version is ready. Refresh to apply.",
        action: (
          <Button onClick={() => window.location.reload()}>
            Refresh Now
          </Button>
        )
      });
    }
  });
}
```

**Benefits:**
- User aware of updates
- Choice to apply immediately or later
- Reduces support tickets from stale versions

---

## Rollback Procedures

### Scenario: Bad SW Deployed

**Symptoms:**
- Users report blank screens
- Increased error rate in logs
- Headers incorrect in production

**Steps:**

1. **Immediate Rollback:**
   ```bash
   # Revert to last known good commit
   git revert HEAD
   git push origin main
   
   # Or restore previous deployment
   # (Lovable-specific: restore from version history)
   ```

2. **Force SW Clear:**
   ```javascript
   // Emergency kill-switch (add to HTML)
   <script>
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.getRegistrations().then(regs => {
       regs.forEach(reg => reg.unregister());
       window.location.reload();
     });
   }
   </script>
   ```

3. **User Communication:**
   - Post in-app banner: "We're updating security. Please refresh."
   - Email active users if critical
   - Update status page

4. **Root Cause Analysis:**
   - Review what header change caused issue
   - Check if cache version was bumped
   - Verify CI gates ran before merge
   - Update checklist to prevent recurrence

---

## Monitoring & Telemetry

### Real User Monitoring (RUM)

**Metrics to Track:**

1. **SW Adoption Rate:**
   ```javascript
   // In src/lib/observability/telemetry.ts
   export function trackSWVersion() {
     if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
       navigator.serviceWorker.ready.then(async (reg) => {
         const caches = await window.caches.keys();
         const swCache = caches.find(c => c.includes('autorepaica'));
         
         // Send to analytics
         window.gtag?.('event', 'sw_version', {
           cache_name: swCache,
           sw_state: reg.active?.state
         });
       });
     }
   }
   ```

2. **SW Update Latency:**
   - Time from deployment to 90% user adoption
   - Target: < 24 hours for critical fixes

3. **SW-Related Errors:**
   - Cache quota exceeded
   - SW registration failures
   - Update check failures

**Alerts:**
- ⚠️ Warning: SW adoption < 50% after 12 hours
- 🚨 Critical: SW adoption < 25% after 24 hours
- 🚨 Critical: Spike in SW registration errors

---

## CI Integration

### Add to Workflow

```yaml
sw-freshness:
  name: Service Worker Freshness Check
  runs-on: ubuntu-latest
  needs: [build]  # Run after build to ensure SW file exists
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Verify SW cache version
      run: |
        # Extract cache version from SW
        CACHE_VERSION=$(grep "const CACHE_NAME" public/sw.js | sed "s/.*'\(.*\)'.*/\1/")
        echo "SW Cache Version: $CACHE_VERSION"
        
        # Check for required marker (change per release phase)
        if [[ ! "$CACHE_VERSION" =~ embed-fix ]]; then
          echo "❌ Cache version missing required marker: embed-fix"
          exit 1
        fi
        
        echo "✅ SW cache version correct: $CACHE_VERSION"
    
    - name: Install Playwright
      run: npx playwright install --with-deps chromium
    
    - name: Run SW freshness tests
      run: npx playwright test tests/security/sw-freshness.spec.ts

merge-gate:
  needs: [..., sw-freshness]
  # Merge blocked if SW freshness check fails
```

---

## Best Practices

### DO

✅ Bump cache version EVERY time headers change  
✅ Use descriptive cache name suffixes  
✅ Test SW behavior in clean browser profile  
✅ Monitor SW adoption rate post-deployment  
✅ Document cache version in release notes  

### DON'T

❌ Reuse cache names (breaks update mechanism)  
❌ Change headers without bumping cache  
❌ Skip manual verification in staging  
❌ Deploy SW changes on Friday (risk of weekend issues)  
❌ Assume hard refresh solves all problems (users won't know to do it)  

---

## References

**Code:**
- Service Worker: `public/sw.js` lines 8, 27-36
- SW Registration: `index.html` lines 54-62
- Telemetry: `src/lib/observability/telemetry.ts`

**Tests:**
- `tests/security/sw-freshness.spec.ts` (to be created)
- `tests/security/embed-gate.spec.ts` (includes SW check)

**Documentation:**
- `docs/B3-SW-Release-Checklist.md` - Deployment procedures
- `docs/EMBED_FIX_REPORT.md` - Root cause of SW cache issue

**External:**
- [MDN: Service Worker Lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)
- [Google: Service Worker Update](https://web.dev/service-worker-lifecycle/)

---

**Last Updated:** 2025-01-05  
**Review Before:** Any SW or header changes
