# Comprehensive Testing Coverage Analysis - TradeLine 247 AI

## Executive Summary

The project has a **foundational testing infrastructure** with ~480 test cases across 31 test files (3,872 lines of test code). However, **test coverage is limited** with only ~13% of source files having tests. The project uses a modern testing stack (Vitest + Playwright) with both unit and E2E testing, but significant coverage gaps exist in component testing and integration scenarios.

---

## 1. Test Files Overview

### Total Test Inventory
- **Test Files**: 31 files
- **Test Cases**: ~480 test cases
- **Lines of Test Code**: 3,872 lines
- **Source Files**: 242 (excluding tests)
- **Coverage Ratio**: ~13% of source files have tests

### Test File Breakdown by Location

```
Unit & Integration Tests (Vitest):
├── src/__tests__/
│   ├── __mocks__/supabase-client.ts (shared mock)
│   ├── routes/paths.test.ts
│   └── utils/test-utils.tsx
├── src/hooks/__tests__/
│   ├── useAuth.test.ts (comprehensive)
│   ├── usePasswordSecurity.test.ts (comprehensive)
│   └── useSecureFormSubmission.test.ts (comprehensive)
├── src/components/errors/__tests__/
│   ├── ErrorBoundary.test.tsx (11 test cases)
│   └── SafeErrorBoundary.test.tsx (7 test cases)
├── src/components/layout/__tests__/
│   └── Header.spec.tsx (1 test case - accessibility)
├── src/components/ui/
│   └── ChatIcon.test.tsx
├── src/lib/__tests__/
│   ├── ensureMembership.test.ts (comprehensive)
│   └── errorReporter.test.ts (comprehensive)
├── src/pages/__tests__/
│   ├── Index.spec.tsx (1 test)
│   ├── Contact.spec.tsx (1 test)
│   └── routes.smoke.test.tsx (4 smoke tests)
├── src/stores/__tests__/
│   ├── dashboardStore.test.ts (comprehensive)
│   └── userPreferencesStore.test.ts (comprehensive)
├── src/utils/__tests__/
│   ├── env.test.ts (2 test cases)
│   ├── utils.test.ts (8 test cases)
│   ├── runtime.test.ts
│   └── errorObservability.test.ts (6 test cases)
├── supabase/functions/_shared/__tests__/
│   └── http-security.test.ts (4 test cases - Deno/Edge Functions)

E2E Tests (Playwright):
└── tests/
    ├── smoke.spec.ts (7 page smoke tests)
    ├── cta-smoke.spec.ts (CTA testing)
    ├── blank-screen.spec.ts
    ├── preview-health.spec.ts
    └── e2e/
        ├── nav.spec.ts (parametrized quick action tests)
        ├── nav-and-forms.spec.ts (navigation & refresh)
        ├── a11y-smoke.spec.ts (Axe accessibility)
        ├── h310-detection.spec.ts (React Hook Order errors)
        ├── header-position.spec.ts
        ├── sw-freshness.spec.ts (Service Worker freshness)
        ├── helpers.ts (React hydration utilities)
        └── vendor/axe-core-playwright/ (accessibility testing)
```

---

## 2. Test Configuration & Setup

### Unit Test Configuration (Vitest)

**File**: `/vitest.config.ts`

```typescript
Configuration:
- Environment: jsdom
- Watch Mode: Disabled in CI
- Global Test APIs: Enabled (describe, it, expect)
- CSS Processing: Enabled
- Coverage Provider: v8

Test Thresholds:
- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

Include Patterns:
- src/**/*.{test,spec}.{ts,tsx}
- supabase/functions/_shared/**/*.test.ts

Exclude:
- tests/** (E2E only)
- node_modules/**
```

**Setup File**: `/src/setupTests.tsx`
- Imports `@testing-library/jest-dom/vitest`
- Mocks `react-helmet-async` for jsdom compatibility
- Prevents "Cannot read properties of undefined" errors

### E2E Test Configuration (Playwright)

**File**: `/playwright.config.ts`

```typescript
Configuration:
- Base URL: Environment variable or http://localhost:4173
- Projects: Chromium only (single browser)
- Parallel Execution: Fully parallel locally, single worker on CI
- Retries: 2 retries on CI, 0 locally
- Screenshots: Only on failure
- Videos: Retained on failure
- Traces: On first retry

Viewport: 1366x900 (deterministic)
Animations: Disabled (reducedMotion: 'reduce')
Timeouts:
  - Action: 45 seconds
  - Navigation: 45 seconds
  - Server startup: 120 seconds
  - Hydration wait: 45 seconds
```

