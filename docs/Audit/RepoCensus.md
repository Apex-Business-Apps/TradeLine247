# Repository & Environment Census

**Generated:** 2025-11-05 (America/Edmonton)
**Purpose:** Comprehensive inventory of toolchain, runtime, integrations, and deployment surface.

---

## 1. Toolchain & Build System

### Node.js Environment
```
Node:    v22.21.0
npm:     v10.9.4
Runtime: Linux 4.4.0
```

### Package Manager
- **Primary:** npm (package-lock.json present)
- **Alternative:** pnpm/yarn supported but not active

### Framework Stack
```yaml
Core:
  - React: 18.3.1
  - TypeScript: 5.8.3
  - Vite: 5.4.19 (build tool)
  - @vitejs/plugin-react-swc: 3.11.0 (SWC for fast refresh)

Routing:
  - react-router-dom: 6.30.1

State Management:
  - @tanstack/react-query: 5.83.0 (with persistence)
  - @tanstack/react-query-persist-client: 5.90.2

UI Framework:
  - shadcn/ui (Radix UI primitives)
  - Tailwind CSS: 3.4.17
  - lucide-react: 0.462.0 (icons)
  - next-themes: 0.3.0 (dark mode)

Forms & Validation:
  - react-hook-form: 7.61.1
  - zod: 3.25.76
  - @hookform/resolvers: 3.10.0

i18n:
  - i18next: 25.5.2
  - react-i18next: 16.0.0
  - i18next-browser-languagedetector: 8.2.0
```

### Linting & Formatting
```yaml
ESLint: 9.32.0
  - @eslint/js: 9.32.0
  - typescript-eslint: 8.38.0
  - eslint-plugin-react-hooks: 5.2.0
  - eslint-plugin-react-refresh: 0.4.20

Config: eslint.config.js
```

### TypeScript Configuration
```yaml
Base: tsconfig.json
  - References: tsconfig.app.json, tsconfig.node.json
  - Path alias: @/* → ./src/*

Compiler Options (⚠️ WEAK):
  - noImplicitAny: false        # ⚠️ Should be true
  - strictNullChecks: false     # ⚠️ Should be true
  - noUnusedParameters: false   # ⚠️ Should be true
  - noUnusedLocals: false       # ⚠️ Should be true
  - skipLibCheck: true          # OK for dependencies
  - allowJs: true               # OK for gradual migration
```
**🔴 FINDING:** TypeScript strict mode is disabled. This allows implicit `any` types and null/undefined bugs.

---

## 2. Testing Infrastructure

### E2E Testing (Playwright 1.55.1)
```yaml
Config: playwright.config.ts
Test Dir: ./tests
Base URL: http://localhost:8080 (or E2E_BASE_URL env var)

Browsers:
  - Desktop Chrome
  - Desktop Firefox
  - Desktop Safari (webkit)
  - Mobile Chrome (Pixel 5)
  - Mobile Safari (iPhone 13)

Reports:
  - HTML: artifacts/e2e/html-report
  - JUnit: artifacts/e2e/junit.xml
  - JSON: artifacts/e2e/test-results.json

Features:
  - Trace on failure
  - Screenshot on failure
  - Video on failure
  - Parallel execution (CI: workers=1)
  - Retries: 2 (CI only)
```

### Unit Testing (Vitest 3.2.4)
```yaml
Config: vitest.config.ts
Environment: jsdom
Setup: ./tests/setup.ts
Globals: true (describe, it, expect available globally)

Coverage:
  - Provider: v8
  - Reporters: text, json, html
  - Excludes: node_modules/, tests/, **/*.config.ts, **/types.ts

Status: ⚠️ CONFIGURED BUT NOT INTEGRATED
  - package.json missing "test:unit" script
  - CI workflow has TODO comment for test:unit
```
**🔴 FINDING:** Vitest is configured but no test:unit script exists. CI job will fail.

### Accessibility Testing (axe-core 4.10.2)
```yaml
Integration: @axe-core/playwright: 4.10.2
Test Dirs:
  - tests/accessibility/wcag-audit.spec.ts
  - tests/accessibility/complete-wcag.spec.ts

WCAG Target: 2.2 Level AA
CI Gate: ENFORCED (merge blocked on violations)

Status: ⚠️ SCRIPTS MISSING
  - package.json missing "test:a11y" script
  - CI workflow has TODO comment for test:a11y
```
**🔴 FINDING:** A11y tests exist but no test:a11y script. CI job will fail.

### Performance Testing (Lighthouse CI)
```yaml
Config: lighthouserc.json
CLI: @lhci/cli@0.12.x

Enforced Budgets (Mobile):
  - Performance: ≥85
  - Accessibility: ≥90
  - LCP: ≤2500ms
  - TBT: ≤300ms
  - CLS: ≤0.1

CI Gate: ENFORCED (merge blocked on violations)
```

