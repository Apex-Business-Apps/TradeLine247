# Strict Code Audit Rubric

## CRITICAL AUDIT IN PROGRESS

**Auditor:** Self-review before final approval
**Date:** November 7, 2025
**Scope:** All changes in PR `claude/improve-prompt-quality-011CUrbymSN8bU7dVkQGjViX`

---

## AUDIT CRITERIA (Score: 1-5, 5 = Excellent)

### 1. CODE QUALITY

#### TypeScript Type Safety
- [ ] No `any` types introduced (or properly justified)
- [ ] All types properly exported/imported
- [ ] Generic types used correctly
- [ ] Type guards where needed
- [ ] No type assertion abuse (`as` keyword overuse)

#### Code Correctness
- [ ] Logic is sound and bug-free
- [ ] Edge cases handled
- [ ] Null/undefined checks where needed
- [ ] No memory leaks
- [ ] No race conditions

#### Error Handling
- [ ] Try-catch blocks where appropriate
- [ ] Errors properly typed (not `any`)
- [ ] Error messages informative
- [ ] Graceful degradation
- [ ] No swallowed errors

### 2. TESTING

#### Test Coverage
- [ ] New code has tests
- [ ] Existing tests still pass
- [ ] Edge cases tested
- [ ] Negative cases tested
- [ ] Integration points tested

#### Test Quality
- [ ] Tests are deterministic
- [ ] No flaky tests introduced
- [ ] Tests run in isolation
- [ ] Mocks are minimal and appropriate
- [ ] Test names are descriptive

#### CI/CD Compatibility
- [ ] Tests pass in CI environment
- [ ] No environment-specific assumptions
- [ ] Timeouts are reasonable
- [ ] Resource usage acceptable
- [ ] Parallel execution safe

### 3. SECURITY

#### Data Protection
- [ ] No secrets in code
- [ ] No PII exposed in logs
- [ ] Encryption used appropriately
- [ ] Auth/authz not weakened
- [ ] Input validation present

#### Dependencies
- [ ] No new vulnerable dependencies
- [ ] Polyfills are safe
- [ ] No arbitrary code execution
- [ ] XSS/injection prevention
- [ ] CSRF protection maintained

### 4. PERFORMANCE

#### Runtime Performance
- [ ] No performance regressions
- [ ] Algorithms are efficient
- [ ] No unnecessary re-renders
- [ ] Memory usage reasonable
- [ ] No blocking operations

#### Build Performance
- [ ] Bundle size not significantly increased
- [ ] Build time reasonable
- [ ] Tree-shaking compatible
- [ ] Code splitting maintained
- [ ] No circular dependencies

### 5. MAINTAINABILITY

#### Code Readability
- [ ] Code is self-documenting
- [ ] Complex logic has comments
- [ ] Naming is clear and consistent
- [ ] File organization logical
- [ ] No code duplication

#### Documentation
- [ ] JSDoc comments accurate
- [ ] README updated if needed
- [ ] Breaking changes documented
- [ ] Migration guide if needed
- [ ] Examples are correct

### 6. COMPATIBILITY

#### Backward Compatibility
- [ ] No breaking API changes (or versioned)
- [ ] Existing features still work
- [ ] Database schema compatible
- [ ] Configuration backward compatible
- [ ] Graceful upgrade path

#### Browser/Environment
- [ ] Works in target browsers
- [ ] Node.js version compatible
- [ ] Environment variables documented
- [ ] Polyfills for older environments
- [ ] Feature detection used

### 7. ACCESSIBILITY (for UI changes)

#### WCAG 2.2 AA Compliance
- [ ] Semantic HTML used
- [ ] ARIA attributes correct
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient

### 8. INTERNATIONALIZATION

#### Translation Quality
- [ ] All strings translatable
- [ ] Pluralization handled
- [ ] Date/number formatting localized
- [ ] RTL support (if applicable)
- [ ] No hardcoded strings

---

## CRITICAL ISSUES FOUND

### 🔴 BLOCKER (Must fix before merge)
*Issues that could break production*

### 🟡 WARNING (Should fix before merge)
*Issues that could cause problems*

### 🔵 INFO (Can fix later)
*Minor issues or improvements*

---

## AUDIT RESULTS

*To be filled in during audit...*
