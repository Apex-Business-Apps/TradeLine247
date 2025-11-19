## Issue Register -> errors22

### Issue #1: Missing H1 hierarchy
- Category: Accessibility/WCAG
- Severity: P0
- Status: OPEN
- Trigger: `tests/accessibility/complete-wcag.spec.ts` -> Complete WCAG 2.2 AA Compliance -> should have proper heading hierarchy
- Description: Dashboard/leads views expose zero <h1> elements and skip heading levels so axe cannot find a proper outline.
- Suspected root cause: Layouts rely on div/typography components rather than semantic headings inside <main>.
- Impact: Screen reader users cannot understand the document structure; WCAG gate remains blocked.
- Fix Plan: Add a single visible <h1> per page, demote other sections to <h2>/<h3>, wrap content in <main>, and update tests to point at the new structure.

### Issue #2: Keyboard trap on dashboard forms
- Category: Accessibility/WCAG
- Severity: P0
- Status: OPEN
- Trigger: `tests/accessibility/complete-wcag.spec.ts` -> Complete WCAG 2.2 AA Compliance -> should support keyboard navigation
- Description: The complete WCAG keyboard test never finds the submit button because the last focusable control is missing or not tabbable.
- Suspected root cause: Submit CTA is likely rendered as a div or type="button" outside the form and lacks tabindex.
- Impact: Keyboard-only users cannot finish the workflow and tests time out.
- Fix Plan: Convert CTAs to semantic buttons within the tab order, ensure aria-labels exist, and update Playwright locators to use getByRole.

### Issue #3: Focus outline suppressed
- Category: Accessibility/WCAG
- Severity: P0
- Status: OPEN
- Trigger: `tests/accessibility/complete-wcag.spec.ts` -> Complete WCAG 2.2 AA Compliance -> should have visible focus indicators
- Description: Playwright cannot detect an outline because global styles remove :focus cues for buttons.
- Suspected root cause: Tailwind reset/theme overrides probably set outline:none without :focus-visible replacements.
- Impact: Users navigating via keyboard have no idea where focus is; WCAG 2.4.7 violation blocks release.
- Fix Plan: Introduce consistent :focus-visible tokens (border/box-shadow) for buttons/links/inputs and assert via tests.

### Issue #4: Landmarks missing for screen readers
- Category: Accessibility/WCAG
- Severity: P0
- Status: OPEN
- Trigger: `tests/accessibility/complete-wcag.spec.ts` -> Complete WCAG 2.2 AA Compliance -> should support screen readers
- Description: aria landmark query returned zero nodes, meaning the dashboard lacks <main>/<nav>/<header> roles.
- Suspected root cause: Layout wrappers use generic divs without role attributes.
- Impact: Screen readers cannot jump between regions leading to WCAG failure P0.
- Fix Plan: Wrap core content in <main>, ensure header/nav/footer use semantic tags, and keep interactive controls labeled.

### Issue #5: Dashboard auth form inaccessible
- Category: Accessibility/WCAG
- Severity: P0
- Status: OPEN
- Trigger: `tests/accessibility/wcag-audit.spec.ts` -> WCAG 2.2 AA Compliance -> dashboard should have no accessibility violations
- Description: The audit test timed out waiting for email/password inputs, implying labels or selectors are missing.
- Suspected root cause: Auth screen likely renders custom input components without matching label/for attributes or role hooks.
- Impact: Without labeled inputs, both axes and login automation fail, blocking dashboards and gating CI.
- Fix Plan: Add explicit <label> elements tied via id/for, ensure inputs use type="email"/"password", and expose stable test ids.

### Issue #6: Global focus style missing (wcag audit)
- Category: Accessibility/WCAG
- Severity: P0
- Status: OPEN
- Trigger: `tests/accessibility/wcag-audit.spec.ts` -> WCAG 2.2 AA Compliance -> focus indicators should be visible
- Description: The audit flow never finds :focus outline on interactive controls on marketing pages.
- Suspected root cause: CSS reset removes outline without replacement on root theme.
- Impact: Violates WCAG 2.4.7 across site, preventing a11y certification.
- Fix Plan: Add theme-level :focus-visible tokens and confirm via axe + Playwright.

