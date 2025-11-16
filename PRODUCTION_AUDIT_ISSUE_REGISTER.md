# Production Audit Issue Register - autorepai

**Date**: 2025-01-16  
**Repository**: https://github.com/apexbusiness-systems/autorepai  
**Status**: Audit Complete - Issues Documented

---

## Issue Summary

- **Total Issues Found**: 15
- **High Severity**: 3
- **Medium Severity**: 7
- **Low Severity**: 5

---

## Issues by Area

### BUILD

#### B-001: TypeScript Strict Mode Disabled
- **Area**: Build
- **Severity**: Medium
- **Location**: `tsconfig.json`, `tsconfig.app.json`
- **Issue**: TypeScript strict mode is disabled (`strict: false`, `noImplicitAny: false`, `strictNullChecks: false`)
- **Impact**: Potential runtime errors from type mismatches, reduced type safety
- **Proposed Fix**: Enable strict mode gradually or document why it's disabled. At minimum, enable `strictNullChecks` for better null safety.
- **Status**: Pending

#### B-002: Source Maps Disabled in Production
- **Area**: Build
- **Severity**: Low
- **Location**: `vite.config.ts:30`
- **Issue**: `sourcemap: false` in production build
- **Impact**: Difficult to debug production errors without source maps
- **Proposed Fix**: Consider enabling source maps for production with a separate source map file (not inline) for security, or document the decision.
- **Status**: Pending

#### B-003: Console Statements in Production Code
- **Area**: Build
- **Severity**: Low
- **Location**: Multiple files (156 matches across 48 files)
- **Issue**: Many `console.log/warn/error` statements throughout codebase
- **Impact**: Console noise in production, potential information leakage
- **Proposed Fix**: Terser already removes `console.log/debug/trace` but keeps `console.error/warn`. Review if all console statements are intentional for production monitoring.
- **Status**: Pending (partially mitigated by terser config)

---

### TESTS

#### T-001: Skipped Tests in Test Suite
- **Area**: Tests
- **Severity**: Medium
- **Location**: 
  - `tests/blank-screen.spec.ts:46,109,121,133,157`
  - `tests/preview-health.spec.ts:89,102`
  - `src/lib/__tests__/errorReporter.test.ts:273`
  - `tests/cta-smoke.spec.ts:6` (flaky test skipped)
- **Issue**: Multiple tests are skipped, including critical functionality tests
- **Impact**: Reduced test coverage, potential bugs not caught
- **Proposed Fix**: Review skipped tests and either fix them, remove them if obsolete, or document why they're skipped. For flaky tests, add retry logic or fix root cause.
- **Status**: Pending

#### T-002: Flaky Test Temporarily Skipped
- **Area**: Tests
- **Severity**: Medium
- **Location**: `tests/cta-smoke.spec.ts:6`
- **Issue**: "Grow Now (Lead Form)" test is temporarily skipped due to flakiness
- **Impact**: Critical user flow (lead form) not tested in CI
- **Proposed Fix**: Fix the locator stability issue and re-enable the test, or implement proper retry logic.
- **Status**: Pending

#### T-003: Test Coverage Thresholds Not Enforced in CI
- **Area**: Tests
- **Severity**: Low
- **Location**: `vitest.config.ts:53-58`
- **Issue**: Coverage thresholds are defined (80% lines/functions, 75% branches) but not enforced in CI
- **Impact**: Coverage can drop below thresholds without CI failure
- **Proposed Fix**: Add coverage enforcement to CI workflow or document why thresholds are advisory only.
- **Status**: Pending

#### T-004: Limited Component Test Coverage
- **Area**: Tests
- **Severity**: Medium
- **Location**: Test suite analysis
- **Issue**: Only 4 of 126 components have tests (3.2% coverage)
- **Impact**: UI logic, styling, and interactions not tested
- **Proposed Fix**: Add component tests for critical UI components (forms, dialogs, cards). This is a long-term improvement.
- **Status**: Pending (documented in TESTING_ANALYSIS.md)

---

### RUNTIME / PRODUCTION CONFIG

#### R-001: TODO for Error Tracking Service
- **Area**: Runtime
- **Severity**: Low
- **Location**: `src/components/layout/HeaderErrorBoundary.tsx:33`
- **Issue**: TODO comment: "Send to error tracking service (Sentry, etc.)"
- **Impact**: Errors may not be tracked in production monitoring service
- **Proposed Fix**: Implement error tracking service integration (Sentry, LogRocket, etc.) or remove TODO if not needed.
- **Status**: Pending

#### R-002: Error Reporter Backend Test Skipped
- **Area**: Runtime
- **Severity**: Medium
- **Location**: `src/lib/__tests__/errorReporter.test.ts:273`
- **Issue**: Test for sending errors to backend in production is skipped
- **Impact**: Backend error reporting functionality not verified
- **Proposed Fix**: Fix the test or verify backend error reporting works in production manually.
- **Status**: Pending

