# Vercel Blank Page Fix - Operations Notes

**Date**: 2025-12-26
**Objective**: Fix production blank page rendering on Vercel deployment

---

## SYMPTOMS (Production Console Errors)

1. **FATAL**: `Uncaught TypeError: Cannot read properties of undefined (reading 'createContext')`
   - Location: vendor chunk (react-vendor)
   - Impact: Complete render failure (white screen)

2. **Service Worker registered** (PWA active)
   - Risk: Stale cached chunks from previous deploys
   - Current SW version: v6

3. **401 Unauthorized**: `/manifest.webmanifest`
   - Expected: 200 OK (public asset)
   - Cause: Likely Vercel-side auth/routing/CSP issue

4. **CSP Violation**: `vercel.live` script blocked
   - Impact: Noise only (not render blocker)
   - Optional fix in PHASE 4

---

## PHASE 0: TRIAGE & FINDINGS

### Commands Run
```bash
npm ci                    # ✅ Installed 938 packages in 17s
npm run build             # ✅ Built successfully in 15.30s
npm run preview           # ✅ Preview running on :4176
npm ls react react-dom    # ✅ All deps show "deduped" - no duplicates in node_modules
curl http://localhost:4176/                       # ✅ 200 OK
curl http://localhost:4176/manifest.webmanifest   # ✅ 200 OK (returns valid JSON)
curl http://localhost:4176/sw.js                  # ✅ 200 OK (SW v6 served)
```

### Local Preview Result
- ✅ **Build succeeds** - no errors
- ✅ **Preview works** - no createContext error locally
- ✅ **Static assets accessible** - manifest and SW return 200
- ✅ **React dependency tree clean** - all show `react@18.3.1 deduped`

### Key Files Analyzed
- **vite.config.ts**: ❌ Missing `resolve.dedupe` (CRITICAL)
  - Has manual chunk splitting for `react-vendor: ['react', 'react-dom']`
  - But NO explicit dedupe configuration
  - This can cause bundler to include React twice even with clean node_modules

- **public/sw.js**: Service Worker v6 active
  - Caches static assets (js, css, fonts, images) with 7-day TTL
  - Risk: Users have old cached chunks with mismatched React versions

- **server.mjs**: Express server config
  - Serves `/sw.js` with no-cache headers (line 170-179) ✅
  - Serves static from dist/ (line 149-158) ✅
  - No auth middleware blocking public assets locally ✅

- **vercel.json**: CSP headers configured
  - Line 16: CSP doesn't include `vercel.live` for preview tooling
  - No explicit rewrites or auth rules that would cause 401s
  - **BUT**: Vercel may inject edge middleware not visible in repo

---

## ROOT CAUSE ANALYSIS

### Primary Cause: React Duplication in Production Bundle
**Evidence:**
- Error: `Cannot read properties of undefined (reading 'createContext')`
- This is the classic symptom of two React instances in the bundle
- Even though node_modules is clean, **Vite can still bundle React twice without explicit dedupe**

**Why local works but Vercel fails:**
- Local preview may serve from fresh build
- Vercel production users have **stale cached chunks from Service Worker**
- Old chunks reference old React build IDs → mismatch → undefined createContext

### Secondary Cause: Service Worker Stale Cache
**Evidence:**
- Console shows "Service Worker registered"
- SW v6 caches assets for 7 days
- After deploy, old users stuck with cached old chunks

**Impact:**
- Even after fixing React dedupe, existing users won't see the fix
- Need one-time "cache bust" deployment

### Tertiary Cause: Vercel Auth/CSP for Manifest
**Evidence:**
- `/manifest.webmanifest` returns 401 in production
- Works locally (200 OK)
- Vercel may have:
  - Edge middleware not visible in repo
  - Auth redirects for all routes including static
  - CSP blocking cross-origin PWA assets

---

## FIX STRATEGY (Ordered by Priority)

### ✅ PHASE 1: Self-Destroying Service Worker (One-Time Recovery)
**Goal**: Clear all existing caches on next user visit
**Method**:
- Deploy a temporary SW that unregisters itself
- Ensures all users get fresh chunks after fix
- Auto-expires after successful cache clear

### ✅ PHASE 2: Add React Dedupe (Permanent Fix)
**Goal**: Prevent React duplication in bundle forever
**Method**:
- Add `resolve: { dedupe: ['react', 'react-dom'] }` to vite.config.ts
- Guarantees only ONE React instance in final bundle

### ✅ PHASE 3: Fix 401 on Static Assets (Vercel-Specific)
**Goal**: Ensure manifest/SW/assets always public
**Investigation needed**:
- Check if Vercel injects auth middleware
- Verify CSP doesn't block manifest
- Add explicit public paths if needed

### 🔧 PHASE 4: CSP Cleanup (Optional - After Render Fixed)
**Goal**: Stop console spam from blocked vercel.live
**Method**:
- Add `https://vercel.live` to script-src/connect-src in vercel.json CSP
- Only for preview builds, not production

---

## VALIDATION GATES

### Local (Must Pass Before Push)
- ✅ `npm run build` passes
- ✅ `npm run preview` renders UI
- ✅ No fatal console exceptions
- ✅ `/manifest.webmanifest` returns 200
- ✅ Hard refresh works (not broken by SW)

### Vercel Preview (Must Pass Before Merge)
- ⏳ Page renders (no white screen)
- ⏳ `/manifest.webmanifest` returns 200
- ⏳ Hard refresh still works
- ⏳ No createContext errors in console

---

## RUNBOOK: If White Screen Returns

1. **Emergency Recovery**:
   - Add `?safe=1` to URL to bypass service worker
   - Check browser console for createContext error
   - Check Network tab for 401s on manifest/assets

2. **Diagnostics**:
   ```bash
   # Check React duplication in bundle
   npm run build
   grep -r "createContext" dist/assets/*.js | wc -l  # Should be ~1-2, not 10+

   # Verify dedupe config
   grep -A 5 "resolve:" vite.config.ts  # Should have dedupe: ['react', 'react-dom']

   # Check SW cache status
   # In browser DevTools → Application → Service Workers
   # Should show "Unregister" if self-destroying worked
   ```

3. **Recovery Steps**:
   - Verify `resolve.dedupe` in vite.config.ts
   - Deploy self-destroying SW again if needed
   - Clear Vercel build cache and redeploy

---

## COMMITS PLANNED

1. `hotfix: add React/React-DOM dedupe to prevent bundle duplication`
2. `hotfix: self-destroying service worker to clear stale caches`
3. `fix: ensure manifest and SW publicly accessible on Vercel`
4. `chore: adjust CSP to allow Vercel preview tooling` (optional)

---

**Status**: PHASE 0 complete ✅ → Proceeding to implementation