### Issue #7: Form not fully keyboard navigable
- Category: Accessibility/WCAG
- Severity: P0
- Status: OPEN
- Trigger: `tests/accessibility/wcag-audit.spec.ts` -> Keyboard Navigation -> should navigate entire form with keyboard
- Description: While tabbing through the settings form, Playwright stops on non-interactive nodes.
- Suspected root cause: Some controls are rendered as spans/divs with click handlers or improper tabindex order.
- Impact: Keyboard-only admins cannot finish the form which is a WCAG P0 regression.
- Fix Plan: Refactor interactive widgets to native elements (button/input/select) or add proper role/tabindex/aria, then update tab order tests.

### Issue #8: Chat widget fails to mount
- Category: E2E/AI Assistant
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/ai-assistant.spec.ts` -> AI Assistant - AutoRepAi -> should load chat widget on homepage
- Description: Homepage never renders the AI assistant iframe/container, so the test cannot find it.
- Suspected root cause: Boot script likely guarded behind feature flag or crashes on init when Supabase/env vars missing.
- Impact: Customers cannot open the assistant which is a contractual requirement.
- Fix Plan: Ensure widget component mounts unconditionally in permitted environments, surface loading states, and wait for ready event in tests.

### Issue #9: Assistant greeting not localized
- Category: E2E/AI Assistant
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/ai-assistant.spec.ts` -> AI Assistant - AutoRepAi -> should display bilingual greeting (EN/FR)
- Description: The widget never emits the bilingual welcome copy, so expectation fails.
- Suspected root cause: Localized strings or language detection is not run until after first user input.
- Impact: Regulatory requirement for EN/FR greeting is unmet.
- Fix Plan: Load translations before hydration, default to bilingual message, and expose deterministic text for tests.

### Issue #10: Assistant conversation flow broken
- Category: E2E/AI Assistant
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/ai-assistant.spec.ts` -> AI Assistant - AutoRepAi -> should handle basic conversation flow
- Description: The scripted conversation hang never receives bot response/resolution.
- Suspected root cause: Websocket/edge call either rejects or the reducer never appends assistant messages.
- Impact: AI workflow blockers prevent dealers from using automation.
- Fix Plan: Stabilize backend call (mock during tests), guard streaming errors, and assert transcript updates statefully.

### Issue #11: Assistant telemetry missing
- Category: E2E/AI Assistant
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/ai-assistant.spec.ts` -> AI Assistant - AutoRepAi -> should log interactions to lead timeline
- Description: Lead timeline never receives assistant events during runs.
- Suspected root cause: Webhook/log insert likely disabled in local mode or fails schema validation.
- Impact: Compliance logging gap violates audit requirements.
- Fix Plan: Ensure assistant events call the logging RPC with deterministic payloads; seed fixtures so tests can assert timeline rows.

### Issue #12: Assistant rate limiting absent
- Category: E2E/AI Assistant
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/ai-assistant.spec.ts` -> AI Assistant - AutoRepAi -> should respect rate limiting
- Description: Test fires multiple messages and expects a limit message but none arrives.
- Suspected root cause: Serverless function probably returns 200 even when threshold exceeded.
- Impact: Without rate limiting, abuse can spike costs and fail compliance tests.
- Fix Plan: Implement per-user/per-IP throttling in ai-chat edge function and bubble friendly errors to UI/tests.

### Issue #13: Assistant compliance copy missing
- Category: E2E/AI Assistant
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/ai-assistant.spec.ts` -> AI Assistant - AutoRepAi -> should include compliance disclaimers
- Description: Expected CASL/FCRA disclaimer never renders in the chat footer.
- Suspected root cause: Widget likely hides disclaimer behind prop or translation key is blank.
- Impact: Legal reviewers block release without disclaimers.
- Fix Plan: Always render bilingual disclaimer text and expose aria-live region so tests can read it.

