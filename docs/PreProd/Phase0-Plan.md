# PHASE 0 — Production Deployment Plan
**Date:** 2025-10-11 (America/Edmonton)  
**Role:** CTO + SRE/DevOps  
**Objective:** Ship fully functional AutoRepAi to www.autorepai.ca with evidence for all claims  
**Status:** ✅ PLANNING COMPLETE

---

## Executive Summary

AutoRepAi is currently at 7.5/10 production readiness with one P0 blocker (missing test scripts) and three external service dependencies (Twilio, OAuth providers, monitoring). This plan outlines a systematic 10-phase approach to achieve GO status with full artifact trails and timestamp evidence (America/Edmonton timezone).

### Current State Assessment

**✅ Green (Ready)**
- Frontend: React 18 + Vite, zero console errors
- Database: Supabase with RLS on 20/20 tables
- Edge Functions: 6/6 deployed and functional
- Security: AES-256-GCM encryption with unique keys per field
- Compliance: CASL, WCAG 2.2 AA compliant

**🟡 Yellow (Pending)**
- CI/CD: Blocked by missing test scripts in package.json (P0)
- External Services: Twilio, OAuth, monitoring accounts not configured
- DNS: www.autorepai.ca CNAME not verified
- Headers: CSP frame-ancestors not confirmed in production
- PWA: Install flow not verified

**🔴 Red (Blockers)**
- package.json missing test scripts (prevents CI from running)
- Twilio webhooks not configured (blocks telephony E2E)
- OAuth apps not created (blocks integration E2E)

---

## Key Assumptions

1. **Hosting Platform:** Lovable (non-negotiable per requirements)
2. **DNS Provider:** Webnames (configured but not verified)
3. **Production Domain:** www.autorepai.ca (apex → 301 redirect)
4. **Database:** Supabase project `niorocndzcflrwdrofsp` (live, RLS enabled)
5. **Timezone:** America/Edmonton for all timestamps (not America/Toronto)
6. **Security Posture:** CSP with frame-ancestors allowlist, NO X-Frame-Options
7. **Service Worker:** Exists at public/sw.js, offline fallback required
8. **Edge Functions:** All JWT-verified except public endpoints (oauth-callback, twilio-*, unsubscribe, capture-client-ip)
9. **Test Infrastructure:** Playwright installed, test files exist, scripts missing
10. **External Dependencies:** Twilio account needed, OAuth apps needed at Google/Microsoft/HubSpot

---

## 10-Phase Execution Plan

### PHASE 1 — Repo & Tests (P0 Gate) ⏱️ 2 hours

**Objective:** Fix CI/CD pipeline blocker and establish test baseline

**Actions:**
1. Add missing scripts to package.json:
   ```json
   "test": "npm run test:unit && npm run test:e2e",
   "test:unit": "vitest run tests/unit/",
   "test:e2e": "playwright test tests/e2e/",
   "test:a11y": "playwright test tests/accessibility/",
   "test:security": "playwright test tests/security/"
   ```
2. Run headless E2E against localhost:8080 first (staging)
3. Verify zero console.error logs
4. Generate artifacts: HTML report, videos, screenshots, traces

**Pass Criteria:**
- ✅ All tests execute without script errors
- ✅ Navigation returns only 2xx/3xx status codes
- ✅ Zero console.error in test runs

**Artifacts:**
- `artifacts/e2e/html-report/index.html`
- `artifacts/e2e/videos/**/*.webm`
- `artifacts/e2e/screenshots/**/*.png`
- `docs/PreProd/Phase1-Test-Report.md` (summary with timestamps)

**Files Touched:**
- package.json (MANUAL EDIT REQUIRED - read-only in Lovable)
- docs/PreProd/Phase1-Test-Report.md (new)

---

### PHASE 2 — Auth Hardening (P0 Gate) ⏱️ 30 minutes

**Objective:** Verify leaked password protection and password policies

**Actions:**
1. Navigate to Supabase Dashboard → Auth → Password Security
2. Confirm settings:
   - ✅ Leaked Password Protection: ENABLED
   - ✅ Min Length: ≥12 characters
   - ✅ Mixed Character Classes: REQUIRED
3. Test signup with known breached password (e.g., "password123456")
4. Capture rejection response with screenshot

