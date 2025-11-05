# Prioritized Fix Plan & Remediation Roadmap

**Generated:** 2025-11-05 (America/Edmonton)
**Mission:** Enterprise-grade remediation with zero production impact
**Branch:** `claude/enterprise-audit-readiness-011CUqFVUcDcyywar5BiKueL`

---

## Executive Summary

**Total Issues:** 13
- **🔴 P0 (Ship-Blockers):** 2 issues → **ETA: 15 minutes**
- **🟡 P1 (High-Impact):** 5 issues → **ETA: 18-28 hours**
- **🟢 P2 (Polish/Docs):** 6 issues → **ETA: 10-15 hours**

**Critical Path:** P0 fixes must complete before any other work. CI pipeline is currently broken.

---

## P0: Ship-Blockers (Must Fix Immediately)

### P0.1 - Add Missing CI Test Scripts ⏱️ 10 min

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P0.1 |
| **Severity** | 🔴 Critical |
| **Root Cause** | CI workflow references npm scripts that don't exist |
| **Impact** | Merge gate blocks ALL PRs (CI fails at unit-tests/a11y-tests/e2e-tests jobs) |
| **Files Affected** | `package.json` |
| **Owner** | DevOps |
| **ETA** | 10 minutes |

**Detailed Analysis:**

CI workflow (`.github/workflows/ci.yml`) calls:
```yaml
- npm run test:unit    # Line 43 → script missing
- npm run test:a11y    # Line 63 → script missing
- npm run test:e2e     # Line 86 → script missing (inferred)
```

Current `package.json` scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

**Fix Implementation:**

**Step 1:** Add scripts to `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:coverage": "vitest run --coverage",
    "test:e2e": "playwright test tests/e2e/ tests/security/",
    "test:a11y": "playwright test tests/accessibility/",
    "test:perf": "playwright test tests/performance/",
    "test:all": "npm run lint && npm run test:unit && npm run test:e2e && npm run test:a11y"
  }
}
```

**Step 2:** Verify locally

```bash
npm run test:unit    # Should run vitest
npm run test:a11y    # Should run Playwright a11y tests
npm run test:e2e     # Should run Playwright e2e/security tests
```

**Step 3:** Commit with descriptive message

```bash
git add package.json
git commit -m "Fix: Add missing CI test scripts (P0.1)

- Add test:unit (vitest run)
- Add test:a11y (playwright accessibility tests)
- Add test:e2e (playwright e2e/security tests)
- Add test:all (unified test runner)

Fixes CI pipeline failures in unit-tests, accessibility-tests,
and e2e-tests jobs. Merge gate will now function correctly.

Refs: docs/Audit/Findings.md#p0.1"
```

**Rollback (if needed):**
```bash
git restore --source=5ee3dceb8efaca391b7b2bdcc9ece9e7caa7d279 package.json
```

**Artifact:** Before/after package.json diff to be saved in `docs/Fixes/2025-11-05/p0.1-ci-scripts.md`

**Success Criteria:**
- [ ] `npm run test:unit` executes vitest
- [ ] `npm run test:a11y` executes Playwright
- [ ] `npm run test:e2e` executes Playwright
- [ ] CI pipeline unit-tests job passes (or fails gracefully with test failures, not script errors)
- [ ] Preview Guard: App builds and runs (`npm run build && npm run preview`)

---

### P0.2 - Fix npm Dependency Vulnerabilities ⏱️ 5 min

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P0.2 |
| **Severity** | 🔴 Critical (for CI/dev hygiene) |
| **Root Cause** | esbuild <=0.24.2 and vite <=6.1.6 have moderate CVEs |
| **Impact** | CI security-scan job may fail; dev server vulnerable to request spoofing |
| **Files Affected** | `package-lock.json` |
| **Owner** | DevOps |
| **ETA** | 5 minutes |

**Detailed Analysis:**

```bash
$ npm audit --production --audit-level=high

esbuild  <=0.24.2
Severity: moderate
CVE: GHSA-67mh-4wv8-2f99
Issue: esbuild dev server can receive requests from any website

vite  <=6.1.6
Severity: moderate
Issue: Vite middleware may serve files starting with the same name
       as public directory
```