### Issue #14: English PDF generation failing
- Category: E2E/Quote & Vehicles
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/bilingual-pdf.spec.ts` -> Bilingual PDF Quote Generation -> should generate English PDF quote
- Description: PDF export does not resolve or returns empty buffer.
- Suspected root cause: Quote builder probably missing font assets or server call blocked when env vars absent.
- Impact: Dealers cannot send English quotes, stalling sales.
- Fix Plan: Stub Supabase storage in tests and ensure PDF pipeline can run in headless mode with deterministic data.

### Issue #15: French PDF generation failing
- Category: E2E/Quote & Vehicles
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/bilingual-pdf.spec.ts` -> Bilingual PDF Quote Generation -> should generate French PDF quote
- Description: French locale PDF render never completes; template may lack translations.
- Suspected root cause: Localized copy or font fallback missing for FR.
- Impact: Cannot deliver bilingual quotes which is regulatory requirement.
- Fix Plan: Add FR translations to template, preload fonts, and update tests with localized expectations.

### Issue #16: Province list incomplete in PDF
- Category: E2E/Quote & Vehicles
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/bilingual-pdf.spec.ts` -> Bilingual PDF Quote Generation -> should include all Canadian provinces in quote
- Description: Exported PDF omits provinces beyond the test case.
- Suspected root cause: Data mapper likely filters only selected region.
- Impact: Quotes risk non-compliance because taxes for some provinces missing.
- Fix Plan: Ensure generator iterates entire provinces dataset and assert via unit tests.

### Issue #17: PDF tax math wrong
- Category: E2E/Quote & Vehicles
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/bilingual-pdf.spec.ts` -> Bilingual PDF Quote Generation -> should calculate correct taxes for each province
- Description: Tax calculation per province deviates from expected values.
- Suspected root cause: Rates may be hardcoded or rounding incorrectly.
- Impact: Dealers could send incorrect totals, exposing liability.
- Fix Plan: Centralize HST/GST/PST tables and add precision helpers aligned with tests.

### Issue #18: Share link missing security controls
- Category: E2E/Quote & Vehicles
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/bilingual-pdf.spec.ts` -> Bilingual PDF Quote Generation -> should create secure share link for quote
- Description: PDF share endpoint fails to create signed URL in tests.
- Suspected root cause: Likely requires env vars or returns 500 when running locally.
- Impact: Cannot share quotes externally; gating criteria fails.
- Fix Plan: Mock Supabase storage and ensure signed URLs are generated with deterministic payloads for tests.

### Issue #19: Solo credit application flow broken
- Category: E2E/Auth+Dashboard
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/credit-application.spec.ts` -> Credit Application Flow -> should complete solo credit application with FCRA consent
- Description: End-to-end scenario cannot submit because consent checkbox/form state never validates.
- Suspected root cause: Form wizard may rely on server state that is not stubbed.
- Impact: Credit desks cannot process single applicants and tests stay red.
- Fix Plan: Seed demo applicant data, ensure submit button enabled once required fields filled, and simulate Supabase responses.

### Issue #20: Co-applicant add fails
- Category: E2E/Auth+Dashboard
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/credit-application.spec.ts` -> Credit Application Flow -> should allow co-applicant addition
- Description: Test cannot add a second applicant row.
- Suspected root cause: UI probably hides dynamic form or backend rejects payload.
- Impact: Multi-buyer deals blocked.
- Fix Plan: Fix dynamic form toggles, ensure arrays sync with Supabase, and expose deterministic selectors for tests.

### Issue #21: Required field validation missing
- Category: E2E/Auth+Dashboard
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/credit-application.spec.ts` -> Credit Application Flow -> should validate required fields before submission
- Description: Scenario expects inline errors but form accepts blanks or never shows messages.
- Suspected root cause: Validation rules might only run server-side.
- Impact: Risk of submitting incomplete credit files and fails compliance gate.
- Fix Plan: Add client-side schema validation and deterministic error components for tests to read.

### Issue #22: FCRA consent enforcement absent
- Category: E2E/Auth+Dashboard
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/credit-application.spec.ts` -> Credit Application Flow -> should enforce FCRA consent requirement
- Description: Test toggles consent off yet submission still proceeds.
- Suspected root cause: Checkbox not wired into submission guard.
- Impact: Violates legal obligations; CI rightfully blocks.
- Fix Plan: Ensure consent must be true before enabling submit and surface inline messaging for tests.

### Issue #23: CASL consent not recorded
- Category: E2E/Auth+Dashboard
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/lead-capture.spec.ts` -> Lead Capture Flow -> should capture lead with explicit consent (CASL compliance)
- Description: Lead capture form fails when verifying explicit consent path.
- Suspected root cause: Checkbox default states or Supabase write missing required fields.
- Impact: Cannot prove CASL compliance.
- Fix Plan: Set explicit consent checkbox with aria/label, persist values, and stub API responses in tests.