#### R-003: Rate Limiter Depends on Database Table
- **Area**: Runtime
- **Severity**: High
- **Location**: `server/middleware/rateLimit.ts:42`
- **Issue**: Rate limiter queries `api_rate_limits` table which may not exist
- **Impact**: Rate limiting will fail if table doesn't exist, falling back to memory store (no persistence)
- **Proposed Fix**: Verify `api_rate_limits` table exists in production database, or add graceful fallback with proper error handling.
- **Status**: Pending

#### R-004: CORS Configuration May Be Too Restrictive
- **Area**: Runtime
- **Severity**: Medium
- **Location**: `server/securityHeaders.ts:132-148`
- **Issue**: CORS only allows specific origins. May block legitimate requests if origin list is incomplete.
- **Impact**: API requests from unexpected origins will be blocked
- **Proposed Fix**: Review allowed origins list, ensure all production domains are included. Consider environment-based configuration.
- **Status**: Pending

---

### CI/CD

#### C-001: Outdated TODO Comment in CI Workflow
- **Area**: CI/CD
- **Severity**: Low
- **Location**: `.github/workflows/ci.yml:44`
- **Issue**: TODO comment says "Add vitest configuration and test:unit script" but both already exist
- **Impact**: Misleading comment, potential confusion
- **Proposed Fix**: Remove outdated TODO comment.
- **Status**: ✅ Fixed - Removed outdated TODO comment

#### C-002: Lighthouse CI is Non-Blocking
- **Area**: CI/CD
- **Severity**: Low
- **Location**: `.github/workflows/ci.yml:158`
- **Issue**: `continue-on-error: true` for lighthouse job
- **Impact**: Performance regressions won't block merges
- **Proposed Fix**: This may be intentional (advisory only). Document the decision or make it blocking for critical regressions.
- **Status**: Pending (may be intentional)

---

### PERFORMANCE & RELIABILITY

#### P-001: Service Worker Currently Disabled
- **Area**: Performance
- **Severity**: Medium
- **Location**: `src/main.tsx:73-83`
- **Issue**: Service workers are unregistered to prevent stale cache issues
- **Impact**: No offline support, slower repeat page loads
- **Proposed Fix**: Re-enable service worker with proper update strategy after stabilization, or document why it's disabled.
- **Status**: Pending (documented as temporary)

#### P-002: Missing Error Handling in Some Async Operations
- **Area**: Reliability
- **Severity**: High
- **Location**: Multiple files with async operations
- **Issue**: Some async operations may not have proper error handling or fallbacks
- **Impact**: Unhandled promise rejections could crash the app
- **Proposed Fix**: Audit all async operations for proper error handling. Add global unhandled rejection handler if not already present (already exists in main.tsx:116).
- **Status**: Pending (needs detailed review)

#### P-003: Rate Limiter Cleanup Method
- **Area**: Reliability
- **Severity**: Low
- **Location**: `src/lib/performance/rateLimiter.ts`
- **Issue**: Rate limiter has `destroy()` but no explicit `cleanup()` alias for consistency
- **Impact**: Minor - code clarity
- **Proposed Fix**: Add `cleanup()` method as alias to `destroy()` for better API consistency.
- **Status**: ✅ Fixed - Added cleanup() method

---

## Resolved Issues

1. **C-001**: ✅ Removed outdated TODO comment from CI workflow (`.github/workflows/ci.yml:44`)
2. **P-003**: ✅ Added `cleanup()` method to rate limiter for better API consistency (`src/lib/performance/rateLimiter.ts`)

---

## Pre-Existing Issues (Not Introduced by This Audit)

### Build Dependency Issue
- **Location**: Build process
- **Issue**: Missing dependency `@tanstack/react-query-persist-client` causes build to fail
- **Status**: Pre-existing issue on main branch, not introduced by audit fixes
- **Note**: This should be fixed separately - either install the dependency or remove the import

---

## Notes

1. **TypeScript Strict Mode**: The codebase has strict mode disabled. This is a significant technical debt but enabling it would require extensive refactoring. Consider enabling gradually.

2. **Test Coverage**: While coverage thresholds are defined, they're not enforced. The test suite has good coverage in some areas (hooks, stores) but poor coverage in others (components, pages).

3. **Service Worker**: Currently disabled as a temporary measure. Should be re-enabled with proper update strategy.

4. **Error Tracking**: Error observability exists but TODO suggests integration with external service (Sentry) is pending.

5. **Rate Limiting**: Has fallback to memory store but no cleanup mechanism. Should add periodic cleanup.

---

## Next Steps

1. Review all high and medium severity issues
2. Create fix branch: `fix/production-audit-autorepai_20250116_america-edmonton`
3. Apply fixes in priority order (high → medium → low)
4. Run all tests and build verification
5. Create PR with comprehensive summary