**Production Risk:** ✅ None (dev dependencies only)
**Development Risk:** 🟡 Moderate (dev server exploitable if attacker knows localhost URL)

**Fix Implementation:**

**Step 1:** Auto-fix vulnerabilities

```bash
npm audit fix
```

**Step 2:** Verify fix

```bash
npm audit --production --audit-level=high
# Expected: 0 vulnerabilities
```

**Step 3:** Test build and dev server

```bash
npm run build        # Should succeed
npm run dev          # Should start on port 8080
# Open http://localhost:8080 and verify app loads
```

**Step 4:** Commit updated lockfile

```bash
git add package-lock.json package.json
git commit -m "Fix: Update esbuild and vite to fix CVEs (P0.2)

- npm audit fix applied
- esbuild upgraded to >0.24.2
- vite upgraded to >6.1.6
- Resolves GHSA-67mh-4wv8-2f99 (dev server request spoofing)

Dev dependencies only. No production impact.

Refs: docs/Audit/Findings.md#p0.2"
```

**Rollback (if build breaks):**
```bash
git restore --source=5ee3dceb8efaca391b7b2bdcc9ece9e7caa7d279 package-lock.json package.json
npm ci
```

**Artifact:** npm audit report before/after to be saved in `docs/Fixes/2025-11-05/p0.2-npm-audit.md`

**Success Criteria:**
- [ ] `npm audit --production --audit-level=high` shows 0 vulnerabilities
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts without errors
- [ ] Preview Guard: App root renders, console = 0 errors

---

## P1: High-Impact Issues (Fix Before Production)

### P1.1 - Copy Logo to public/ for PWA Icon ⏱️ 2 min

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P1.1 |
| **Severity** | 🟡 High |
| **Root Cause** | `manifest.json` references `/logo.png` but file doesn't exist in `public/` |
| **Impact** | PWA install prompt shows no icon; 404 error in browser console |
| **Files Affected** | `public/logo.png` (new file) |
| **Owner** | Frontend |
| **ETA** | 2 minutes |

**Detailed Analysis:**

```
manifest.json:
  "icons": [{ "src": "/logo.png", "sizes": "512x512" }]

public/ directory:
  ❌ logo.png (missing)

src/assets/ directory:
  ✅ logo.png (exists, 3018 KB)

Result:
  Browser tries to load /logo.png → 404
  PWA install prompt has no icon
```

**Fix Implementation:**

**Step 1:** Copy logo from src/ to public/

```bash
cp src/assets/logo.png public/logo.png
```

**Step 2:** Verify file exists

```bash
ls -lh public/logo.png
# Expected: -rw-r--r-- 1 user user 3.0M Nov 5 12:00 public/logo.png
```

**Step 3:** Test in browser

```bash
npm run build
npm run preview
# Open http://localhost:4173
# Open DevTools → Application → Manifest
# Verify icon shows in manifest inspector
```

**Step 4:** Commit

```bash
git add public/logo.png
git commit -m "Fix: Add logo.png to public/ for PWA icon (P1.1)

- Copy src/assets/logo.png to public/logo.png
- Fixes 404 error for manifest icon reference
- PWA install prompt will now show app icon

Refs: docs/Audit/Findings.md#p1.1"
```

**Rollback:**
```bash
git restore --source=HEAD~1 public/logo.png
rm public/logo.png
```

**Artifact:** Screenshot of PWA manifest with icon to be saved in `docs/Fixes/2025-11-05/p1.1-pwa-icon.md`

**Success Criteria:**
- [ ] `public/logo.png` exists and is ~3 MB
- [ ] DevTools → Application → Manifest shows icon preview
- [ ] No 404 errors in console for `/logo.png`
- [ ] Preview Guard: App renders, console = 0 errors

---

### P1.2 - Enable TypeScript Strict Mode ⏱️ 8-12 hrs

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P1.2 |
| **Severity** | 🟡 High |
| **Root Cause** | `tsconfig.json` has strict checks disabled → implicit any, null bugs |
| **Impact** | 79 TypeScript `any` types; runtime bugs not caught at compile time |
| **Files Affected** | `tsconfig.json`, ~30 source files |
| **Owner** | Engineering Lead |
| **ETA** | 8-12 hours (incremental) |