### CI/CD Test Execution

**File**: `.github/workflows/ci.yml`

Unit Tests:
```yaml
Job: ci/test
- Runs on: ubuntu-latest
- Timeout: 25 minutes
- Command: npm run test:ci
- Dependencies: build job
- Reporting: GitHub commit status
```

**File**: `.github/workflows/e2e.yml`

E2E Tests:
```yaml
Job: e2e/playwright
- Triggers: Manual dispatch + on PR changes to tests/**
- Runs on: ubuntu-latest
- Timeout: 40 minutes
- Setup:
  - npm ci
  - apt-get install imagemagick
  - npm run build
  - npx playwright install --with-deps
- Command: npx playwright test tests/e2e
- Artifacts: playwright-report, test-results
- Reporter: list format
```

### Testing Dependencies

```json
DevDependencies:
- @testing-library/react: ^16.0.1 (component testing)
- @testing-library/dom: ^10.4.0
- @testing-library/jest-dom: ^6.6.3
- @testing-library/user-event: ^14.6.1 (user interactions)
- @playwright/test: ^1.55.1 (E2E)
- vitest: ^2.1.5 (unit testing)
- @vitest/coverage-v8: ^2.1.9 (coverage reporting)
- jsdom: ^25.0.1 (DOM simulation)
- axe-core: ^4.10.3 (accessibility)
- @axe-core/playwright: file:tests/e2e/vendor/axe-core-playwright (a11y testing)
```

---

## 3. Unit Tests - Detailed Coverage

### Hooks Testing (3/31 hooks tested = 9.7%)

**Tested Hooks**:
1. **useAuth** (comprehensive)
   - 50+ test cases covering:
     - Initial state (loading, null user/session)
     - Session handling (set/clear on auth change)
     - Token error handling (malformed, invalid JWT)
     - User roles (fetch, default to 'user')
     - Membership management (ensureMembership call)
     - Cleanup (unsubscribe on unmount)
   - **Issues**: Async mock factory complexity, waitFor timeouts

2. **usePasswordSecurity** (comprehensive)
   - 25+ test cases:
     - Password strength validation (length, criteria)
     - Character type detection (lowercase, uppercase, numbers, special)
     - Breach checking (safe, breached, error handling)
     - Combined validation (strength + breach)
     - Network error handling
   - **Good**: Tests error scenarios well

3. **useSecureFormSubmission** (comprehensive)
   - 22+ test cases:
     - Initial state
     - CSRF token generation/reuse
     - Rate limiting (allowed/denied/error states)
     - Form submission (success, errors)
     - Response validation
     - Remaining attempts calculation
   - **Good**: Tests security-critical functionality

**Untested Hooks** (28): useAnalytics, useLanguage, useLocalStorage, useMediaQuery, useQueryCache, and 23 others

### Utils Testing (4/11 utils tested = 36%)

**Tested**:
1. **env.test.ts** - Environment variable utilities (2 test cases)
2. **utils.test.ts** - Class name utilities `cn()` (8 test cases)
   - Tailwind merge conflict resolution
   - Conditional classes, arrays, objects
   - Edge cases (null, undefined, empty)
3. **errorObservability.test.ts** - Error tracking (6 test cases)
   - Initialization, error capture
   - Unhandled rejection capture
   - Environment detection (dev/preview/prod)
4. **runtime.test.ts** - Runtime detection

**Untested**: SEO optimizers, safe-globals, keyboardNavigation, other utilities

### Library Functions Testing (2/23 lib files tested = 8.7%)

**Tested**:
1. **errorReporter.test.ts** (comprehensive, 15+ test cases)
   - Error storage and limiting (max 50 in memory, 20 in localStorage)
   - Backend sending (selective by environment)
   - Network error interception
   - React error reporting

2. **ensureMembership.test.ts** (comprehensive, 14+ test cases)
   - Existing membership retrieval
   - New membership creation
   - Error handling (function errors, database errors)
   - Idempotency (safe to call multiple times)
   - Company name passing

**Untested** (21): HTTP handlers, Supabase integration functions, data transformers, validators

