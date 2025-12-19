# Splash v2 (Magic Heart) - Acceptance Criteria & Rollback Plan

**Feature**: Magic Heart Splash v2
**Date**: 2025-12-19
**Status**: Ready for Testing
**Default State**: **OFF** (VITE_SPLASH_V2_ENABLED=false)

---

## ⸻ ACCEPTANCE CRITERIA ⸻

### ✅ 1. Timing Requirements

| Criteria | Requirement | Verification Method | Status |
|----------|-------------|---------------------|--------|
| **Total Duration** | ≤ 2.0s (hard cap) | E2E test: `splash-v2.spec.ts` | ✅ Implemented |
| **Alberta Logo Visible** | By 1.0s (≤1000ms) | E2E test: `splash-v2.spec.ts` | ✅ Implemented |
| **No Spinner** | Must not show loading spinner | E2E test: visual check | ✅ Implemented |
| **Pixie Dust Animation** | 0.0s - 0.6s (600ms) | CSS animation constants | ✅ Implemented |
| **APEX Logo Materialize** | 0.6s - 0.9s (300ms) | CSS animation constants | ✅ Implemented |
| **Text Appearance** | At 0.8s (800ms) | CSS animation constants | ✅ Implemented |
| **Alberta Logo Duration** | 1.0s - 2.0s (visible until end) | CSS animation constants | ✅ Implemented |

**Verification Steps:**
```bash
# Run E2E tests
npm run test:e2e -- splash-v2.spec.ts

# Manual verification:
# 1. Set VITE_SPLASH_V2_ENABLED=true and VITE_SPLASH_V2_FORCE_SHOW=true in .env
# 2. Run: npm run dev
# 3. Open browser with DevTools Network tab (throttled to "Fast 3G")
# 4. Measure timing from DOMContentLoaded to splash complete
# 5. Verify Alberta Innovates logo appears at ~1.0s mark
```

---

### ✅ 2. Visual Requirements

| Criteria | Requirement | Status |
|----------|-------------|--------|
| **Background** | White/light gradient (respects dark mode) | ✅ Implemented |
| **Heart Trail** | Pixie dust draws heart shape (SVG path) | ✅ Implemented |
| **APEX Logo** | Materializes with blur→sharp transition | ✅ Implemented |
| **Text** | "TDA-backed biobytes" (exact) | ✅ Implemented |
| **Alberta Logo** | Visible and persistent 1.0s - 2.0s | ✅ Implemented |
| **No Jank** | Smooth 60fps animations | ✅ CSS-based (hardware-accelerated) |

**Assets Required:**
- ✅ `/public/assets/brand/apex-logo.png` (exists)
- ⚠️ `/public/assets/brand/alberta-innovates-logo.png` (placeholder - replace with real PNG)
- ⚠️ `/public/assets/sounds/splash-chime.mp3` (optional - placeholder)

---

### ✅ 3. Persistence (Once Per Version)

| Criteria | Requirement | Verification | Status |
|----------|-------------|--------------|--------|
| **First Run** | Show full 2.0s splash | Unit test: BootController.test.ts | ✅ Implemented |
| **Repeat Visit (same version)** | Quick fade (<250ms) | Unit test + E2E | ✅ Implemented |
| **Version Bump** | Show full splash again | Unit test | ✅ Implemented |
| **Storage Key** | `splash_v2_last_seen_version` | Code review | ✅ Implemented |

**Verification Steps:**
```bash
# Run unit tests
npm run test:unit -- BootController.test.ts

# Manual verification:
# 1. Enable splash v2: VITE_SPLASH_V2_ENABLED=true
# 2. Clear browser storage
# 3. Visit app → should see full 2.0s splash
# 4. Reload page → should see quick fade or skip
# 5. Check DevTools > Application > Storage:
#    Key: splash_v2_last_seen_version
#    Value: 1.0.1 (current version)
```

---

### ✅ 4. Feature Flags (OFF by Default)