**Detailed Analysis:**

Current `tsconfig.json`:
```json
{
  "compilerOptions": {
    "noImplicitAny": false,        // ❌ Allows implicit any
    "strictNullChecks": false,     // ❌ Allows null/undefined bugs
    "noUnusedParameters": false,   // ❌ Dead code not detected
    "noUnusedLocals": false        // ❌ Dead code not detected
  }
}
```

ESLint found 79 instances of explicit `any` (e.g., `data: any`). With strict mode, implicit any would be caught too.

**Fix Implementation (Incremental):**

**Phase 1: Enable noImplicitAny** (4-6 hours)

```json
{
  "compilerOptions": {
    "noImplicitAny": true,  // ✅
    "strictNullChecks": false,
    "noUnusedParameters": false,
    "noUnusedLocals": false
  }
}
```

```bash
npx tsc --noEmit
# Fix all errors file-by-file:
# - Add explicit types to function parameters
# - Add types to useState/useReducer
# - Add return types to functions
```

**Example Fix:**
```typescript
// Before (implicit any):
function handleSubmit(data) {
  console.log(data.email);
}

// After (explicit type):
interface FormData {
  email: string;
  password: string;
}
function handleSubmit(data: FormData) {
  console.log(data.email);
}
```

**Commit after Phase 1:**
```bash
git add tsconfig.json src/
git commit -m "Refactor: Enable noImplicitAny (P1.2 Phase 1)

- Set noImplicitAny: true in tsconfig.json
- Add explicit types to 79 instances across src/
- All tsc --noEmit checks now pass

Phase 1/4 of TypeScript strict mode migration.
Refs: docs/Audit/FixPlan.md#p1.2"
```

**Phase 2: Enable strictNullChecks** (2-3 hours)

```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true,  // ✅
    "noUnusedParameters": false,
    "noUnusedLocals": false
  }
}
```

```bash
npx tsc --noEmit
# Fix all null/undefined errors:
# - Add optional chaining (obj?.prop)
# - Add nullish coalescing (value ?? default)
# - Add type guards (if (value !== null) { ... })
```

**Example Fix:**
```typescript
// Before (unsafe):
const name = user.profile.name;  // Error: profile might be undefined

// After (safe):
const name = user.profile?.name ?? 'Guest';
```

**Commit after Phase 2:**
```bash
git add tsconfig.json src/
git commit -m "Refactor: Enable strictNullChecks (P1.2 Phase 2)

- Set strictNullChecks: true in tsconfig.json
- Add null guards and optional chaining across src/
- All tsc --noEmit checks now pass

Phase 2/4 of TypeScript strict mode migration.
Refs: docs/Audit/FixPlan.md#p1.2"
```

**Phase 3: Enable unused variable checks** (1-2 hours)

```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedParameters": true,  // ✅
    "noUnusedLocals": true       // ✅
  }
}
```

```bash
npx tsc --noEmit
# Remove or prefix unused variables with underscore:
# - Remove dead code
# - Prefix intentional unused params: _unused
```

**Phase 4: Enable full strict mode** (1 hour)

```json
{
  "compilerOptions": {
    "strict": true  // ✅ Enables all strict flags
  }
}
```

**Rollback (per phase):**
```bash
git revert HEAD  # Revert last commit
npm run build    # Verify build works
```

**Artifact:** Per-phase commit diffs to be saved in `docs/Fixes/2025-11-05/p1.2-typescript-strict-*.md`

**Success Criteria:**
- [ ] `tsconfig.json` has `"strict": true`
- [ ] `npx tsc --noEmit` exits with code 0
- [ ] `npm run build` succeeds
- [ ] ESLint `@typescript-eslint/no-explicit-any` errors reduced to 0
- [ ] Preview Guard: App renders, console = 0 errors

---

### P1.3 - Implement Code Splitting for Large Bundles ⏱️ 3-4 hrs

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P1.3 |
| **Severity** | 🟡 High |
| **Root Cause** | 2 chunks >500 kB → slow page load on mobile |
| **Impact** | Lighthouse performance < 85; LCP > 2500ms; merge gate may fail |
| **Files Affected** | `vite.config.ts`, `src/pages/QuoteBuilder.tsx` |
| **Owner** | Frontend Performance |
| **ETA** | 3-4 hours |