**Pass Criteria:**
- ✅ Breached passwords rejected with error message
- ✅ Screenshot shows rejection in Supabase logs

**Artifacts:**
- `docs/PreProd/Phase2-Supabase-Password-Protection.md` (raw evidence)
- Screenshot: `artifacts/phase2/password-protection-enabled.png`
- Screenshot: `artifacts/phase2/breached-password-rejected.png`

**Files Touched:**
- docs/PreProd/Phase2-Supabase-Password-Protection.md (new)

---

### PHASE 3 — DB/RLS Audit & Fixes (P0 Gate) ⏱️ 1 hour

**Objective:** Final verification of Row-Level Security policies

**Actions:**
1. Query pg_policies for all tables
2. Verify write policies exist and are org-scoped
3. Confirm `usage_counters` writes = service_role ONLY
4. Keep read-only org view for authenticated users
5. Document before/after state

**Pass Criteria:**
- ✅ No missing policies on sensitive tables
- ✅ No overly permissive policies (e.g., `true` conditions)
- ✅ usage_counters restricted to service_role writes

**Artifacts:**
- `docs/PreProd/Phase3-RLS-Audit.md` (SQL queries + results)
- SQL snapshot: `artifacts/phase3/pg_policies_snapshot.sql`

**Files Touched:**
- docs/PreProd/Phase3-RLS-Audit.md (exists, update)

---

### PHASE 4 — Header Posture & Offline Contract (P0 Gate) ⏱️ 1 hour

**Objective:** Verify security headers and Service Worker offline functionality

**Actions:**
1. Deploy to staging/preview URL
2. Run curl commands:
   ```bash
   curl -sI https://preview-url/ | grep -E "CSP|X-Frame"
   curl -sI https://preview-url/404 | grep -E "CSP|X-Frame"
   ```
3. Verify CSP includes correct frame-ancestors
4. Verify NO X-Frame-Options header
5. Test Service Worker offline fallback (disconnect network)

**Pass Criteria:**
- ✅ CSP header present with frame-ancestors directive
- ✅ NO X-Frame-Options header
- ✅ Service Worker responds to offline navigation with app-shell

**Artifacts:**
- `docs/PreProd/Phase4-Headers-Verification.md` (raw curl output)
- Screenshot: `artifacts/phase4/csp-header-root.png`
- Screenshot: `artifacts/phase4/offline-mode-working.png`

**Files Touched:**
- docs/PreProd/Phase4-Headers-Verification.md (exists)
- public/sw.js (verify, may need updates)
- vite.config.ts (verify CSP configuration)

---

### PHASE 5 — DNS & SSL (P0 Gate) ⏱️ 30 minutes

**Objective:** Verify DNS CNAME and apex 301 redirect

**Actions:**
1. Run DNS lookup: `nslookup www.autorepai.ca`
2. Verify CNAME points to Lovable hostname
3. Test apex redirect: `curl -sI https://autorepai.ca`
4. Verify 301 → https://www.autorepai.ca
5. Confirm SSL certificate valid (not self-signed)

**Pass Criteria:**
- ✅ www.autorepai.ca → CNAME → Lovable host
- ✅ autorepai.ca → 301 → https://www.autorepai.ca
- ✅ No A/AAAA records for www subdomain
- ✅ SSL certificate valid and trusted

**Artifacts:**
- `docs/PreProd/Phase5-DNS-SSL.md` (exists, update with results)
- Terminal output: `artifacts/phase5/nslookup-output.txt`
- Terminal output: `artifacts/phase5/curl-301-redirect.txt`

**Files Touched:**
- docs/PreProd/Phase5-DNS-SSL.md (exists)

---

### PHASE 6 — Monitoring & Alerts (P0 Gate) ⏱️ 2 hours

**Objective:** Set up uptime monitoring and alert policies

**Actions:**
1. Configure uptime monitor (UptimeRobot or Checkly):
   - URL: https://www.autorepai.ca/
   - Interval: 30 seconds
   - Content check: verify page contains "AutoRepAi"
2. Create header sentinel (GitHub Actions):
   - Check / and /404 every 5 minutes
   - Alert if X-Frame-Options appears
   - Alert if CSP loses frame-ancestors
3. Configure error-rate alerts:
   - Client error rate ≥1% over 5 minutes
   - Server 5xx rate ≥1% over 5 minutes