### Issue #24: Lead form keyboard trap
- Category: E2E/Auth+Dashboard
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/lead-capture.spec.ts` -> Lead Capture Flow -> should be keyboard navigable (WCAG 2.2 AA)
- Description: Playwright stuck on body while tabbing through lead form.
- Suspected root cause: Focus order likely broken by custom components.
- Impact: Accessibility blockers remain unresolved.
- Fix Plan: Refactor controls to native inputs or add tabindex management so keyboard users can reach submit.

### Issue #25: Email validation missing
- Category: E2E/Auth+Dashboard
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/lead-capture.spec.ts` -> Lead Capture Flow -> should display error for invalid email format
- Description: Test enters malformed email and expects error but none appears.
- Suspected root cause: Validation probably runs only on blur or server.
- Impact: Leads with invalid emails slip through and QA fails.
- Fix Plan: Add regex/email validator with inline error messaging and expose selectors for tests.

### Issue #26: Root route security headers failing
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/phase2-gate.spec.ts` -> Phase 2 Gate - Critical Flows -> Root route (/) - Security headers and 200 response
- Description: Phase 2 gate detected missing headers or 500 on /.
- Suspected root cause: Edge/logging middleware likely not activated in preview.
- Impact: Blocks critical Phase-2 gate so deploy is halted.
- Fix Plan: Ensure middleware runs in all environments and add regression tests for headers + status.

### Issue #27: 404 handler missing headers
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/phase2-gate.spec.ts` -> Phase 2 Gate - Critical Flows -> 404 route - Security headers and proper error handling
- Description: Custom 404 page fails to supply required headers / 200 status.
- Suspected root cause: Probably falls back to default Vite response.
- Impact: Security scanners rely on deterministic 404 responses.
- Fix Plan: Add catch-all route with header middleware and update tests.

### Issue #28: Auth flow noisy errors
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/phase2-gate.spec.ts` -> Phase 2 Gate - Critical Flows -> Auth flow - Login without console errors
- Description: Login attempt logs console errors/failed network calls.
- Suspected root cause: Supabase env vars not defined under test run.
- Impact: Cannot verify auth gating, so pipeline fails.
- Fix Plan: Inject fake Supabase creds for tests or mock RPCs so login succeeds silently.

### Issue #29: Dashboard guard misconfigured
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/phase2-gate.spec.ts` -> Phase 2 Gate - Critical Flows -> Dashboard redirect - Proper authentication guard
- Description: Unauthenticated visit to /dashboard is not redirecting to /auth.
- Suspected root cause: Route guard likely checking stale session state.
- Impact: Violates access policy and regresses gating suite.
- Fix Plan: Make dashboard route use Supabase session + loader, add Playwright assertion for 302/URL change.

### Issue #30: AI widget fails on dashboard gate
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/phase2-gate.spec.ts` -> Phase 2 Gate - Critical Flows -> AI Chat Widget - Loads without errors
- Description: Phase test cannot find widget after login.
- Suspected root cause: Same root cause as homepage widget but within dashboard shell.
- Impact: Blocks release because gating ensures AI loads every time.
- Fix Plan: Mount widget after dashboard hydration and mock any required tokens in tests.

### Issue #31: Service worker not registering
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/phase2-gate.spec.ts` -> Phase 2 Gate - Critical Flows -> Service Worker - Registers successfully
- Description: Gate waits for navigator.serviceWorker.ready but promise never resolves.
- Suspected root cause: Registration script likely behind feature flag or path mismatch.
- Impact: Offline caching unavailable and gate stays red.
- Fix Plan: Ship deterministic SW manifest and ensure registration returns success even in test env.