### Test Structure
```
tests/
  ├── accessibility/    # WCAG 2.2 AA tests
  ├── e2e/              # User journey tests
  ├── performance/      # Perf tests
  ├── security/         # Embed gate, CSP, RLS
  ├── unit/             # Component/logic tests
  ├── setup.ts          # Global test setup
  └── global-setup.ts   # Playwright global setup
```

---

## 3. Backend as a Service (Supabase)

### Project Configuration
```yaml
Project ID: niorocndzcflrwdrofsp
URL: https://niorocndzcflrwdrofsp.supabase.co
Region: (to be determined from Supabase dashboard)

Anon Key (Public):
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pb3JvY25kemNmbHJ3ZHJvZnNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTg2OTksImV4cCI6MjA3NDg3NDY5OX0.cQLjnpVEv-e1kz5nc2ntrB21KkJV4GwFT281_53HG4M

  Decoded:
    iss: supabase
    ref: niorocndzcflrwdrofsp
    role: anon
    iat: 1759298699 (2025-10-01)
    exp: 2074874699 (2035-09-13)
```

### Database
- **Engine:** PostgreSQL (Supabase-managed)
- **Migrations:** 12 migration files in `supabase/migrations/`
- **Seed Data:** `supabase/seed.sql`
- **RLS:** Row-Level Security (to be audited)

### Authentication
```yaml
Providers:
  - Email/Password: ✅ Active (see src/pages/Auth.tsx)
  - OAuth: ⚠️ oauth-callback function exists but no providers configured in UI

Features:
  - Sign in: supabase.auth.signInWithPassword()
  - Sign up: supabase.auth.signUp() with email verification
  - Email redirect: window.location.origin/dashboard
  - Session persistence: TanStack Query persister

Missing:
  - Password reset flow (not visible in Auth.tsx)
  - OAuth buttons (Google, GitHub, etc.)
  - MFA/2FA
```
**🔴 FINDING:** OAuth callback function exists but no OAuth providers configured. Unused code or missing UI?

### Edge Functions (Deno Runtime)
```yaml
Total: 13 functions
Shared: _shared/ (email-templates.ts)

Functions:
  1. ai-chat                       - AI conversation handler
  2. capture-client-ip             - IP capture for audit logs
  3. oauth-callback                - OAuth provider callback
  4. retrieve-encryption-key       - Key retrieval (RLS-protected)
  5. send-sms                      - SMS sender (Twilio wrapper)
  6. social-post                   - Social media post handler
  7. store-encryption-key          - Key storage (RLS-protected)
  8. store-integration-credentials - Credential vault
  9. twilio-sms                    - Twilio SMS webhook (signature validated ✓)
  10. twilio-voice                 - Twilio Voice webhook
  11. unsubscribe                  - Unsubscribe handler
  12. vehicles-search              - Vehicle inventory search

Each function:
  - deno.json (runtime config)
  - import_map.json (deps)
  - index.ts (handler)
```

### Storage
- **Buckets:** (to be enumerated via Supabase dashboard or SQL query)
- **RLS:** (to be audited)

---

## 4. PWA (Progressive Web App)

### Manifest
```yaml
File: public/manifest.json
Name: AutoRepAi
Short Name: AutoRepAi
Description: "Advanced AI-powered dealership management platform"
Start URL: /
Display: standalone
Orientation: portrait-primary
Theme Color: #3b82f6
Background Color: #ffffff

Icons:
  - src: /logo.png
    sizes: 512x512
    type: image/png
    purpose: any maskable

Screenshots:
  - src: /placeholder.svg  # ⚠️ Placeholder image
    sizes: 540x720
    type: image/svg+xml
    form_factor: narrow

Categories: [business, productivity]
```
**🟡 FINDING:** Screenshot uses placeholder.svg. Real screenshots needed for app store submission.

### Service Worker
```yaml
File: public/sw.js
Type: (to be inspected - likely Workbox or custom)
Registration: (to be verified in main.tsx or index.html)

Expected Features:
  - Offline caching
  - Network-first/cache-first strategies
  - Background sync (optional)
  - Push notifications (optional)

Embed-Fix:
  - SW must NOT block framing (embed gate requirement)
  - Cache versioning to prevent stale assets
```

---

## 5. Mobile Apps (Capacitor 7.4.3)

### Platforms
```yaml
Android: 7.4.3 (@capacitor/android)
iOS: 7.4.3 (@capacitor/ios)
Core: 7.4.3 (@capacitor/core)

Config: capacitor.config.ts
Build Targets:
  - Android APK/AAB
  - iOS IPA (requires Apple Developer account)
```