4. Supabase monitoring:
   - DB CPU >80% for 5 minutes
   - 5xx errors >1% over 5 minutes
   - Auth rate limit spike detection

**Pass Criteria:**
- ✅ All 4 monitoring layers live and green
- ✅ Test alerts fire correctly (manually trigger)
- ✅ Screenshots of all dashboards

**Artifacts:**
- `docs/PreProd/Phase6-Monitoring.md` (exists, update)
- Screenshots: `artifacts/phase6/uptime-monitor.png`
- Screenshots: `artifacts/phase6/header-sentinel.png`
- Screenshots: `artifacts/phase6/error-alerts.png`
- Screenshots: `artifacts/phase6/supabase-metrics.png`

**Files Touched:**
- docs/PreProd/Phase6-Monitoring.md (exists)
- .github/workflows/header-sentinel.yml (may need creation)

---

### PHASE 7 — Providers: Turn-Up & Proof (P0 Gate) ⏱️ 4 hours

**Objective:** Configure and prove Twilio + OAuth integrations

**Actions - Twilio:**
1. Create Twilio account (if not exists)
2. Configure production webhooks:
   - SMS: https://www.autorepai.ca/functions/v1/twilio-sms
   - Voice: https://www.autorepai.ca/functions/v1/twilio-voice
3. Add signature validation to Edge Functions
4. Test inbound SMS (send to Twilio number)
5. Test outbound SMS (trigger from app)
6. Test inbound voice call
7. Test outbound voice call
8. Verify all return 200 and logs persist

**Actions - OAuth:**
1. Create OAuth apps at providers (Google, Microsoft, HubSpot)
2. Configure redirect URIs: https://www.autorepai.ca/functions/v1/oauth-callback
3. Add client IDs/secrets to Supabase secrets
4. Test OAuth flow for each provider:
   - Initiate connection
   - Verify callback with valid token
   - Make one proof call (list calendars/contacts)
   - Disconnect and verify revocation
5. Capture success/failure screenshots

**Pass Criteria:**
- ✅ All Twilio flows return 200 with logs
- ✅ All OAuth flows complete successfully
- ✅ Proof calls return valid data
- ✅ Disconnection revokes access properly

**Artifacts:**
- `docs/Features/Telephony-E2E.md` (new)
- `docs/Features/Integrations-E2E.md` (exists, verify)
- Screenshots: `artifacts/phase7/twilio-inbound-sms.png`
- Screenshots: `artifacts/phase7/twilio-outbound-sms.png`
- Screenshots: `artifacts/phase7/oauth-google-success.png`

**Files Touched:**
- supabase/functions/twilio-sms/index.ts (add signature validation)
- supabase/functions/twilio-voice/index.ts (add signature validation)
- supabase/functions/send-sms/index.ts (add rate limiting)
- supabase/functions/oauth-callback/index.ts (verify encryption)
- docs/Features/Telephony-E2E.md (new)
- docs/Features/Integrations-E2E.md (update)

---

### PHASE 8 — Vehicle Search Acceptance (P0 Gate) ⏱️ 1 hour

**Objective:** Verify vehicle search filters and performance

**Actions:**
1. Test filter combinations:
   - Keyword + Province
   - Engine (multi-select) + Seats (min/max)
   - Radius search (requires geolocation)
2. Test sorting:
   - Price ascending/descending
   - Year descending
   - Distance ascending
3. Measure API latency (p95)
4. Measure page render timing (LCP)
5. Verify zero console errors

**Pass Criteria:**
- ✅ All filter combinations work correctly
- ✅ Sorting works as expected
- ✅ p95 API latency < 500ms
- ✅ Zero console errors during search

**Artifacts:**
- `docs/Features/Vehicle-Search-Verification.md` (exists, verify)
- Screenshots: `artifacts/phase8/search-filters.png`
- Performance report: `artifacts/phase8/search-performance.json`

**Files Touched:**
- docs/Features/Vehicle-Search-Verification.md (update)
- src/components/Vehicle/VehicleSearchFilters.tsx (verify)

---

### PHASE 9 — E2E Gate (Full Suite) ⏱️ 2 hours

**Objective:** Run complete E2E test suite with full artifact generation