### Issue #32: Edge functions returning errors
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/phase2-gate.spec.ts` -> Phase 2 Gate - Critical Flows -> Edge Functions - Respond without errors
- Description: Phase 2 gate hitting health endpoints receives 5xx/timeout.
- Suspected root cause: Local stub server probably not running or env missing.
- Impact: Blocking because health checks fail before release.
- Fix Plan: Spin up mock edge responses (msw) during tests and ensure API gateway handles missing envs gracefully.

### Issue #33: Auth-less edge calls succeed
- Category: Edge Functions & Rate Limit
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/production-edge-functions.spec.ts` -> Edge Function Error Handling -> All authenticated endpoints handle missing auth consistently
- Description: Test removes auth headers yet endpoints do not 401.
- Suspected root cause: Middleware may not run locally.
- Impact: Security regression could leak data.
- Fix Plan: Enforce JWT/RLS check in handlers and assert 401 structure.

### Issue #34: Error responses not JSON
- Category: Edge Functions & Rate Limit
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/production-edge-functions.spec.ts` -> Edge Function Error Handling -> All endpoints return valid JSON on error
- Description: Endpoints likely throw raw text/HTML on exceptions.
- Suspected root cause: Clients expect structured {code,message}.
- Impact: Monitoring/timeouts cannot parse errors so gating fails.
- Fix Plan: Wrap handlers with try/catch returning consistent JSON + status codes.

### Issue #35: send-sms rate limit missing
- Category: Edge Functions & Rate Limit
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/production-edge-functions.spec.ts` -> Edge Function Error Handling -> Rate limiting works on send-sms
- Description: Stress test never hits 429.
- Suspected root cause: Redis store / counter disabled locally.
- Impact: SMS abuse risk + gating failure.
- Fix Plan: Add in-memory limiter fallback for tests and honor configured thresholds.

### Issue #36: Vehicle search input validation missing
- Category: Edge Functions & Rate Limit
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/production-edge-functions.spec.ts` -> Edge Function Data Validation -> vehicles-search validates input parameters
- Description: Endpoint accepts invalid payload without 400.
- Suspected root cause: zod/schema likely not enforced.
- Impact: Bad inputs can crash search pipeline.
- Fix Plan: Validate request body and return descriptive errors for tests.

### Issue #37: ai-chat edge lacks schema validation
- Category: Edge Functions & Rate Limit
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/production-edge-functions.spec.ts` -> Edge Function Data Validation -> ai-chat validates message structure
- Description: Empty/invalid message arrays do not trigger validation error.
- Suspected root cause: Handlers probably assume shape and throw later.
- Impact: Allows malformed data + failing tests.
- Fix Plan: Add zod schema for request + respond with 422 when invalid.

### Issue #38: Edge logging disabled
- Category: Edge Functions & Rate Limit
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/production-edge-functions.spec.ts` -> Edge Function Logging & Monitoring -> Functions log errors properly
- Description: Test injects failure and expects structured log entry but none recorded.
- Suspected root cause: Observability hook may be behind feature flag.
- Impact: Without logging, debugging prod issues impossible.
- Fix Plan: Call centralized logger in catch blocks and assert via telemetry mock in tests.

### Issue #39: Ontario tax math incorrect
- Category: E2E/Quote & Vehicles
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/quote-flow.spec.ts` -> Quote Builder Flow -> should calculate Ontario taxes correctly (HST 13%)
- Description: Totals deviate from 13% HST expectation.
- Suspected root cause: Helper likely double counts rebates or uses outdated rate.
- Impact: Quotes show wrong totals for Ontario deals.
- Fix Plan: Update tax helper with province constants and add unit tests for ON scenario.

### Issue #40: BC GST/PST calculation wrong
- Category: E2E/Quote & Vehicles
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/quote-flow.spec.ts` -> Quote Builder Flow -> should calculate BC taxes correctly (GST 5% + PST 7%)
- Description: Should split GST 5% + PST 7% but math differs.
- Suspected root cause: Helper may apply PST on already-taxed amount.
- Impact: BC customers receive inaccurate quotes.
- Fix Plan: Correct stacking order and add regression tests with fixture amounts.

### Issue #41: Monthly payment formula drift
- Category: E2E/Quote & Vehicles
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/quote-flow.spec.ts` -> Quote Builder Flow -> should calculate monthly payment correctly
- Description: Finance calculator deviates from amortization formula used in tests.
- Suspected root cause: Probably missing fees or using APR/12 rounding incorrectly.
- Impact: Dealers cannot trust payment schedule.
- Fix Plan: Align formula with CFPB standard and lock via unit tests.

