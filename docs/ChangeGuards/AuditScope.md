# Audit Scope & Change Guards

**Mission:** Enterprise-grade audit & remediation without breaking UI/UX or preview functionality.

**Generated:** 2025-11-05 (America/Edmonton)
**Operator Role:** CTO + DevOps + SRE
**Branch:** `claude/enterprise-audit-readiness-011CUqFVUcDcyywar5BiKueL`

---

## 0. Current State Snapshot

### Git State
```
Commit SHA: 5ee3dceb8efaca391b7b2bdcc9ece9e7caa7d279
Branch:     claude/enterprise-audit-readiness-011CUqFVUcDcyywar5BiKueL
Remote:     origin → http://local_proxy@127.0.0.1:46285/git/apexbusiness-systems/autorepai
Status:     Clean (no uncommitted changes)
```

### Recent Commits
```
5ee3dce - Update embed-test.html
18ac64c - Fix security warnings and broken preview
a30b900 - Fix broken preview
92add03 - Fix: Remove incorrect logo file
56f4a20 - Revert logo change
```

---

## 1. Allowed Change Surface

This audit operates under **minimal scope expansion** principle. Changes are permitted ONLY in these categories:

### ✅ PERMITTED: Documentation & Audit Artifacts
```
docs/**
  ├── ChangeGuards/
  ├── Audit/
  ├── Fixes/
  └── Cert/
```

### ✅ PERMITTED: Diagnostic & Probe Scripts
```
scripts/**
  └── (new audit/test scripts only, no modification of existing scripts)
```

### ✅ PERMITTED: CI/Security/Test Configuration
```
.github/workflows/**          # CI pipeline improvements
playwright.config.ts          # E2E test configuration
vitest.config.ts             # Unit test configuration
eslint.config.js             # Linting rules
tsconfig*.json               # TypeScript strict mode
lighthouserc.json            # Performance budgets
```

### ✅ CONDITIONAL: Source Code Changes
**ONLY when:**
1. Tied to a documented P0/P1 defect in `docs/Audit/Findings.md`
2. One component/file at a time
3. Before/after proof provided in `docs/Fixes/YYYY-MM-DD/<slug>.md`
4. Preview Guard passes after each change

**Allowed file patterns:**
```
src/**/*.{ts,tsx}            # Only for identified defects
supabase/functions/**/index.ts  # Edge Function fixes (security, RLS)
public/manifest.json         # PWA fixes only
public/sw.js                 # Service Worker fixes only (no blanking)
```

### ❌ HARD BANS (Do Not Touch Unless Defect Documented)
```
src/**/theme*.ts             # Global theme
src/**/*layout*.tsx          # Layout components
src/index.css                # Global styles
src/App.tsx                  # Root component (unless blocking defect)
src/main.tsx                 # Entry point (unless blocking defect)
public/sw.js                 # Service Worker (DO NOT blank/replace)
```

---

## 2. Preview Guard Protocol

**Execute after every change:**

```bash
# 1. Build succeeds
npm run build

# 2. Preview starts without error
npm run preview  # Vite preview server

# 3. Manual checks (DevTools):
#    - Console = 0 errors
#    - Network: main JS/CSS = 2xx
#    - Application → Service Workers: state unchanged (activated/waiting)
#    - Application → Manifest: parseable, no warnings
```

**STOP immediately if:**
- Preview fails to load (blank screen)
- New console errors appear
- Service Worker unregisters or enters error state
- Build fails

---

## 3. Rollback Commands

### Full Repository Rollback
```bash
git restore --source=5ee3dceb8efaca391b7b2bdcc9ece9e7caa7d279 --worktree -- .
git clean -fd
```

### Selective File Rollback (by category)
```bash
# Rollback source code only
git restore --source=5ee3dceb8efaca391b7b2bdcc9ece9e7caa7d279 src/

# Rollback PWA assets
git restore --source=5ee3dceb8efaca391b7b2bdcc9ece9e7caa7d279 public/manifest.json public/sw.js

# Rollback Edge Functions
git restore --source=5ee3dceb8efaca391b7b2bdcc9ece9e7caa7d279 supabase/functions/

# Rollback CI workflows
git restore --source=5ee3dceb8efaca391b7b2bdcc9ece9e7caa7d279 .github/workflows/
```

### Per-File Rollback Template
Each fix document (`docs/Fixes/YYYY-MM-DD/<slug>.md`) must include:
```bash
# Rollback: <Component/File Name>
git restore --source=5ee3dceb8efaca391b7b2bdcc9ece9e7caa7d279 <file-path>
npm run build
npm run preview  # verify no regression
```

---

## 4. Run/Build/Test Commands

### Local Development
```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run preview      # Preview production build
```

### Build
```bash
npm run build        # Production build → dist/
npm run build:dev    # Development mode build
```

### Type Checking & Linting
```bash
npx tsc --noEmit     # TypeScript type check (no emit)
npm run lint         # ESLint
```