### Native Features (Potential)
- Camera
- Geolocation
- Push notifications
- Filesystem
- Network status
- App updates

---

## 6. CI/CD Pipeline (GitHub Actions)

### Workflows
```yaml
1. ci.yml (Main Pipeline)
   Jobs:
     - lint-and-typecheck      ✅ Active
     - unit-tests              ⚠️ TODO (test:unit script missing)
     - accessibility-tests     ⚠️ TODO (test:a11y script missing)
     - e2e-tests               ⚠️ TODO (test:e2e script missing)
     - security-scan           ✅ Active (npm audit + scripts/security-check.sh)
     - build                   ✅ Active
     - lighthouse-mobile       ✅ ENFORCED GATE
     - wcag-accessibility      ✅ ENFORCED GATE
     - embed-gate              ✅ ENFORCED GATE
     - merge-gate              ✅ ENFORCED (blocks on any failure)

2. deno-guard.yml
   Purpose: (to be inspected)

3. header-sentinel.yml
   Purpose: (to be inspected - likely CSP/security header validation)
```

### Build Commands (CI)
```bash
npm ci                          # Install deps (lockfile-based)
npm run lint                    # ESLint
npx tsc --noEmit                # Type check
npm run build                   # Vite build
npm audit --production --audit-level=high  # Security scan
./scripts/security-check.sh     # Custom security checks
```

### Deployment (Inferred)
- **Platform:** Likely Vercel or Netlify (VERCEL_ENV referenced in vite.config.ts)
- **Preview Builds:** Enabled for Lovable.app preview domains
- **Production URL:** https://www.autorepai.ca (canonical)

---

## 7. Security Configuration

### CSP (Content Security Policy)
```yaml
Source: vite.config.ts (buildCSP function)

Directives:
  default-src: 'self'
  script-src: 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://va.vercel-scripts.com
  style-src: 'self' 'unsafe-inline'
  img-src: 'self' data: https:
  font-src: 'self' data:
  connect-src: 'self' https://niorocndzcflrwdrofsp.supabase.co wss://niorocndzcflrwdrofsp.supabase.co https://va.vercel-scripts.com
  frame-ancestors: 'self' https://www.autorepai.ca [+ Lovable domains in preview]
  object-src: 'none'
  base-uri: 'self'
  form-action: 'self'
```
**🟡 FINDING:** `unsafe-inline` and `unsafe-eval` weaken CSP. Consider nonce-based CSP.

### Security Headers
```yaml
X-Frame-Options: OMITTED (CSP frame-ancestors supersedes)
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Twilio Webhook Security
```yaml
Signature Validation: ✅ IMPLEMENTED
  - Function: twilio-sms/index.ts
  - Method: HMAC-SHA1 with TWILIO_AUTH_TOKEN
  - Header: X-Twilio-Signature
  - Validation: validateTwilioSignature()

Required Env Vars:
  - TWILIO_AUTH_TOKEN (secret)
  - X-Twilio-Signature (request header)

Failure Mode: 401 Unauthorized (correct)
```

### OAuth Token Encryption
```yaml
Encryption: AES-GCM
  - Function: oauth-callback/index.ts
  - Key Derivation: PBKDF2 (100,000 iterations, SHA-256)
  - Secret: ENCRYPTION_SECRET (env var)
  - IV: Random 12 bytes per token

⚠️ Weak Default:
  - Fallback: 'default-secret-change-in-production'
  - Status: MUST be changed in production
```
**🔴 FINDING:** OAuth encryption has weak default secret. Verify ENCRYPTION_SECRET is set in production.

---

## 8. Secrets & Environment Variables

### Client-Side (VITE_* prefix, exposed to browser)
```yaml
VITE_SUPABASE_PROJECT_ID: niorocndzcflrwdrofsp
VITE_SUPABASE_PUBLISHABLE_KEY: eyJh...HG4M (anon role, safe)
VITE_SUPABASE_URL: https://niorocndzcflrwdrofsp.supabase.co
```

### Server-Side (Edge Functions, NOT exposed)
```yaml
Known Secrets (from code inspection):
  - TWILIO_AUTH_TOKEN         # Twilio API auth
  - TWILIO_ACCOUNT_SID        # (inferred)
  - TWILIO_PHONE_NUMBER       # (inferred)
  - ENCRYPTION_SECRET         # OAuth token encryption
  - SUPABASE_SERVICE_ROLE_KEY # (inferred for admin operations)
  - LHCI_GITHUB_APP_TOKEN     # Lighthouse CI (GitHub Actions)

To Audit:
  - Verify all secrets are set in production
  - Check Supabase Edge Function env vars (via dashboard)
  - Ensure no secrets in git history