**Detailed Analysis:**

Current bundle sizes:
```
index-DisxPQui.js:       520.68 kB (156.92 kB gzipped)  ⚠️
QuoteBuilder-BVBi1QeA.js: 430.04 kB (139.46 kB gzipped)  ⚠️
```

Vite warning:
```
(!) Some chunks are larger than 500 kB after minification.
```

Lighthouse performance gate:
```
Required: Performance ≥85, LCP ≤2500ms
Risk:     Large JS parse time on mobile → gate failure
```

**Fix Implementation:**

**Step 1:** Add manual chunk splitting to `vite.config.ts`

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor splitting
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // UI library
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Chart library (heavy)
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            // PDF generation (heavy, lazy load)
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-vendor';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // Other vendors
            return 'vendor';
          }
        }
      }
    }
  }
});
```

**Step 2:** Lazy load heavy components (PDF generation)

```typescript
// src/pages/QuoteBuilder.tsx
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load PDF generator (heavy dependency)
const PDFGenerator = lazy(() => import('@/components/PDF/PDFGenerator'));

export function QuoteBuilder() {
  return (
    <div>
      <h1>Quote Builder</h1>
      {/* PDF generator loads only when needed */}
      <Suspense fallback={<Loader2 className="animate-spin" />}>
        <PDFGenerator />
      </Suspense>
    </div>
  );
}
```

**Step 3:** Build and verify chunk sizes

```bash
npm run build
# Expected output:
# index.js:         ~200 kB (50% reduction)
# QuoteBuilder.js:  ~150 kB (65% reduction)
# pdf-vendor.js:    ~150 kB (lazy loaded)
# react-vendor.js:  ~150 kB
# ui-vendor.js:     ~100 kB
```

**Step 4:** Test lazy loading

```bash
npm run preview
# Open http://localhost:4173
# Open DevTools → Network → JS filter
# Navigate to Quote Builder
# Verify pdf-vendor.js loads only when QuoteBuilder opens
```

**Step 5:** Commit

```bash
git add vite.config.ts src/pages/QuoteBuilder.tsx
git commit -m "Perf: Implement code splitting for large bundles (P1.3)

- Add manualChunks config to vite.config.ts
  - Split React, Radix UI, Recharts, Supabase to separate chunks
  - Isolate PDF libraries (jspdf, html2canvas) for lazy load
- Lazy load PDFGenerator in QuoteBuilder page
- Result: index.js 520kB → 200kB (62% reduction)
- Result: QuoteBuilder.js 430kB → 150kB (65% reduction)

Improves Lighthouse performance score and LCP metric.
Refs: docs/Audit/FixPlan.md#p1.3"
```

**Rollback:**
```bash
git restore --source=HEAD~1 vite.config.ts src/pages/QuoteBuilder.tsx
npm run build
```

**Artifact:** Before/after bundle size comparison + Lighthouse scores to be saved in `docs/Fixes/2025-11-05/p1.3-code-splitting.md`

**Success Criteria:**
- [ ] No chunks >500 kB after build
- [ ] PDF libraries load only when QuoteBuilder opens (DevTools Network tab)
- [ ] Lighthouse Performance ≥85 (mobile)
- [ ] LCP ≤2500ms
- [ ] Preview Guard: App renders, console = 0 errors

---

### P1.4 - Fix React Hook Dependency Warnings ⏱️ 2-3 hrs

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P1.4 |
| **Severity** | 🟡 High |
| **Root Cause** | 5 useEffect hooks missing dependencies → stale closures |
| **Impact** | Unexpected re-render behavior; stale data in callbacks |
| **Files Affected** | 5 files (AIChatWidget, LeadTimeline, useOfflineSync, etc.) |
| **Owner** | Frontend |
| **ETA** | 2-3 hours |

**Detailed Analysis:**

ESLint warnings:
```
src/components/Chat/AIChatWidget.tsx:30
  warning: React Hook useEffect has a missing dependency: 'messages.length'

src/components/Lead/LeadTimeline.tsx:54
  warning: React Hook useEffect has a missing dependency: 'fetchInteractions'

