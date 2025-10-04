# Testing Strategy

## Overview

Comprehensive testing approach ensuring production readiness, compliance, accessibility, and resilience.

---

## Test Pyramid

```
         /\
        /  \  E2E Tests (10%)
       /____\  
      /      \  Integration Tests (30%)
     /________\
    /          \  Unit Tests (60%)
   /____________\
```

### Unit Tests (`src/**/*.test.ts`)

**Coverage Target:** 80%  
**Tools:** Vitest + Testing Library  
**Focus:**
- Tax calculations (Canadian provinces)
- Utility functions
- Business logic
- Crypto operations

**Example:**
```typescript
// src/lib/tax/canadianTaxCalculator.test.ts
describe('Canadian Tax Calculator', () => {
  test('calculates Ontario HST correctly', () => {
    const result = calculateTax(30000, 'ON');
    expect(result.hst).toBe(3900);
    expect(result.total).toBe(33900);
  });
});
```

### Integration Tests (`tests/integration/**`)

**Coverage Target:** Key workflows  
**Tools:** Vitest + Supabase client  
**Focus:**
- Database operations
- API endpoints
- Connector integrations
- Circuit breaker behavior

**Example:**
```typescript
// tests/integration/lead-capture.test.ts
test('should store lead with consent audit', async () => {
  const lead = await createLead({...});
  expect(lead.id).toBeTruthy();
  
  const audit = await getConsentAudit(lead.id);
  expect(audit.consents.marketing).toBe(true);
});
```

### E2E Tests (`tests/e2e/**`)

**Coverage Target:** Critical user journeys  
**Tools:** Playwright  
**Focus:**
- Complete user flows
- Cross-browser compatibility
- Mobile responsiveness
- Compliance requirements

**Test Suites:**
1. `lead-capture.spec.ts` - Lead capture with CASL consent
2. `quote-flow.spec.ts` - Quote generation with Canadian taxes
3. `credit-application.spec.ts` - Credit app with FCRA/GLBA/ESIGN
4. `ai-assistant.spec.ts` - AI chat integration
5. `resilience.spec.ts` - Circuit breaker & offline queue
6. `bilingual-pdf.spec.ts` - EN/FR PDF generation

---

## Test Execution

### Local Development

```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test src/lib/tax/canadianTaxCalculator.test.ts

# Watch mode
npm run test:watch
```

### CI Pipeline

```yaml
# .github/workflows/ci.yml
- name: Unit Tests
  run: npm run test:coverage
  
- name: E2E Tests
  run: npm run test:e2e

- name: Accessibility Audit
  run: npm run test:a11y

- name: Performance Benchmark
  run: npm run lighthouse
```

---

## Accessibility Testing

### WCAG 2.2 AA Compliance

**Tools:** axe-core + Playwright  
**Coverage:** All pages  
**Requirements:**
- Zero critical violations
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ≥ 4.5:1
- Touch targets ≥ 44x44px

**Test Suites:**
1. `wcag-audit.spec.ts` - General accessibility
2. `complete-wcag.spec.ts` - Comprehensive page-by-page audit
3. `keyboard-nav.spec.ts` - Keyboard-only navigation

**Manual Checks:**
- Screen reader testing (NVDA, JAWS)
- Magnification testing (200%, 400%)
- Voice control testing

---

## Performance Testing

### Core Web Vitals Targets

| Metric | Target | Tool |
|--------|--------|------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| FID (First Input Delay) | < 100ms | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| TTI (Time to Interactive) | < 3.0s | Lighthouse |
| TBT (Total Blocking Time) | < 300ms | Lighthouse |

### Lighthouse CI

```bash
# Run Lighthouse audit
npm run lighthouse

# Expected scores:
# Performance: ≥ 85
# Accessibility: ≥ 90
# Best Practices: ≥ 85
# SEO: ≥ 90
```

**Configuration:** `lighthouserc.json`

### Performance Budget

| Resource | Budget |
|----------|--------|
| Initial JS bundle | < 500 KB |
| Images (total) | < 1 MB |
| Fonts | < 100 KB |
| CSS | < 50 KB |

---

## Security Testing

### Automated Scans

**Tools:** 
- Supabase Linter (RLS policies)
- OWASP ZAP (web vulnerabilities)
- npm audit (dependency vulnerabilities)

```bash
# Check for vulnerable dependencies
npm audit

# Run Supabase security linter
supabase db lint

# Generate security report
npm run security:scan
```

### Manual Security Review

**Quarterly Checklist:**
- [ ] Review RLS policies for all tables
- [ ] Audit consent export functionality
- [ ] Verify E2EE implementation for share links
- [ ] Check secrets rotation
- [ ] Review authentication flows
- [ ] Validate API rate limiting

---

## Compliance Testing

### Regulatory Coverage