### State Management Testing (2/4 stores tested = 50%)

**Tested**:
1. **dashboardStore.test.ts** (26+ test cases)
   - Dialog states (welcome, settings, quick action)
   - Loading states (refreshing, syncing)
   - Selected items (KPI, transcript)
   - Sidebar toggle
   - Notifications (count increment/clear)
   - Reset functionality

2. **userPreferencesStore.test.ts** (25+ test cases)
   - Onboarding state
   - Theme & accent color
   - Dashboard layout & sections
   - Notifications settings
   - Display preferences (compact mode, reduce motion)
   - Recent actions (keep last 10)
   - localStorage persistence

**Untested** (2): Other potential stores

### Component Testing (4/126 components tested = 3.2%) ⚠️ MAJOR GAP

**Tested Components**:
1. **ErrorBoundary.tsx** (11 test cases)
   - Error catching and display
   - Error reporter integration
   - Development vs production modes
   - Page reload on retry
   - Navigation (Go Home button)
   - Support email display
   - Icon rendering

2. **SafeErrorBoundary.tsx** (7 test cases)
   - Basic error catching
   - Error details in dev mode
   - Reload button functionality
   - Stack trace handling
   - Multiple error handling

3. **Header.tsx** (1 test case)
   - Mobile burger menu with accessibility
   - aria-expanded, aria-controls attributes
   - Mobile menu visibility

4. **ChatIcon.tsx** - Basic UI component test

**Untested** (122 components):
- **Sections**: HeroSection, BenefitsGrid, ImpactStrip, HowItWorks, LeadCaptureForm, etc.
- **Forms**: All form components
- **Navigation**: Nav menus, breadcrumbs, pagination
- **Cards & Layout**: Card components, containers
- **Dialogs & Modals**: Dialog components
- **Dashboard**: Dashboard-specific components
- **Analytics**: Analytics visualizations
- **Call Center**: Call handling UI
- **Admin**: Admin panel components

### Page Testing (3/26 pages tested = 11.5%)

**Tested**:
1. **Index.spec.tsx** (1 test)
   - Renders without camelCase fetchPriority attributes

2. **Contact.spec.tsx** (1 test)
   - Tel and mailto links exposed

3. **routes.smoke.test.tsx** (4 smoke tests)
   - Pricing page rendering
   - Auth page sign-in form
   - Index page hero section
   - Page structure validation

**Untested** (23): Dashboard, Calls, Auth, Pricing, FAQ, Features, Admin, Client Dashboard, Call Logs, etc.

---

## 4. Integration Tests

**Limited Integration Coverage**:

Tests do integrate with mocked Supabase:
- useAuth hooks with Supabase auth
- usePasswordSecurity with function invocation
- useSecureFormSubmission with RPC calls
- ensureMembership with database + functions

**No True Integration Tests**:
- No tests with real database connections
- No API endpoint testing
- No multi-service interaction tests
- No workflow testing (e.g., full authentication flow)

---

## 5. End-to-End Tests (Playwright) - 13 spec files

### Coverage by Test Type

**Smoke Tests**:
1. **smoke.spec.ts** (7 page tests)
   - Tests ~7 critical pages (/, /pricing, /compare, /security, /contact, /features, /faq)
   - Verifies:
     - Pages render with correct h1 heading
     - No console errors (filters known harmless errors)
     - 200 status codes

2. **cta-smoke.spec.ts** - CTA button testing
3. **blank-screen.spec.ts** - Blank screen detection
4. **preview-health.spec.ts** - Preview deployment health

**Navigation & User Interaction Tests**:
1. **nav.spec.ts** (parametrized tests)
   - Quick action navigation tests
   - 4 test cases for quick actions (/calls, /numbers/new, /team/invite, /integrations)
   - Tests navigation + page reload persistence

2. **nav-and-forms.spec.ts** - Form navigation tests

3. **header-position.spec.ts** - Header positioning tests

**Specialized E2E Tests**:
1. **a11y-smoke.spec.ts** (using Axe)
   - WCAG AA compliance checking
   - Color contrast validation (fixed in recent commit)
   - Uses custom `@axe-core/playwright` integration