### Testing (CI Pipeline)
```bash
# Unit tests (TODO in package.json)
npm run test:unit    # Vitest (not yet configured)

# E2E tests
npx playwright test                                          # All tests
npx playwright test tests/security/embed-gate.spec.ts       # Embed gate
npx playwright test tests/accessibility/wcag-audit.spec.ts  # WCAG 2.2 AA

# Accessibility
npm run test:a11y    # Axe-core tests (TODO in package.json)

# Performance
lhci autorun         # Lighthouse CI (mobile audits)
```

### Security
```bash
npm audit --production --audit-level=high   # Dependency audit
./scripts/security-check.sh                 # Security pre-deployment check
```

### Supabase Edge Functions (Deno)
```bash
deno run --allow-net --allow-env supabase/functions/<function-name>/index.ts
supabase functions deploy <function-name>
supabase functions list
```

---

## 5. Allowed Change Surface: Technology Stack

### Frontend
- **Framework:** React 18.3.1 + TypeScript 5.8.3
- **Build Tool:** Vite 5.4.19 (SWC for fast refresh)
- **Styling:** Tailwind CSS 3.4.17 + shadcn/ui (Radix UI primitives)
- **Routing:** React Router DOM 6.30.1
- **State:** TanStack Query 5.83.0 (with persistence)
- **Forms:** React Hook Form 7.61.1 + Zod 3.25.76
- **i18n:** i18next 25.5.2 + react-i18next 16.0.0

### Backend & Infrastructure
- **BaaS:** Supabase (project: `niorocndzcflrwdrofsp`)
- **Edge Functions:** Deno runtime (14 functions)
- **Database:** PostgreSQL (Supabase-managed with RLS)
- **Auth:** Supabase Auth (OAuth + email/password)
- **Storage:** Supabase Storage (with RLS)

### Mobile
- **Capacitor:** 7.4.3 (Android + iOS targets)

### PWA
- **Manifest:** `/public/manifest.json`
- **Service Worker:** `/public/sw.js`

### Testing
- **E2E:** Playwright 1.55.1 (with axe-core 4.10.2)
- **Unit:** Vitest 3.2.4 (configured but not integrated)
- **Accessibility:** @axe-core/playwright 4.10.2

### CI/CD
- **Platform:** GitHub Actions
- **Workflows:** `ci.yml`, `deno-guard.yml`, `header-sentinel.yml`
- **Gates:** Lighthouse Mobile, WCAG 2.2 AA, Embed Gate, Security Scan

---

## 6. Secrets & Environment (Redacted)

### Development (.env)
```bash
VITE_SUPABASE_PROJECT_ID="niorocndzcflrwdrofsp"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJh...HG4M" (anon key, safe for client)
VITE_SUPABASE_URL="https://niorocndzcflrwdrofsp.supabase.co"
```

### CI Secrets (GitHub Actions)
- `LHCI_GITHUB_APP_TOKEN` - Lighthouse CI GitHub App
- (Additional secrets may exist for Supabase service role, Twilio, etc.)

---

## 7. Integration Endpoints

### Supabase Edge Functions (Deployed)
```
1.  ai-chat                       - AI conversation handler
2.  capture-client-ip             - IP capture for audit logs
3.  oauth-callback                - OAuth provider callback handler
4.  retrieve-encryption-key       - Key retrieval (RLS-protected)
5.  send-sms                      - SMS sender (Twilio wrapper)
6.  social-post                   - Social media post handler
7.  store-encryption-key          - Key storage (RLS-protected)
8.  store-integration-credentials - Credential vault
9.  twilio-sms                    - Twilio SMS webhook
10. twilio-voice                  - Twilio Voice webhook
11. unsubscribe                   - Unsubscribe handler
12. vehicles-search               - Vehicle inventory search
13. (2 more - check supabase/functions/)
```

### External Integrations
- **Twilio:** SMS/Voice webhooks (signature validation required)
- **OAuth Providers:** (to be documented in RepoCensus.md)

---

## 8. Enforcement Rules

1. **No UI/UX changes** unless fixing a documented defect in that exact component.
2. **Do not blank the preview**, unregister/replace the service worker, or modify routes/themes.
3. **Every change must be reversible** by file-scoped rollback noted in its fix doc.
4. **If any step introduces a console error or test regression:** STOP, revert, log, and propose before proceeding.
5. **One defect per commit** with clear message and artifact link.

---

## 9. Success Criteria

- [ ] All P0 issues resolved
- [ ] All P1 issues resolved (or documented as accepted risk)
- [ ] CI pipeline green (all gates pass)
- [ ] Preview Guard passes (Console=0 errors, no visual regression)
- [ ] Production readiness gates pass (Lighthouse ≥90 PWA, ≥85 Perf, WCAG 2.2 AA, RLS verified)
- [ ] `docs/Cert/GO-NO-GO.md` with one-line decision and artifact links

---

**Next Steps:**
1. ✅ AuditScope.md created
2. → Create `docs/Audit/RepoCensus.md`
3. → Diagnose GitHub connection (`docs/Audit/GitHubConnection.md`)
4. → Run static checks (type/lint/build/audit)
5. → Create `docs/Audit/Findings.md` with all issues
6. → Create `docs/Audit/FixPlan.md` with P0/P1/P2 priorities