| Regulation | Test Coverage | Evidence |
|------------|---------------|----------|
| CASL | Lead capture consent | `lead-capture.spec.ts` |
| PIPEDA | Data access/export | `consent-export.test.ts` |
| Law 25 | Consent granularity | `lead-qualification.spec.ts` |
| TCPA | SMS/phone consent | `lead-capture.spec.ts` |
| FCRA | Credit app disclosure | `credit-application.spec.ts` |
| GLBA | Data security | `security.test.ts` |
| ESIGN | Electronic signatures | `credit-application.spec.ts` |
| GDPR | Right to erasure | `data-deletion.spec.ts` |

### Consent Audit Trail

**Test:**
```typescript
test('should maintain immutable consent audit', async () => {
  const lead = await createLead({...});
  const audit1 = await getConsentAudit(lead.id);
  
  // Attempt to modify (should fail)
  await expect(
    updateConsentAudit(lead.id, {...})
  ).rejects.toThrow('Append-only');
  
  // Add new consent event
  await addConsentEvent(lead.id, {...});
  const audit2 = await getConsentAudit(lead.id);
  
  expect(audit2.length).toBe(audit1.length + 1);
});
```

---

## Resilience Testing

### Circuit Breaker

**Test Scenarios:**
1. Connector service down
2. Slow response times
3. Intermittent failures
4. Recovery after outage

**Validation:**
```typescript
test('should open circuit after failure threshold', async () => {
  const breaker = circuitBreakerRegistry.get('dealertrack');
  
  // Simulate failures
  for (let i = 0; i < 5; i++) {
    await expect(
      breaker.execute(() => failingConnector())
    ).rejects.toThrow();
  }
  
  expect(breaker.getState()).toBe('OPEN');
});
```

### Offline Queue

**Test Scenarios:**
1. Queue operations when offline
2. Drain queue on reconnection
3. Handle queue overflow
4. Persist queue across sessions

**Validation:**
```typescript
test('should queue operations when offline', async () => {
  const queue = offlineQueue;
  
  // Simulate offline
  queue.pause();
  
  await queue.add('createQuote', {...});
  expect(queue.length()).toBe(1);
  
  // Simulate online
  queue.resume();
  await queue.drain();
  
  expect(queue.length()).toBe(0);
});
```

---

## Disaster Recovery Testing

### Quarterly DR Drills

**Schedule:** See `docs/DR_PLAYBOOK.md`

**Scenarios:**
1. Database outage
2. Connector failure
3. AI assistant down
4. Complete application outage

**Success Criteria:**
- RTO ≤ 4 hours
- RPO ≤ 15 minutes
- Zero data loss
- Documented timeline
- Action items identified

**Drill Template:**
```markdown
## DR Drill: [Scenario]
**Date:** [YYYY-MM-DD]
**Team:** [Participants]

### Timeline
- T+0: [Detection]
- T+5: [First action]
- T+30: [Key milestone]
- T+X: [Resolution]

### Results
- Actual RTO: [Duration]
- Actual RPO: [Data loss]
- Issues encountered: [List]

### Action Items
- [ ] [Improvement 1]
- [ ] [Improvement 2]
```

---

## Test Data Management

### Seed Data

**Location:** `supabase/seed.sql`

**Includes:**
- Sample leads (with consent records)
- Test vehicles
- Example quotes
- Mock credit applications

**Reset:**
```bash
supabase db reset
```

### Test Users

| Email | Role | Purpose |
|-------|------|---------|
| test@example.com | User | Standard flows |
| admin@example.com | Admin | Admin features |
| dealer@example.com | Dealer | Multi-tenant testing |

---

## Coverage Reports

### Unit Test Coverage

```bash
npm run test:coverage

# View report
open coverage/index.html
```

**Target:** 80% overall
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

### E2E Coverage

**Critical Paths:**
- [ ] Lead capture → Timeline
- [ ] Quote generation → PDF
- [ ] Credit app → Dealertrack export
- [ ] AI chat → Lead qualification
- [ ] Connector failure → Offline queue

---

## Continuous Improvement

### Test Metrics

**Track Monthly:**
- Test execution time
- Flaky test rate
- Coverage percentage
- Bug escape rate (production issues)

**Goals:**
- E2E suite < 10 minutes
- Flaky rate < 2%
- Coverage ≥ 80%
- Bug escape rate < 5%

### Test Maintenance

**Weekly:**
- Review failing tests
- Update test data
- Fix flaky tests

**Monthly:**
- Review coverage gaps
- Add tests for new features
- Update accessibility checks

**Quarterly:**
- Performance benchmark review
- DR drill execution
- Security audit

---

## Tools & Configuration

### Vitest

**Config:** `vitest.config.ts`

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Playwright

**Config:** `playwright.config.ts`

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
  ],
});
```

### Lighthouse CI

**Config:** `lighthouserc.json`

```json
{
  "ci": {
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.85}],
        "categories:accessibility": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

---

## Version History

| Version | Date       | Changes                    | Author |
|---------|------------|----------------------------|--------|
| 1.0     | 2025-10-04 | Initial testing strategy   | AI     |

---

**Next Review:** Q1 2026  
**Owner:** Engineering Lead  
**Status:** Active