### Issue #42: Quote versioning broken
- Category: E2E/Quote & Vehicles
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/quote-flow.spec.ts` -> Quote Builder Flow -> should save quote with version tracking
- Description: Save action never persists version metadata.
- Suspected root cause: Supabase insert/upsert may fail due to RLS or missing columns.
- Impact: Users lose revision history and gating test fails.
- Fix Plan: Fix Supabase procedure and expose deterministic API stub for tests.

### Issue #43: Offline queue not buffering
- Category: PWA & Performance
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/resilience.spec.ts` -> Offline Queue Resilience -> should queue operations when offline
- Description: When offline flag toggled, actions are not queued.
- Suspected root cause: Service worker or localforage queue disabled.
- Impact: Offline experience unreliable; gating fails.
- Fix Plan: Implement queue fallback and simulate offline mode in tests.

### Issue #44: Offline indicator not showing
- Category: PWA & Performance
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/resilience.spec.ts` -> Offline Queue Resilience -> should show offline indicator
- Description: UI never flips to offline state when network drops.
- Suspected root cause: Global store may not listen to navigator.onLine.
- Impact: Users unaware of offline mode; resilience spec fails.
- Fix Plan: Wire status banner to connection hook and add aria-live messaging for tests.

### Issue #45: Circuit breaker not handling failures
- Category: PWA & Performance
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/resilience.spec.ts` -> Circuit Breaker Pattern -> should handle connector failures gracefully
- Description: Injected connector errors don't trip breaker UI.
- Suspected root cause: State machine likely not updating when API throws.
- Impact: Operators cannot diagnose outages.
- Fix Plan: Implement breaker states with fallback copy and assert transitions in tests.

### Issue #46: Breaker state UI missing
- Category: PWA & Performance
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/resilience.spec.ts` -> Circuit Breaker Pattern -> should display circuit breaker states
- Description: Test cannot find open/half-open indicators.
- Suspected root cause: Component probably hidden behind feature flag.
- Impact: SRE dashboards useless.
- Fix Plan: Always render state chips with data-testid for tests.

### Issue #47: Graceful degradation missing
- Category: PWA & Performance
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/resilience.spec.ts` -> Graceful Degradation -> should maintain core functionality when connectors are down
- Description: When connectors fail, core quote flow also fails instead of falling back.
- Suspected root cause: Error boundaries not implemented.
- Impact: No offline guarantee; gating fails.
- Fix Plan: Add fallback data + error boundaries so essentials still work in tests.

### Issue #48: RLS allows anonymous access
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/security-validation.spec.ts` -> Security Validation & Regression Guards -> RLS blocks anonymous access to sensitive tables
- Description: Test queries sensitive table and unexpectedly gets data.
- Suspected root cause: Policies might not run in non-prod role.
- Impact: Data leakage risk.
- Fix Plan: Align Supabase policies with anon role even in dev and assert 401/empty set.

### Issue #49: Encryption keys leaking
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/security-validation.spec.ts` -> Security Validation & Regression Guards -> Encryption keys are never exposed in responses
- Description: API response includes encryption data contrary to policy.
- Suspected root cause: Edge function probably echoes secrets in debug mode.
- Impact: Regulatory breach risk.
- Fix Plan: Scrub sensitive fields before responding and add regression checks.

### Issue #50: Client IP capture not resilient
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/security-validation.spec.ts` -> Security Validation & Regression Guards -> Client IP capture degrades gracefully
- Description: Edge function fails when upstream data missing.
- Suspected root cause: No fallback for undefined headers.
- Impact: Monitoring pipeline can break, blocking gate.
- Fix Plan: Add graceful fallback + status mapping for missing IPs.

### Issue #51: Consent validation too loose
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/security-validation.spec.ts` -> Security Validation & Regression Guards -> Consent records require valid data
- Description: API accepts incomplete consent payloads.
- Suspected root cause: Schema validation missing.
- Impact: Auditors could see junk entries.
- Fix Plan: Validate inputs server-side and return errors for tests to assert.