| Flag | Default | Purpose | Status |
|------|---------|---------|--------|
| `VITE_SPLASH_V2_ENABLED` | `false` | Enable/disable Splash v2 | ✅ Implemented |
| `VITE_SPLASH_V2_FORCE_SHOW` | `false` | Force show (debug/demo) | ✅ Implemented |
| `VITE_SPLASH_V2_SOUND_ENABLED` | `true` | Enable/disable chime | ✅ Implemented |

**Verification Steps:**
```bash
# Verify default behavior (flag OFF)
npm run dev
# → Should NOT show splash v2 (app loads normally)

# Enable splash v2
echo "VITE_SPLASH_V2_ENABLED=true" >> .env.local
npm run dev
# → Should show splash v2 on first visit

# Force show (for testing)
echo "VITE_SPLASH_V2_FORCE_SHOW=true" >> .env.local
npm run dev
# → Should show splash v2 every time (ignores persistence)
```

---

### ✅ 5. Single Source of Truth (No Duplication)

| Criteria | Requirement | Status |
|----------|-------------|--------|
| **BootController** | Only place that decides splash behavior | ✅ Implemented |
| **No Stacked Splash** | Cannot show legacy + v2 simultaneously | ✅ Hard guard in place |
| **Legacy Blocked** | `isLegacySplashBlocked()` always returns `true` | ✅ Implemented |
| **SplashGate Wrapper** | Single integration point in App.tsx | ✅ Implemented |

**Verification Steps:**
```bash
# Run unit tests
npm run test:unit -- BootController.test.ts

# Code review checklist:
# 1. ✅ Only ONE splash import in App.tsx (SplashGate)
# 2. ✅ StartupSplash renamed to StartupSplashLegacyDeprecated
# 3. ✅ No other components render splash
# 4. ✅ BootController.isLegacySplashBlocked() always true
```

---

### ✅ 6. Fallback Behavior

| Criteria | Requirement | Status |
|----------|-------------|--------|
| **Assets Fail** | Show static branded screen for 1.0s | ✅ Implemented (`onError` handlers) |
| **Reduced Motion** | Instant/static display (respect a11y) | ✅ Implemented (CSS media query) |
| **Sound Fail** | Gracefully fail (non-blocking) | ✅ Implemented (try-catch) |

**Verification Steps:**
```bash
# Test asset failure
# 1. Rename alberta-innovates-logo.png temporarily
# 2. Enable splash v2 and reload
# 3. Should render without breaking

# Test reduced motion
# 1. Enable "Reduce motion" in OS accessibility settings
# 2. Reload app with splash v2 enabled
# 3. Should show static/instant display (no animations)
```

---

### ✅ 7. Tests Passing

| Test Suite | Status | Command |
|------------|--------|---------|
| **Unit Tests** | ✅ Implemented | `npm run test:unit -- BootController.test.ts` |
| **E2E Tests** | ✅ Implemented | `npm run test:e2e -- splash-v2.spec.ts` |
| **Lint** | ⏳ Pending | `npm run lint` |
| **TypeScript** | ⏳ Pending | `npm run typecheck` |
| **Build** | ⏳ Pending | `npm run build:web` |

**Verification Steps:**
```bash
# Run all checks
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e -- splash-v2.spec.ts
npm run build:web
```

---

### ✅ 8. Performance Budget

| Metric | Requirement | Measurement | Status |
|--------|-------------|-------------|--------|
| **Bundle Size Impact** | < +50KB | `npm run build` (check dist size) | ⏳ Pending |
| **FCP (First Contentful Paint)** | < 1.5s | Lighthouse | ⏳ Pending |
| **LCP (Largest Contentful Paint)** | < 2.5s | Lighthouse | ⏳ Pending |
| **Animation FPS** | ≥ 60fps | Chrome DevTools Performance | ⏳ Pending |

**Verification Steps:**
```bash
# Check bundle size
npm run build:web
du -sh dist/

# Run Lighthouse
npm run preview
# Open Chrome DevTools > Lighthouse > Run audit
```

---

## ⸻ REMOVED/DEPRECATED INVENTORY ⸻

### Files Deprecated (Not Deleted)