```

### CI Secrets (GitHub Actions)
```yaml
Active:
  - LHCI_GITHUB_APP_TOKEN

Potential:
  - SUPABASE_SERVICE_ROLE_KEY (for migrations/tests)
  - NPM_TOKEN (for private packages, if any)
```

---

## 9. Dependency Audit Surface

### Critical Dependencies (Security-Sensitive)
```yaml
Authentication:
  - @supabase/supabase-js: 2.58.0

Encryption/Crypto:
  - (Node crypto via Deno std)

Input Validation:
  - zod: 3.25.76

PDF Generation:
  - jspdf: 3.0.3

HTTP Client:
  - (fetch API, Supabase client)

Testing:
  - @playwright/test: 1.55.1
  - vitest: 3.2.4
```

### Audit Commands
```bash
npm audit --production --audit-level=high   # Production deps only
npm audit --audit-level=moderate            # All deps
npm audit fix                               # Auto-fix (review first!)
```

---

## 10. Deployment URLs & Environments

### Production
```yaml
Canonical URL: https://www.autorepai.ca
  - DNS: (verify A/CNAME records)
  - SSL: (verify certificate validity)
  - CDN: (check if Vercel/Netlify CDN is active)
```

### Preview/Staging
```yaml
Lovable Preview Domains:
  - *.lovable.app
  - *.lovable.dev
  - *.lovableproject.com

Environment Variables:
  - VERCEL_ENV=preview (triggers frame-ancestors allowlist)
  - PREVIEW_ANCESTORS (space-separated additional domains)
```

### Local Development
```yaml
Dev Server: http://localhost:8080 (Vite)
  - Hot Module Replacement: ✅
  - Security Headers: ✅ (via vite.config.ts)
  - HTTPS: ❌ (optional, not configured)
```

---

## 11. RLS (Row-Level Security) Audit Surface

### Tables to Audit (from migrations, inferred)
```
Likely Tables:
  - profiles             # User profiles
  - dealerships          # Dealership accounts
  - vehicles             # Vehicle inventory
  - conversations        # AI chat history
  - messages             # SMS/chat messages
  - integrations         # OAuth/API credentials
  - encryption_keys      # Encrypted keys
  - appointments         # (inferred)
  - customers            # (inferred)

Audit Checklist:
  □ RLS enabled on all tables?
  □ Policies cover SELECT, INSERT, UPDATE, DELETE?
  □ Policies use auth.uid() correctly?
  □ Policies tested for unauthorized access?
  □ Service role bypass documented (for admin functions)?
```

### Edge Functions RLS Check
```yaml
Functions with RLS calls:
  - retrieve-encryption-key   # Should enforce auth.uid() match
  - store-encryption-key      # Should enforce auth.uid() match
  - store-integration-credentials  # Should enforce auth.uid() match

Test Plan:
  1. Call function without auth header → 401
  2. Call function with valid auth → 200 (own data only)
  3. Call function with valid auth → 403 (other user's data)
```

---

## 12. Missing/TODO Items (From Code Inspection)

### Package.json Scripts
```yaml
Missing:
  - test:unit    # Vitest unit tests
  - test:a11y    # Axe-core accessibility tests
  - test:e2e     # Playwright E2E tests (inferred from CI)
  - test         # Unified test runner

Should Add:
  - test:coverage  # Generate coverage report
  - test:watch     # Watch mode for unit tests
  - typecheck      # Alias for tsc --noEmit
```

### Documentation Gaps
```yaml
Missing Docs:
  - API documentation (Edge Functions)
  - RLS policy documentation
  - OAuth provider setup guide
  - Deployment runbook
  - Incident response playbook
  - Database schema diagram
  - Environment variable reference
```

### Security Gaps (To Investigate)
```yaml
To Audit:
  - Rate limiting on Edge Functions (5xx if missing)
  - Input validation on all Edge Function params
  - SQL injection (via Supabase client should be safe, but verify raw queries)
  - XSS vectors (React escapes by default, but check dangerouslySetInnerHTML)
  - CSRF (Supabase tokens are bearer tokens, check for SameSite cookies)
  - Secrets in git history (git log --all --full-history --source --grep='password\|secret\|key')
```

---

## 13. Next Steps

1. ✅ RepoCensus.md created
2. → Diagnose GitHub connection (`docs/Audit/GitHubConnection.md`)
3. → Run static checks (type/lint/build/audit) and capture output
4. → Run dynamic checks (PWA validation, E2E smoke test)
5. → Create `docs/Audit/Findings.md` with all issues + severity
6. → Create `docs/Audit/FixPlan.md` with P0/P1/P2 priorities

---

**Census Complete.** Repository structure and environment fully documented.