### Issue #52: Anonymous PII access regression
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/security-validation.spec.ts` -> Security Validation & Regression Guards -> Anonymous users cannot access PII
- Description: Test hits PII endpoint without auth and receives data.
- Suspected root cause: RLS or API guard turned off.
- Impact: Critical security issue blocks release.
- Fix Plan: Ensure middleware rejects anon, add integration test for 401 + redaction.

### Issue #53: Privilege escalation not prevented
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/e2e/security-validation.spec.ts` -> Regression Guards -> RLS policies prevent privilege escalation
- Description: RLS allows role upgrade action the test performs.
- Suspected root cause: Policy missing or mis-ordered.
- Impact: Could allow tenants to hijack data.
- Fix Plan: Tighten RLS policy for service role only and add regression query test.

### Issue #54: Lazy loading missing
- Category: PWA & Performance
- Severity: P0
- Status: OPEN
- Trigger: `tests/performance/lighthouse.spec.ts` -> Performance Benchmarking -> should lazy load non-critical assets
- Description: Lighthouse detected that non-critical images lack loading="lazy".
- Suspected root cause: Hero/marketing images probably eager load.
- Impact: Performance budget fails (10/10 requirement).
- Fix Plan: Mark below-the-fold assets as lazy and guard via tests.

### Issue #55: CSP frame-ancestors not allow-listing Lovable
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/security/embed-gate.spec.ts` -> Embed Gate - Anti-Framing Header Check -> CRITICAL: CSP must include correct frame-ancestors allow-list
- Description: Security headers still block embedding even though X-Frame-Options removed.
- Suspected root cause: CSP config lacks required domains.
- Impact: Lovable cannot iframe the app and gate fails.
- Fix Plan: Update CSP builder to include allowed domains and add regression test for header value.

### Issue #56: Embed gate service worker stale
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/security/embed-gate.spec.ts` -> Embed Gate - Anti-Framing Header Check -> Service Worker: Verify updated cache version
- Description: SW cache version not bumped so embed gate treats build as outdated.
- Suspected root cause: Cache manifest not updated in release.
- Impact: Embedding blocked after deploy.
- Fix Plan: Update SW versioning scheme and expose endpoint for tests to verify current version.

### Issue #57: Landing page crash in readiness suite
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/security/production-readiness.spec.ts` -> Production Readiness - Critical User Flows -> Landing page loads without errors
- Description: Test hits root and sees console errors or blank page.
- Suspected root cause: Likely due to missing public env vars.
- Impact: Cannot pass readiness gate, blocking deploy.
- Fix Plan: Load fallback content when env missing and mock APIs for tests.

### Issue #58: Dashboard unauth guard failing (readiness)
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/security/production-readiness.spec.ts` -> Production Readiness - Critical User Flows -> Dashboard redirects to auth when not logged in
- Description: Visiting /dashboard unauthenticated does not redirect to /auth.
- Suspected root cause: Same guard issue as phase2.
- Impact: Allows anonymous access to dashboard shell.
- Fix Plan: Hook Supabase session check early and assert redirect in tests.

### Issue #59: Readiness AI widget missing
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/security/production-readiness.spec.ts` -> Production Readiness - Critical User Flows -> AI Chat Widget loads correctly
- Description: Chat widget absent on readiness run as well.
- Suspected root cause: Probably same component gating as other failures.
- Impact: Without widget, readiness criteria fail.
- Fix Plan: Load assistant in readiness profile using mock API responses.

### Issue #60: Navigation leaks detected
- Category: Security/Embed
- Severity: P0
- Status: OPEN
- Trigger: `tests/security/production-readiness.spec.ts` -> Production Readiness - Performance -> No memory leaks in navigation
- Description: Performance tests detect listener leak while navigating.
- Suspected root cause: Global event handlers not cleaned up on route change.
- Impact: Long-running sessions degrade performance.
- Fix Plan: Clean up subscriptions in layout effects and instrument tests to confirm no leak warnings.