| File | Status | Reason | Removal Date |
|------|--------|--------|--------------|
| `src/components/StartupSplash.tsx` | **Renamed** to `StartupSplash.tsx.deprecated-2025-12-19` | Was never used (orphaned code) | 2026-01-19 |
| `src/components/StartupSplashLegacyDeprecated.tsx` | **Created** as deprecation marker | Prevents accidental re-use | 2026-01-19 |

### Files Created (New)

| File | Purpose |
|------|---------|
| `src/lib/BootController.ts` | Single source of truth for splash logic |
| `src/components/splash/MagicHeartSplash.tsx` | Splash v2 component |
| `src/components/splash/SplashGate.tsx` | Integration wrapper |
| `src/components/splash/constants.ts` | Timing constants |
| `src/lib/__tests__/BootController.test.ts` | Unit tests |
| `tests/e2e/splash-v2.spec.ts` | E2E tests |
| `public/assets/brand/alberta-innovates-logo.png` | Sponsor logo (placeholder) |
| `public/assets/sounds/splash-chime.mp3` | Optional chime (placeholder) |

### Assets Removed/Replaced

| Asset | Status | Notes |
|-------|--------|-------|
| `public/assets/brand/splash-2732.png` | **Still exists** (not removed) | May be used by iOS native splash |
| `ios/App/App/Assets.xcassets/Splash.imageset/` | **Still exists** | Native iOS splash (OS-level, separate from v2) |

**Why Each Is Safe:**

1. **StartupSplash.tsx** → Never used (grep confirmed no imports). Safe to deprecate.
2. **iOS Splash.imageset** → OS-level splash (runs before webview). Not affected by v2.
3. **#root-loading** in index.html → Still needed as fallback before React mounts. Not touched.
4. **No other splash code found** → Clean codebase, no hidden splash logic.

---

## ⸻ ROLLBACK PLAN ⸻

### Option 1: Feature Flag Rollback (Instant, No Code Changes)

**Steps:**
1. Set `VITE_SPLASH_V2_ENABLED=false` in production environment variables
2. Redeploy or restart app
3. Splash v2 will be disabled immediately
4. App will load normally (no splash, just HTML fallback)

**Timeline:** < 5 minutes (environment variable change)

**Risk:** None (flag is default OFF)

---

### Option 2: Git Rollback (Full Revert)

**Steps:**
1. Identify the commits to revert:
   ```bash
   git log --oneline --grep="Splash v2" --grep="Magic Heart"
   ```

2. Create a revert commit:
   ```bash
   git revert <commit-hash-1> <commit-hash-2> ...
   # Or revert the entire branch:
   git revert -m 1 <merge-commit-hash>
   ```

3. Push to deployment branch:
   ```bash
   git push origin main  # or your deployment branch
   ```

**Timeline:** < 15 minutes (revert + deploy)

**Files Restored:**
- `src/components/StartupSplash.tsx` (if needed)
- `src/config/featureFlags.ts` (without Splash v2 flags)
- `src/App.tsx` (without SplashGate wrapper)

---

### Option 3: Manual Cleanup (If Rollback Not Possible)

**Steps:**
1. Remove `<SplashGate>` wrapper from `src/App.tsx`:
   ```diff
   - import { SplashGate } from "./components/splash/SplashGate";
   ...
   - <SplashGate>
       <div className="min-h-screen bg-background text-foreground antialiased">
         ...
       </div>
   - </SplashGate>
   ```

2. Set feature flags OFF:
   ```bash
   VITE_SPLASH_V2_ENABLED=false
   ```

3. Commit and deploy:
   ```bash
   git add src/App.tsx
   git commit -m "fix: disable Splash v2 temporarily"
   git push origin main
   ```

**Timeline:** < 10 minutes

---

## ⸻ VERIFICATION CHECKLIST ⸻

### Pre-Deployment (Development)

- [ ] **Lint passes**: `npm run lint`
- [ ] **TypeScript passes**: `npm run typecheck`
- [ ] **Unit tests pass**: `npm run test:unit -- BootController.test.ts`
- [ ] **E2E tests pass**: `npm run test:e2e -- splash-v2.spec.ts`
- [ ] **Build succeeds**: `npm run build:web`
- [ ] **Bundle size acceptable**: `du -sh dist/` (< +50KB impact)
- [ ] **Feature flag OFF by default**: Verify `.env.example` has `VITE_SPLASH_V2_ENABLED=false`

