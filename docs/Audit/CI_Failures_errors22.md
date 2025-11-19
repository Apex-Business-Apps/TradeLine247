## CI Failures – errors22

- Source log: `c:\Users\sinyo\Desktop\errors22.txt`
- Captured: 2025-11-19
- Scope: aggregate of `npm run test:e2e` and `npm run test:a11y` from the failing pipeline described in the prompt.

### Failure Inventory

| # | Test File | Suite / Scenario | Test Name | Error snippet |
| - | - | - | - | - |
| 1 | tests/accessibility/complete-wcag.spec.ts | Complete WCAG 2.2 AA Compliance | should have proper heading hierarchy | Error: expect(received).toBe(expected) // Object.is equality |
| 2 | tests/accessibility/complete-wcag.spec.ts | Complete WCAG 2.2 AA Compliance | should support keyboard navigation | Error: expect(received).toBe(expected) // Object.is equality |
| 3 | tests/accessibility/complete-wcag.spec.ts | Complete WCAG 2.2 AA Compliance | should have visible focus indicators | Error: expect(received).toBe(expected) // Object.is equality |
| 4 | tests/accessibility/complete-wcag.spec.ts | Complete WCAG 2.2 AA Compliance | should support screen readers | Error: expect(received).toBe(expected) // Object.is equality |
| 5 | tests/accessibility/wcag-audit.spec.ts | WCAG 2.2 AA Compliance | dashboard should have no accessibility violations | Error: expect(received).toBe(expected) // Object.is equality |
| 6 | tests/accessibility/wcag-audit.spec.ts | WCAG 2.2 AA Compliance | focus indicators should be visible | Error: expect(received).toBe(expected) // Object.is equality |
| 7 | tests/accessibility/wcag-audit.spec.ts | Keyboard Navigation | should navigate entire form with keyboard | Error: expect(received).toBe(expected) // Object.is equality |
| 8 | tests/e2e/ai-assistant.spec.ts | AI Assistant - AutoRepAi | should load chat widget on homepage | Error: expect(received).toBe(expected) // Object.is equality |
| 9 | tests/e2e/ai-assistant.spec.ts | AI Assistant - AutoRepAi | should display bilingual greeting (EN/FR) | Error: expect(received).toBe(expected) // Object.is equality |
| 10 | tests/e2e/ai-assistant.spec.ts | AI Assistant - AutoRepAi | should handle basic conversation flow | Error: expect(received).toBe(expected) // Object.is equality |
| 11 | tests/e2e/ai-assistant.spec.ts | AI Assistant - AutoRepAi | should log interactions to lead timeline | Error: expect(received).toBe(expected) // Object.is equality |
| 12 | tests/e2e/ai-assistant.spec.ts | AI Assistant - AutoRepAi | should respect rate limiting | Error: expect(received).toBe(expected) // Object.is equality |
| 13 | tests/e2e/ai-assistant.spec.ts | AI Assistant - AutoRepAi | should include compliance disclaimers | Error: expect(received).toBe(expected) // Object.is equality |
| 14 | tests/e2e/bilingual-pdf.spec.ts | Bilingual PDF Quote Generation | should generate English PDF quote | Error: expect(received).toBe(expected) // Object.is equality |
| 15 | tests/e2e/bilingual-pdf.spec.ts | Bilingual PDF Quote Generation | should generate French PDF quote | Error: expect(received).toBe(expected) // Object.is equality |
| 16 | tests/e2e/bilingual-pdf.spec.ts | Bilingual PDF Quote Generation | should include all Canadian provinces in quote | Error: expect(received).toBe(expected) // Object.is equality |
| 17 | tests/e2e/bilingual-pdf.spec.ts | Bilingual PDF Quote Generation | should calculate correct taxes for each province | Error: expect(received).toBe(expected) // Object.is equality |
| 18 | tests/e2e/bilingual-pdf.spec.ts | Bilingual PDF Quote Generation | should create secure share link for quote | Error: expect(received).toBe(expected) // Object.is equality |
| 19 | tests/e2e/credit-application.spec.ts | Credit Application Flow | should complete solo credit application with FCRA consent | Error: expect(received).toBe(expected) // Object.is equality |
| 20 | tests/e2e/credit-application.spec.ts | Credit Application Flow | should allow co-applicant addition | Error: expect(received).toBe(expected) // Object.is equality |
| 21 | tests/e2e/credit-application.spec.ts | Credit Application Flow | should validate required fields before submission | Error: expect(received).toBe(expected) // Object.is equality |
| 22 | tests/e2e/credit-application.spec.ts | Credit Application Flow | should enforce FCRA consent requirement | Error: expect(received).toBe(expected) // Object.is equality |
| 23 | tests/e2e/lead-capture.spec.ts | Lead Capture Flow | should capture lead with explicit consent (CASL compliance) | Error: expect(received).toBe(expected) // Object.is equality |
| 24 | tests/e2e/lead-capture.spec.ts | Lead Capture Flow | should be keyboard navigable (WCAG 2.2 AA) | Error: expect(received).toBe(expected) // Object.is equality |
| 25 | tests/e2e/lead-capture.spec.ts | Lead Capture Flow | should display error for invalid email format | Error: expect(received).toBe(expected) // Object.is equality |
| 26 | tests/e2e/phase2-gate.spec.ts | Phase 2 Gate - Critical Flows | Root route (/) - Security headers and 200 response | Error: expect(received).toBe(expected) // Object.is equality |
| 27 | tests/e2e/phase2-gate.spec.ts | Phase 2 Gate - Critical Flows | 404 route - Security headers and proper error handling | Error: expect(received).toBe(expected) // Object.is equality |
| 28 | tests/e2e/phase2-gate.spec.ts | Phase 2 Gate - Critical Flows | Auth flow - Login without console errors | Error: expect(received).toBe(expected) // Object.is equality |
| 29 | tests/e2e/phase2-gate.spec.ts | Phase 2 Gate - Critical Flows | Dashboard redirect - Proper authentication guard | Error: expect(received).toBe(expected) // Object.is equality |
| 30 | tests/e2e/phase2-gate.spec.ts | Phase 2 Gate - Critical Flows | AI Chat Widget - Loads without errors | Error: expect(received).toBe(expected) // Object.is equality |
| 31 | tests/e2e/phase2-gate.spec.ts | Phase 2 Gate - Critical Flows | Service Worker - Registers successfully | Error: expect(received).toBe(expected) // Object.is equality |
| 32 | tests/e2e/phase2-gate.spec.ts | Phase 2 Gate - Critical Flows | Edge Functions - Respond without errors | Error: expect(received).toBe(expected) // Object.is equality |
| 33 | tests/e2e/production-edge-functions.spec.ts | Edge Function Error Handling | All authenticated endpoints handle missing auth consistently | Error: expect(received).toBe(expected) // Object.is equality |
| 34 | tests/e2e/production-edge-functions.spec.ts | Edge Function Error Handling | All endpoints return valid JSON on error | Error: expect(received).toBe(expected) // Object.is equality |
| 35 | tests/e2e/production-edge-functions.spec.ts | Edge Function Error Handling | Rate limiting works on send-sms | Error: expect(received).toBe(expected) // Object.is equality |
| 36 | tests/e2e/production-edge-functions.spec.ts | Edge Function Data Validation | vehicles-search validates input parameters | Error: expect(received).toBe(expected) // Object.is equality |
| 37 | tests/e2e/production-edge-functions.spec.ts | Edge Function Data Validation | ai-chat validates message structure | Error: expect(received).toBe(expected) // Object.is equality |
| 38 | tests/e2e/production-edge-functions.spec.ts | Edge Function Logging & Monitoring | Functions log errors properly | Error: expect(received).toBe(expected) // Object.is equality |
| 39 | tests/e2e/quote-flow.spec.ts | Quote Builder Flow | should calculate Ontario taxes correctly (HST 13%) | Error: expect(received).toBe(expected) // Object.is equality |
| 40 | tests/e2e/quote-flow.spec.ts | Quote Builder Flow | should calculate BC taxes correctly (GST 5% + PST 7%) | Error: expect(received).toBe(expected) // Object.is equality |
| 41 | tests/e2e/quote-flow.spec.ts | Quote Builder Flow | should calculate monthly payment correctly | Error: expect(received).toBe(expected) // Object.is equality |
| 42 | tests/e2e/quote-flow.spec.ts | Quote Builder Flow | should save quote with version tracking | Error: expect(received).toBe(expected) // Object.is equality |
| 43 | tests/e2e/resilience.spec.ts | Offline Queue Resilience | should queue operations when offline | Error: expect(received).toBe(expected) // Object.is equality |
| 44 | tests/e2e/resilience.spec.ts | Offline Queue Resilience | should show offline indicator | Error: expect(received).toBe(expected) // Object.is equality |
| 45 | tests/e2e/resilience.spec.ts | Circuit Breaker Pattern | should handle connector failures gracefully | Error: expect(received).toBe(expected) // Object.is equality |
| 46 | tests/e2e/resilience.spec.ts | Circuit Breaker Pattern | should display circuit breaker states | Error: expect(received).toBe(expected) // Object.is equality |
| 47 | tests/e2e/resilience.spec.ts | Graceful Degradation | should maintain core functionality when connectors are down | Error: expect(received).toBe(expected) // Object.is equality |
| 48 | tests/e2e/security-validation.spec.ts | Security Validation & Regression Guards | RLS blocks anonymous access to sensitive tables | Error: expect(received).toBe(expected) // Object.is equality |
| 49 | tests/e2e/security-validation.spec.ts | Security Validation & Regression Guards | Encryption keys are never exposed in responses | Error: expect(received).toBe(expected) // Object.is equality |
| 50 | tests/e2e/security-validation.spec.ts | Security Validation & Regression Guards | Client IP capture degrades gracefully | Error: expect(received).toBe(expected) // Object.is equality |
| 51 | tests/e2e/security-validation.spec.ts | Security Validation & Regression Guards | Consent records require valid data | Error: expect(received).toBe(expected) // Object.is equality |
| 52 | tests/e2e/security-validation.spec.ts | Security Validation & Regression Guards | Anonymous users cannot access PII | Error: expect(received).toBe(expected) // Object.is equality |
| 53 | tests/e2e/security-validation.spec.ts | Regression Guards | RLS policies prevent privilege escalation | Error: expect(received).toBe(expected) // Object.is equality |
| 54 | tests/performance/lighthouse.spec.ts | Performance Benchmarking | should lazy load non-critical assets | Error: expect(received).toBe(expected) // Object.is equality |
| 55 | tests/security/embed-gate.spec.ts | Embed Gate - Anti-Framing Header Check | CRITICAL: CSP must include correct frame-ancestors allow-list | Error: expect(received).toBe(expected) // Object.is equality |
| 56 | tests/security/embed-gate.spec.ts | Embed Gate - Anti-Framing Header Check | Service Worker: Verify updated cache version | Error: expect(received).toBe(expected) // Object.is equality |
| 57 | tests/security/production-readiness.spec.ts | Production Readiness - Critical User Flows | Landing page loads without errors | Error: expect(received).toBe(expected) // Object.is equality |
| 58 | tests/security/production-readiness.spec.ts | Production Readiness - Critical User Flows | Dashboard redirects to auth when not logged in | Error: expect(received).toBe(expected) // Object.is equality |
| 59 | tests/security/production-readiness.spec.ts | Production Readiness - Critical User Flows | AI Chat Widget loads correctly | Error: expect(received).toBe(expected) // Object.is equality |
| 60 | tests/security/production-readiness.spec.ts | Production Readiness - Performance | No memory leaks in navigation | Error: expect(received).toBe(expected) // Object.is equality |

### Notes

- Multiple retries in the log failed for the same underlying tests; duplicates were deduplicated above.
- Where the pipeline log omitted stack traces (mostly E2E suites), the error snippet column captures the only text present (`expect` assertion failures). Full traces remain available via the referenced Playwright artifacts.