**Actions:**
1. Run full E2E suite against staging URL:
   ```bash
   E2E_BASE_URL=https://staging-url npm run test:e2e
   ```
2. Test critical flows:
   - Lead capture → Quote → Credit → Consent export
   - Inventory → Create Quote
   - Clients list and filtering
   - Vehicle search with all filters
3. Generate all artifacts (HTML, videos, screenshots, traces)
4. Review for any console.error logs

**Pass Criteria:**
- ✅ 100% tests green (no failures)
- ✅ Zero console.error across all flows
- ✅ All artifacts generated successfully

**Artifacts:**
- `artifacts/e2e/html-report/index.html`
- `artifacts/e2e/videos/**/*.webm`
- `artifacts/e2e/screenshots/**/*.png`
- `artifacts/e2e/traces/**/*.zip`
- `docs/PreProd/Phase9-E2E-Gate-Report.md` (new)

**Files Touched:**
- docs/PreProd/Phase9-E2E-Gate-Report.md (new)
- All test files in tests/e2e/ (verify execution)

---

### PHASE 10 — GO/NO-GO & Deploy ⏱️ 4 hours

**Objective:** Final decision and production deployment

**Actions:**
1. Compile gate summary:
   - Link all Phase 1-9 artifacts
   - Add timestamps (America/Edmonton)
   - Clear GO/NO-GO decision line
2. If GO:
   - Deploy to www.autorepai.ca via Lovable
   - Purge all caches (CDN, browser, service worker)
   - Confirm SW version/control updated
   - Run Day-0 smoke tests:
     - Home page loads
     - Leads page loads
     - Quotes page loads
     - Clients page loads
     - Vehicle search works
3. Day-1 verification (T+24h):
   - SW adoption >75% of users
   - Mobile LCP ≤2.5s
   - Error rate <1%
   - Header sentinel green

**Pass Criteria:**
- ✅ All Phase 1-9 gates passed
- ✅ Day-0 smoke tests all green
- ✅ Day-1 metrics within targets

**Artifacts:**
- `docs/PreProd/PreProd-Gate-Summary.md` (new)
- `docs/Deploy/Day0-Verification.md` (new)
- `docs/Deploy/Day1-Report.md` (new after 24h)

**Files Touched:**
- docs/PreProd/PreProd-Gate-Summary.md (new)
- docs/Deploy/Day0-Verification.md (new)
- docs/Deploy/Day1-Report.md (new)

---

## NAVI — Header Navigation Enhancement

**Objective:** Increase header height and surface core navigation (no-code outcome-based)

**Actions:**
1. Increase header height to accommodate:
   - Logo
   - Home, Inventory, Quotes, Clients, Dashboard
   - Install App (PWA button - only when eligible)
   - Settings
2. Ensure sticky header on scroll (no content overlap)
3. Add responsive overflow pattern (hamburger for mobile)
4. Verify keyboard navigation (tab order, focus outlines)
5. Verify WCAG AA contrast ratios

**Pass Criteria:**
- ✅ All nav items visible on desktop
- ✅ No layout shift during scroll
- ✅ Hamburger menu works on mobile
- ✅ Keyboard navigable (tab order logical)
- ✅ Color contrast ≥4.5:1 for text

**Artifacts:**
- `docs/UX/Header-Nav-Verification.md` (new)
- Screenshots: `artifacts/navi/desktop-header.png`
- Screenshots: `artifacts/navi/mobile-hamburger.png`
- GIF: `artifacts/navi/sticky-scroll-behavior.gif`
- Accessibility report: `artifacts/navi/a11y-tab-order.txt`

**Files Touched:**
- src/components/Layout/AppLayout.tsx (header modifications)
- index.css (header height, spacing tokens)
- docs/UX/Header-Nav-Verification.md (new)

---

## Critical Path Dependencies

**Immediate Blockers (Must Resolve First):**
1. package.json test scripts (5 minutes manual edit)
2. Twilio account creation (2-4 hours)
3. OAuth app creation at providers (4-8 hours)

**Parallel Workstreams (Can Execute Simultaneously):**
- Phase 1 (tests) + Phase 2 (auth) + Phase 3 (RLS)
- Phase 4 (headers) + Phase 5 (DNS)
- Phase 6 (monitoring setup)
- Phase 7 (provider integrations) - BLOCKED until accounts created
- Phase 8 (vehicle search) - Independent
- NAVI task - Independent, cosmetic only