### Manual Testing (Development)

- [ ] **Flag OFF**: App loads normally (no splash v2)
- [ ] **Flag ON + First Visit**: Full 2.0s splash shows
- [ ] **Flag ON + Repeat Visit**: Quick fade or skip
- [ ] **Force Show**: Always shows splash (ignores persistence)
- [ ] **Reduced Motion**: Static display (no animations)
- [ ] **Click to Skip**: Splash dismisses immediately
- [ ] **Assets Missing**: Fallback works (no crash)
- [ ] **Dark Mode**: Splash respects theme
- [ ] **Mobile/iOS**: Native splash → HTML fallback → (optional splash v2)
- [ ] **No Duplicate Splash**: Only one splash visible at a time

### Post-Deployment (Production)

- [ ] **Smoke Test**: Visit production URL, verify normal load (flag OFF)
- [ ] **Enable Flag**: Set `VITE_SPLASH_V2_ENABLED=true` in staging
- [ ] **Timing Test**: Measure splash duration (should be ≤ 2.0s)
- [ ] **Alberta Logo**: Visible by 1.0s
- [ ] **Performance**: Lighthouse score unchanged (FCP, LCP)
- [ ] **Error Monitoring**: Check Sentry/logs for splash-related errors
- [ ] **User Feedback**: Monitor support tickets for splash complaints

### Rollback Criteria (When to Rollback)

Rollback immediately if:
- ❌ **FCP/LCP regresses** by > 500ms
- ❌ **Bundle size increases** by > 100KB
- ❌ **Splash fails to dismiss** (blank screen > 5s)
- ❌ **Duplicate splash** observed (stacking issue)
- ❌ **Critical error rate** > 1% related to splash
- ❌ **User complaints** > 10% of active users

---

## ⸻ TESTING COMMANDS ⸻

```bash
# Run all tests
npm run lint
npm run typecheck
npm run test:unit -- BootController.test.ts
npm run test:e2e -- splash-v2.spec.ts

# Build and preview
npm run build:web
npm run preview

# Enable splash v2 locally (testing)
echo "VITE_SPLASH_V2_ENABLED=true" > .env.local
echo "VITE_SPLASH_V2_FORCE_SHOW=true" >> .env.local
npm run dev

# Disable splash v2 (rollback locally)
echo "VITE_SPLASH_V2_ENABLED=false" > .env.local
npm run dev
```

---

## ⸻ FINAL CHECKLIST ⸻

### Before Merging PR

- [ ] All acceptance criteria ✅ passing
- [ ] All tests passing (lint, typecheck, unit, e2e)
- [ ] Build succeeds with no errors
- [ ] Bundle size acceptable
- [ ] Feature flags documented in `.env.example`
- [ ] Rollback plan documented (this file)
- [ ] Legacy code deprecated (not deleted)
- [ ] Manual testing complete (all scenarios)
- [ ] PR reviewed by at least 1 person
- [ ] Documentation updated (README, changelog)

### After Merging (Staging)

- [ ] Deploy to staging with flag OFF
- [ ] Verify normal app load (no splash)
- [ ] Enable flag in staging
- [ ] Test full splash experience
- [ ] Performance test (Lighthouse)
- [ ] Mobile/iOS test
- [ ] Rollback test (disable flag, verify app still works)

### Production Rollout (Gradual)

- [ ] **Week 1**: Flag OFF (monitor baseline metrics)
- [ ] **Week 2**: Enable for 10% of users (A/B test)
- [ ] **Week 3**: Enable for 50% of users (if metrics good)
- [ ] **Week 4**: Enable for 100% of users (full rollout)

---

**Status**: ✅ Ready for Testing
**Next Steps**: Run verification checklist, then open PR for review
**Rollback**: Set `VITE_SPLASH_V2_ENABLED=false` (instant)