2. **h310-detection.spec.ts** (React Error Detection)
   - Tests ~6 critical routes (/, /features, /pricing, /faq, /contact, /dashboard)
   - Catches "Rendered more hooks than during previous render" errors
   - Checks console errors and page errors separately
   - Verifies React app root content rendered

3. **sw-freshness.spec.ts** (Service Worker)
   - Tests service worker update functionality
   - Checks service worker freshness

### E2E Test Utilities

**helpers.ts** provides:
- `waitForReactHydration()` - Waits for explicit React ready signal (window.__REACT_READY__)
- `disableAnimations()` - Injects CSS to disable all animations/transitions
- `gotoAndWait()` - Combined navigation + hydration wait pattern

**Key Features**:
- Uses explicit React hydration signal instead of timing-based waits
- Extended timeouts for CI environment (45 seconds)
- Deterministic layout testing (fixed viewport 1366x900)
- Network idle handling with error recovery

### E2E Test Quality Issues

✅ **Strengths**:
- Good React hydration handling
- Accessibility testing (Axe integration)
- React-specific error detection
- Service worker testing
- Handles asynchronous challenges well

⚠️ **Weaknesses**:
- Limited test count (~13 spec files)
- Smoke tests only (minimal interaction testing)
- No authentication flow testing
- No form submission testing
- No error recovery testing
- No performance testing

---

## 6. Test Coverage Metrics

### Test Thresholds (vitest.config.ts)

```
Lines:       80%
Functions:   80%
Branches:    75%
Statements:  80%
```

**Status**: Configured but no recent coverage reports generated

### Estimated Coverage

```
Component Coverage:        3.2% (4/126 tested)
Hook Coverage:             9.7% (3/31 tested)
Page Coverage:            11.5% (3/26 tested)
Library Coverage:          8.7% (2/23 tested)
Store Coverage:           50.0% (2/4 tested)
Utility Coverage:         36.0% (4/11 tested)

Overall Source Coverage:  ~13% (31/242 files)
```

---

## 7. Testing Utilities & Helpers

### Shared Test Utilities (`src/__tests__/utils/test-utils.tsx`)

**Render Functions**:
- `renderWithProviders()` - Wraps with MemoryRouter for React Router

**Mock Factories**:
- `createMockSupabase()` - Full Supabase client mock
- `createMockUser()` - Supabase user factory with customization
- `createMockSession()` - Session factory

**Browser Utilities**:
- `mockLocalStorage()` - Full localStorage implementation
- `mockLocation()` - Window.location mocking
- `waitForAsync()` - Async state updates

### Shared Mock Supabase (`src/__tests__/__mocks__/supabase-client.ts`)

Provides:
- `mockInvoke`, `mockRpc`, `mockFrom` - Individual function mocks
- `createMockSupabaseClient()` - Full client factory
- Pre-configured auth methods (getSession, onAuthStateChange, signOut)
- Query builder pattern mocking

**Issues**:
- Some tests use async mock factory pattern, others use static mock
- Inconsistent across test files
- CI compatibility workarounds needed (vi.mocked() with explicit any)

### Test Patterns Used

**Pattern 1: Async Mock Factories** (useAuth, usePasswordSecurity)
```typescript
vi.mock('@/module', async () => {
  const mockFn = vi.fn();
  return { export: mockFn };
});
```
**Benefit**: CI-compatible, proper module resolution
**Cost**: More verbose, async setup required

**Pattern 2: Static Mocks** (many tests)
```typescript
vi.mock('@/module', () => ({
  export: vi.fn(),
}));
```
**Benefit**: Simple, clear
**Cost**: CI issues with Supabase types

**Pattern 3: Component Mocking**
```typescript
vi.mock('@/components/Heavy', () => ({
  Heavy: () => <div data-testid="heavy" />,
}));
```
**Used for**: Testing with heavy dependencies (seo, sections)

---

## 8. Mock Implementations

### Supabase Mocking

**Comprehensive**: Mock covers auth, from (queries), functions.invoke, rpc