src/hooks/useOfflineSync.ts:49
  warning: React Hook useEffect has a missing dependency: 'syncNow'

(2 more instances)
```

**Fix Implementation:**

**Example 1: Add stable function reference with useCallback**

```typescript
// Before (warning):
const fetchInteractions = async () => {
  const data = await api.get(`/leads/${leadId}/interactions`);
  setInteractions(data);
};

useEffect(() => {
  fetchInteractions();
}, [leadId]);  // ⚠️ Missing: fetchInteractions

// After (fixed):
const fetchInteractions = useCallback(async () => {
  const data = await api.get(`/leads/${leadId}/interactions`);
  setInteractions(data);
}, [leadId]);  // ✅ Stable reference

useEffect(() => {
  fetchInteractions();
}, [leadId, fetchInteractions]);  // ✅ All deps included
```

**Example 2: Extract dependency into effect**

```typescript
// Before (warning):
useEffect(() => {
  scrollToBottom();
}, [messages]);  // ⚠️ Missing: messages.length

// After (fixed):
useEffect(() => {
  scrollToBottom();
}, [messages.length]);  // ✅ Use specific dependency
```

**Example 3: Suppress if intentional (run once)**

```typescript
// Before (warning):
useEffect(() => {
  syncNow();
}, []);  // ⚠️ Missing: syncNow