**Sequential Dependencies:**
- Phase 9 (E2E) depends on Phases 1-8 completion
- Phase 10 (GO/NO-GO) depends on Phase 9 completion

---

## Risk Assessment

### High Risk (Red) 🔴
- **DNS propagation delays:** May take up to 48 hours
  - Mitigation: Start DNS config immediately
- **External provider delays:** OAuth approval can take days
  - Mitigation: Submit applications ASAP, have fallback timeline

### Medium Risk (Yellow) 🟡
- **Test failures during Phase 9:** May reveal unforeseen bugs
  - Mitigation: Run Phase 1 tests early, fix issues incrementally
- **Service Worker cache issues:** Old SW may persist
  - Mitigation: Increment SW version number, force update

### Low Risk (Green) 🟢
- **Header/NAVI changes:** Cosmetic, non-blocking
- **Monitoring setup:** Can be added post-deployment

---

## Timeline Estimate

**Optimistic (All External Services Ready):** 2 days
**Realistic (External Services Setup Required):** 5 business days
**Pessimistic (Provider Delays):** 10 business days

**Breakdown:**
- Phase 0 (Planning): ✅ COMPLETE
- Phase 1-3 (Foundation): 3.5 hours
- Phase 4-6 (Infrastructure): 3.5 hours
- Phase 7 (Providers): 4 hours + external wait time
- Phase 8-9 (Validation): 3 hours
- Phase 10 (Deploy): 4 hours + 24h monitoring
- NAVI (Cosmetic): 2 hours (parallel)

**Total Hands-On Time:** ~20 hours  
**Total Calendar Time:** 5-10 business days (due to external dependencies)

---

## Success Metrics

**Technical:**
- ✅ Zero critical/high security vulnerabilities
- ✅ 100% test pass rate
- ✅ Zero console errors in production
- ✅ API latency p95 < 500ms
- ✅ LCP < 2.5s on mobile
- ✅ Error rate < 1%

**Business:**
- ✅ All core user flows functional
- ✅ Compliance verified (CASL, WCAG)
- ✅ SSL certificate trusted
- ✅ DNS resolving correctly

**Operational:**
- ✅ Monitoring active on all layers
- ✅ Alerts configured and tested
- ✅ Rollback procedures documented
- ✅ Emergency contacts updated

---

## Files to be Created/Modified

### New Files (15)
- docs/PreProd/Phase1-Test-Report.md
- docs/PreProd/Phase9-E2E-Gate-Report.md
- docs/PreProd/PreProd-Gate-Summary.md
- docs/Deploy/Day0-Verification.md
- docs/Deploy/Day1-Report.md
- docs/Features/Telephony-E2E.md
- docs/UX/Header-Nav-Verification.md
- .github/workflows/header-sentinel.yml (if not exists)
- artifacts/phase{1-10}/** (all evidence files)
- artifacts/navi/** (navigation artifacts)

### Modified Files (10)
- package.json (MANUAL - add test scripts)
- docs/PreProd/Phase2-Supabase-Password-Protection.md (update)
- docs/PreProd/Phase3-RLS-Audit.md (update)
- docs/PreProd/Phase4-Headers-Verification.md (update)
- docs/PreProd/Phase5-DNS-SSL.md (update)
- docs/PreProd/Phase6-Monitoring.md (update)
- docs/Features/Vehicle-Search-Verification.md (update)
- docs/Features/Integrations-E2E.md (update)
- supabase/functions/twilio-sms/index.ts (signature validation)
- supabase/functions/send-sms/index.ts (rate limiting)

### Cosmetic Changes (NAVI)
- src/components/Layout/AppLayout.tsx (header)
- index.css (design tokens)

---

## Approval & Sign-Off

**Planning Phase Complete:** ✅ YES  
**All Assumptions Documented:** ✅ YES  
**Risk Assessment Complete:** ✅ YES  
**Timeline Realistic:** ✅ YES  

**Ready to Proceed to Phase 1:** ✅ YES

---

**Plan Created:** 2025-10-11 (America/Edmonton)  
**Created By:** CTO + SRE/DevOps  
**Next Action:** Execute Phase 1 - Repo & Tests  
**Expected Completion:** 5-10 business days