**Limitations**:
- No subscription error handling
- Basic query builder (doesn't validate chains)
- Doesn't mock all Supabase methods

### React Component Mocking

**Heavy Components Mocked**:
- SEO components (AISEOHead, SEOHead, OrganizationSchema)
- Layout sections (HeroRoiDuo, BenefitsGrid, etc.)
- Footer
- Forms (LeadCaptureForm)
- UI components (Button, Card, Dialog, etc.)

**Rationale**: Speed up tests, focus on logic not rendering

### Router Mocking

**MemoryRouter**: Used in component tests
**Mock useNavigate**: Used in route-dependent tests

### Feature/Hook Mocking

- `useAnalytics` - Mock tracking functions
- `useAuth` - Mock auth state and methods
- `useToast` - Mock notification system
- `usePasswordSecurity` - Fully mocked

---

## 9. CI/CD Test Execution

### GitHub Actions Workflows

**ci.yml**:
```
Job: ci/build (20 min timeout)
  - Build app
  - Verify artifact existence

Job: ci/lint (15 min timeout)
  - ESLint
  - Attribute casing checks (fetchpriority)

Job: ci/test (25 min timeout)
  - Install dependencies
  - Run: npm run test:ci
  - Report status to commit
  - Timeout: 25 minutes (plenty for ~480 tests)
```

**e2e.yml**:
```
Job: e2e/playwright (40 min timeout)
- Runs on PR to tests/e2e/** paths
- Installs Playwright with dependencies
- Builds app first
- Runs: npx playwright test tests/e2e
- Uploads artifacts (playwright-report, test-results)
- Single worker (sequential execution)
- 2 retries on failure
```

### Test Scripts

**npm run test** - Local testing with watch mode
**npm run test:ci** - CI mode (no watch, basic reporter)
**npm run test:ci:coverage** - CI mode with coverage reporting

---

## 10. Testing Gaps & Issues

### Critical Gaps

#### 1. **Component Testing** ⚠️⚠️⚠️
- **Gap**: Only 4 of 126 components have tests (3.2%)
- **Impact**: No unit testing for UI logic, styling, interactions
- **Missing**: Form components, Section components, Dialog components, Card components
- **Recommendation**: Create component test suite for critical UI components

#### 2. **Page Testing** ⚠️⚠️
- **Gap**: Only 3 of 26 pages have tests (11.5%)
- **Impact**: No route-specific testing, no page-level integration
- **Missing**: Dashboard, Auth flows, Admin pages, Call center pages
- **Recommendation**: Add smoke tests for all pages, detailed tests for critical flows

#### 3. **Hook Coverage** ⚠️
- **Gap**: Only 3 of 31 custom hooks tested (9.7%)
- **Missing**: useAnalytics, useLanguage, useLocalStorage, useMediaQuery, custom hooks
- **Recommendation**: Test remaining hooks, especially data-fetching hooks

#### 4. **Integration Testing** ⚠️⚠️
- **Gap**: No true integration tests (all use mocks)
- **Impact**: No testing of real Supabase interactions, API endpoints
- **Missing**: Authentication flows, database operations, real edge functions
- **Recommendation**: Create integration test suite with test database

#### 5. **Form Testing** ⚠️⚠️⚠️
- **Gap**: No form-specific tests
- **Impact**: No validation testing, no submission flow testing, no error handling
- **Missing**: Lead capture forms, login forms, signup forms
- **Recommendation**: Add form integration tests

#### 6. **E2E Test Density** ⚠️
- **Gap**: ~13 spec files but minimal test cases (mostly smoke tests)
- **Impact**: Limited user flow coverage
- **Missing**: Complete authentication flows, data entry workflows, error recovery
- **Recommendation**: Expand E2E tests for critical user paths

### Maintenance Issues

1. **Mock Fragility**: Heavy mocking can lead to false positives
2. **Test Flakiness**: Some E2E tests have extended timeouts (45s) indicating potential flakiness
3. **Async Complexity**: vi.mocked() workarounds needed for Supabase types
4. **Dependency Coupling**: Many tests mock the same dependencies

### Known Test Issues

From recent commits:
- `fix: resolve 11 failing E2E tests + WCAG AA compliance (#137)`
- `Fix/header rebuild color compliance 2025 (#138)`

**Indicates**: Recent test failures, color contrast issues, compliance problems

---

## 11. Test Quality & Maintainability

### Test Quality Strengths

✅ **Good Patterns**:
- Clear test descriptions and organization (describe/it blocks)
- Proper setup/teardown (beforeEach/afterEach)
- Mock cleanup and isolation
- Error scenario testing
- Edge case coverage (null, undefined, errors)

✅ **Strong Areas**:
- useAuth tests: Comprehensive with many scenarios
- usePasswordSecurity: Good coverage of validation logic
- useSecureFormSubmission: Security-critical functionality well-tested
- errorReporter: Good error handling coverage
- Store tests: Complete state management coverage

### Test Quality Weaknesses

⚠️ **Issues**:
- **Test file count/test case ratio imbalance**: Some test files have only 1-2 tests
- **Shallow component tests**: Most component tests don't test interactions
- **Mock over-reliance**: Heavy mocking may hide real integration issues
- **Limited negative testing**: Not enough "error path" testing in E2E
- **No performance testing**: No load testing, no performance metrics
- **Documentation**: Limited test documentation/comments in some files
- **Naming**: Some tests could have more descriptive names

### Maintainability Concerns

⚠️ **Areas of Concern**:

1. **Test Isolation**
   - Uses MemoryRouter which may hide routing issues
   - Heavy mocking may not catch real dependency failures

2. **Flakiness Risk**
   - Long timeouts (45s) suggest timing-dependent tests
   - E2E tests sensitive to animation/transition timing
   - Network-dependent tests without proper retry logic

3. **Technical Debt**
   - Async mock factory pattern inconsistency
   - Some setup code could be refactored into test utilities
   - Coverage thresholds set but not enforced/reported

4. **Coverage Tracking**
   - No visible coverage reports in CI
   - Coverage thresholds not enforced in pipeline

---

## 12. Recommendations & Action Plan

### Priority 1: Critical Coverage Gaps

1. **Component Testing Framework** (High Impact)
   - Create test suite for top 20 components (forms, sections, layouts)
   - Add visual regression testing
   - Target: 50% component coverage

2. **Form Testing** (High Impact)
   - Test all form submissions
   - Validation logic testing
   - Error state handling
   - Target: 100% of forms

3. **Page-Level Integration** (Medium Impact)
   - Add tests for critical pages (Dashboard, Auth, Pricing)
   - Test full user flows
   - Target: 50% page coverage

### Priority 2: Infrastructure Improvements

4. **Coverage Reporting** (Medium Impact)
   - Enable coverage report upload to CI
   - Add coverage badges
   - Track coverage trends

5. **Test Flakiness Reduction** (Medium Impact)
   - Replace hard timeouts with explicit waits
   - Add retry logic for flaky E2E tests
   - Improve hydration detection

6. **Integration Test Suite** (Low Impact)
   - Create test database setup
   - Test real Supabase interactions
   - End-to-end authentication flow

### Priority 3: Quality & Maintenance

7. **Test Utility Standardization** (Low-Medium Impact)
   - Standardize mock patterns (async vs static)
   - Create more reusable test helpers
   - Document test patterns

8. **E2E Expansion** (Medium Impact)
   - Add user flow tests
   - Add error recovery tests
   - Add accessibility testing

9. **Documentation** (Low Impact)
   - Document testing strategy
   - Create testing guidelines
   - Add test-specific documentation to components

### Quick Wins (< 1 day)

- Enable coverage reporting in CI
- Add 5-10 critical component tests
- Fix flaky E2E tests
- Add mock helpers for common patterns

### Medium Term (1-2 weeks)

- Build component test suite (top 20 components)
- Add form validation tests
- Improve E2E test density
- Standardize mocking patterns

### Long Term (1-2 months)

- Achieve 50%+ component coverage
- Create integration test suite
- Setup performance testing
- Implement visual regression testing

---

## Summary Statistics

| Metric | Value | Status |
|--------|-------|--------|
| Test Files | 31 | ✅ |
| Test Cases | ~480 | ✅ |
| Lines of Test Code | 3,872 | ✅ |
| Source Files with Tests | 31/242 (13%) | ⚠️ |
| Component Coverage | 4/126 (3%) | ❌ |
| Hook Coverage | 3/31 (10%) | ⚠️ |
| Page Coverage | 3/26 (12%) | ⚠️ |
| E2E Test Files | 13 | ✅ |
| Unit Test Framework | Vitest | ✅ |
| E2E Framework | Playwright | ✅ |
| Accessibility Testing | Axe | ✅ |
| Coverage Thresholds | 80% (lines/functions), 75% (branches) | ✅ Configured, Not Enforced |
| CI Integration | GitHub Actions | ✅ |
| Test Timeout | 25 min (unit), 40 min (e2e) | ✅ |