// After (with justification):
useEffect(() => {
  syncNow();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);  // Intentional: run once on mount
```

**Step-by-step process:**

```bash
# Fix each file individually
npm run lint | grep "react-hooks/exhaustive-deps"
# Output: 5 warnings

# Fix file 1:
# - Open src/components/Chat/AIChatWidget.tsx
# - Add useCallback or adjust dependencies
# - Test in browser (npm run dev)
# - Commit

git add src/components/Chat/AIChatWidget.tsx
git commit -m "Fix: Add missing useEffect dependency in AIChatWidget (P1.4)"

# Repeat for files 2-5
```

**Rollback:**
```bash
git revert HEAD~5..HEAD  # Revert last 5 commits
```

**Artifact:** Per-file fix with test evidence to be saved in `docs/Fixes/2025-11-05/p1.4-react-hooks-*.md`

**Success Criteria:**
- [ ] `npm run lint` shows 0 `react-hooks/exhaustive-deps` warnings
- [ ] Manual testing confirms no regression (chat, timeline, sync work correctly)
- [ ] Preview Guard: App renders, console = 0 errors

---

### P1.5 - Verify Service Worker Registration ⏱️ 30 min

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P1.5 |
| **Severity** | 🟡 High |
| **Root Cause** | Unknown if SW is registered (not verified in audit) |
| **Impact** | PWA may not work offline; installability broken |
| **Files Affected** | `src/main.tsx` or `index.html` |
| **Owner** | Frontend |
| **ETA** | 30 minutes |

**Detailed Analysis:**

Service Worker (`public/sw.js`) exists and is enterprise-grade, but registration call not verified.

**Fix Implementation:**

**Step 1:** Check `src/main.tsx` for SW registration

```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Service Worker registration
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Registered:', registration.scope);
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 2:** If missing, add registration code

```bash
# Edit src/main.tsx to add SW registration
# (See code above)

git add src/main.tsx
git commit -m "Fix: Add Service Worker registration (P1.5)

- Register sw.js in production builds
- Log registration success/failure for debugging
- Only registers in production (not dev mode)

Enables PWA offline functionality and installability.
Refs: docs/Audit/FixPlan.md#p1.5"
```

**Step 3:** Test in production build

```bash
npm run build
npm run preview
# Open http://localhost:4173
# Open DevTools → Application → Service Workers
# Verify: Status = "activated", Scope = "/"
```

**Rollback:**
```bash
git restore --source=HEAD~1 src/main.tsx
```

**Artifact:** Screenshot of DevTools → Application → Service Workers to be saved in `docs/Fixes/2025-11-05/p1.5-sw-registration.md`

**Success Criteria:**
- [ ] SW registration code exists in `src/main.tsx` or `index.html`
- [ ] DevTools → Application → Service Workers shows "activated"
- [ ] Lighthouse PWA score ≥90
- [ ] Preview Guard: App renders, console = 0 errors

---

## P2: Polish & Documentation (Non-Blocking)

### P2.1 - Replace Placeholder Screenshot in Manifest ⏱️ 30 min

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P2.1 |
| **Severity** | 🟢 Low |
| **Root Cause** | `manifest.json` uses `/placeholder.svg` for screenshot |
| **Impact** | App store submission may be rejected; poor UX in install prompt |
| **Files Affected** | `public/manifest.json`, `public/screenshots/` (new) |
| **Owner** | Design + Frontend |
| **ETA** | 30 minutes |

**Fix:** Capture real screenshots (desktop + mobile) and update manifest.

---

### P2.2 - Add Explicit RLS Deny Policy for encryption_keys ⏱️ 5 min

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P2.2 |
| **Severity** | 🟢 Low |
| **Root Cause** | No explicit anonymous DENY policy (relies on default) |
| **Impact** | Security check script fails; best practice violation |
| **Files Affected** | New migration file |
| **Owner** | Backend/DBA |
| **ETA** | 5 minutes |

**Fix:** Create migration with explicit deny:
```sql
CREATE POLICY "Block anonymous access to encryption_keys"
ON public.encryption_keys
FOR ALL
TO anon
USING (false);
```

---

### P2.3 - Fix Empty Interface Declarations ⏱️ 10 min

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P2.3 |
| **Severity** | 🟢 Low |
| **Root Cause** | 2 empty interfaces (code smell) |
| **Impact** | ESLint errors (no functional impact) |
| **Files Affected** | `src/components/ui/command.tsx`, `src/components/ui/textarea.tsx` |
| **Owner** | Frontend |
| **ETA** | 10 minutes |

**Fix:** Replace with type aliases or add eslint-disable comment.

---

### P2.4 - Remove Useless Try/Catch ⏱️ 2 min

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P2.4 |
| **Severity** | 🟢 Low |
| **Root Cause** | Try/catch that just rethrows (code smell) |
| **Impact** | ESLint error (no functional impact) |
| **Files Affected** | `src/hooks/useOfflineSync.ts:132` |
| **Owner** | Frontend |
| **ETA** | 2 minutes |

**Fix:** Remove try/catch and let error propagate naturally.

---

### P2.5 - Create API Documentation for Edge Functions ⏱️ 4-6 hrs

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P2.5 |
| **Severity** | 🟢 Low |
| **Root Cause** | 13 Edge Functions have no API docs |
| **Impact** | Operations burden; new developers struggle |
| **Files Affected** | `docs/api/EdgeFunctions.md` (new) |
| **Owner** | Technical Writer + Backend |
| **ETA** | 4-6 hours |

**Fix:** Document each function: purpose, request/response schema, auth, rate limits, examples.

---

### P2.6 - Create RLS Policy Documentation ⏱️ 2-3 hrs

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P2.6 |
| **Severity** | 🟢 Low |
| **Root Cause** | No human-readable RLS policy reference |
| **Impact** | Security audit burden; compliance gaps |
| **Files Affected** | `docs/security/RLS-Policies.md` (new) |
| **Owner** | Backend/Security |
| **ETA** | 2-3 hours |

**Fix:** Create table-by-table policy summary with access matrix.

---

### P2.7 - Create Deployment Runbook ⏱️ 3-4 hrs

| Attribute | Value |
|-----------|-------|
| **Issue ID** | P2.7 |
| **Severity** | 🟢 Low |
| **Root Cause** | No step-by-step deployment guide |
| **Impact** | Operations risk; rollback confusion |
| **Files Affected** | `docs/ops/Deployment.md` (new) |
| **Owner** | DevOps |
| **ETA** | 3-4 hours |

**Fix:** Create runbook with pre-deploy checklist, deploy commands, post-deploy verification, rollback.

---

## Execution Timeline

### Week 1: P0 Fixes (Must Complete)

| Day | Task | Owner | Hours |
|-----|------|-------|-------|
| Day 1 AM | P0.1 - Add CI scripts | DevOps | 0.2 |
| Day 1 AM | P0.2 - Fix npm audit | DevOps | 0.1 |
| Day 1 PM | P1.1 - Copy logo to public/ | Frontend | 0.05 |
| Day 1 PM | P1.5 - Verify SW registration | Frontend | 0.5 |
| Day 2-3 | P1.2 - TypeScript strict (Phase 1-2) | Engineering | 8 |
| Day 4 | P1.3 - Code splitting | Frontend | 4 |
| Day 4 PM | P1.4 - React hooks (start) | Frontend | 2 |
| Day 5 | P1.4 - React hooks (finish) | Frontend | 1 |

**Total Week 1:** ~16 hours (P0 + most P1)

### Week 2: P1 Completion + P2 Polish

| Day | Task | Owner | Hours |
|-----|------|-------|-------|
| Day 6-7 | P1.2 - TypeScript strict (Phase 3-4) | Engineering | 4 |
| Day 8 | P2.1 - Screenshots | Design | 0.5 |
| Day 8 | P2.2 - RLS policy | Backend | 0.1 |
| Day 8 | P2.3 - Empty interfaces | Frontend | 0.2 |
| Day 9-10 | P2.5 - API docs | Tech Writer | 6 |
| Day 11 | P2.6 - RLS docs | Backend | 3 |
| Day 12 | P2.7 - Deployment runbook | DevOps | 4 |

**Total Week 2:** ~18 hours (P1 finish + P2)

---

## Commit Strategy

**One defect per commit** with descriptive messages:

```bash
# Good commit message format:
<type>: <short summary> (<issue-id>)

<detailed description>
- Bullet points of changes
- Root cause explained
- Test evidence

Refs: docs/Audit/FixPlan.md#<issue-id>
```

**Example:**
```bash
git commit -m "Fix: Add missing CI test scripts (P0.1)

CI workflow references npm scripts that don't exist, causing
unit-tests, accessibility-tests, and e2e-tests jobs to fail.

Changes:
- Add test:unit script (vitest run)
- Add test:a11y script (playwright accessibility tests)
- Add test:e2e script (playwright e2e/security tests)
- Add test:all unified runner

Tested:
- npm run test:unit → vitest executes
- npm run test:e2e → playwright executes
- CI pipeline green (local simulation)

Refs: docs/Audit/FixPlan.md#p0.1"
```

---

## Success Criteria (GO/NO-GO)

### P0 Gate (Must Pass to Merge)
- [ ] CI pipeline passes (all jobs green)
- [ ] npm audit shows 0 high/critical vulnerabilities
- [ ] Preview deploys and loads without errors

### P1 Gate (Must Pass for Production)
- [ ] Lighthouse Performance ≥85 (mobile)
- [ ] Lighthouse PWA ≥90
- [ ] LCP ≤2500ms
- [ ] ESLint shows 0 errors (warnings OK)
- [ ] TypeScript strict mode enabled
- [ ] All React hooks have correct dependencies

### P2 Gate (Nice-to-Have)
- [ ] API documentation complete
- [ ] RLS documentation complete
- [ ] Deployment runbook complete
- [ ] Real screenshots in manifest

---

## Risk Mitigation

### Risk 1: TypeScript Strict Mode Breaks Build
**Mitigation:** Enable incrementally (4 phases), commit after each phase, test thoroughly.
**Rollback:** `git revert` last commit, re-run build.

### Risk 2: Code Splitting Breaks Lazy Loading
**Mitigation:** Test each lazy-loaded component in browser before committing.
**Rollback:** `git restore vite.config.ts`, rebuild.

### Risk 3: React Hook Fixes Cause Re-Render Loops
**Mitigation:** Test each fix in dev mode, verify no infinite loops in console.
**Rollback:** `git revert` specific commit.

---

## Next Steps

1. ✅ **FixPlan.md created**
2. → **Begin P0.1:** Add CI scripts to package.json
3. → **Begin P0.2:** Run npm audit fix
4. → **Test CI:** Push to branch and verify CI pipeline passes
5. → **Begin P1 fixes** in order: P1.1 → P1.5 → P1.3 → P1.4 → P1.2
6. → **Create Production Readiness Report** (docs/Cert/Readiness.md)
7. → **Create GO/NO-GO decision** (docs/Cert/GO-NO-GO.md)

---

**Fix Plan Complete.** Prioritized remediation roadmap with precise ETAs, rollback procedures, and success criteria.
