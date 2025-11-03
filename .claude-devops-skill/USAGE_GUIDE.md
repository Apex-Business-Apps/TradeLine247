# 📘 DevOps Skill Usage Guide

## Table of Contents
- [Quick Start](#quick-start)
- [Activation Methods](#activation-methods)
- [Common Use Cases](#common-use-cases)
- [Protocols](#protocols)
- [Automation Scripts](#automation-scripts)
- [Best Practices](#best-practices)

---

## Quick Start

### 1. Activate the Skill

In Claude Code:
```
/skill devops
```

Or implicitly:
```
"Use maximum technical mastery to analyze this code"
```

### 2. Run Your First Audit

```bash
npm run claude:audit
```

This will run a comprehensive quality, security, and performance audit.

---

## Activation Methods

### Explicit Activation
```
/skill devops
```

### Implicit Keywords
Use these phrases to trigger DevOps mastery:
- "with maximum technical mastery"
- "using absolute logic"
- "with code genius level quality"
- "apply best practices"
- "production-ready implementation"

### Protocol-Specific
```
"Fix this bug using Protocol A"
"Implement this feature with Protocol B"
"Refactor using Protocol C"
"Optimize performance with Protocol D"
```

---

## Common Use Cases

### 🐛 Bug Fixing

**Scenario:** Login form isn't working

**Command:**
```
"Fix the login bug using Protocol A:
1. Reproduce with failing test
2. Isolate root cause
3. Apply minimal fix
4. Verify no regressions"
```

**What happens:**
1. Claude writes a failing test demonstrating the bug
2. Traces execution path to find root cause
3. Applies the minimal necessary fix
4. Runs all tests to ensure no regressions
5. Documents the fix with comments

---

### ✨ Feature Implementation

**Scenario:** Add dark mode toggle

**Command:**
```
"Implement dark mode toggle using Protocol B.
Include:
- Theme provider with context
- Toggle component
- Persistence to localStorage
- Full test coverage
- TypeScript strict mode"
```

**What happens:**
1. Claude designs types and interfaces first
2. Writes comprehensive tests
3. Implements incrementally
4. Ensures compatibility with existing code
5. Optimizes for performance

---

### 🔍 Code Review

**Scenario:** Review PR before merge

**Command:**
```
"Review this code with DevOps mastery. Check:
- Type safety (zero 'any' types)
- Security vulnerabilities
- Performance issues
- Test coverage
- Accessibility
- Best practices violations"
```

**What happens:**
Claude analyzes the code and provides:
- Line-by-line issues with severity
- Security concerns (OWASP Top 10)
- Performance bottlenecks
- Missing tests
- Accessibility violations
- Refactoring suggestions

---

### ⚡ Performance Optimization

**Scenario:** Dashboard loads slowly

**Command:**
```
"Optimize dashboard performance using Protocol D:
1. Profile and measure current performance
2. Identify bottlenecks
3. Apply optimizations
4. Benchmark improvements (target: 2x faster)
5. Monitor for regressions"
```

**What happens:**
1. Claude profiles the component
2. Identifies expensive re-renders, heavy computations
3. Applies React.memo, useMemo, useCallback
4. Implements virtualization for long lists
5. Benchmarks before/after
6. Documents optimizations

---

### 🏗️ Architecture Design

**Scenario:** Design a new microservice

**Command:**
```
"Design a user notification microservice with DevOps mastery.
Requirements:
- Real-time notifications (WebSocket)
- Multiple channels (email, SMS, push)
- Queue-based processing
- Horizontal scalability
- Observability built-in"
```

**What happens:**
Claude provides:
- System architecture diagram (text-based)
- Technology recommendations
- API contract design
- Database schema
- Deployment strategy
- Security considerations
- Monitoring setup

---

## Protocols

### Protocol A: Bug Fixes
**Use when:** Fixing bugs, resolving issues

**Steps:**
1. **REPRODUCE**: Write failing test
2. **ISOLATE**: Find minimal code path
3. **FIX**: Apply minimal change
4. **VERIFY**: Ensure tests pass
5. **DOCUMENT**: Explain the fix

**Example:**
```
"Fix the authentication timeout bug using Protocol A"
```

---

### Protocol B: New Features
**Use when:** Building new functionality

**Steps:**
1. **DESIGN**: Define types/interfaces
2. **TEST**: Write comprehensive tests
3. **IMPLEMENT**: Build incrementally
4. **INTEGRATE**: Ensure compatibility
5. **OPTIMIZE**: Refactor for quality

**Example:**
```
"Implement file upload with drag-and-drop using Protocol B"
```

---

### Protocol C: Refactoring
**Use when:** Improving existing code

**Steps:**
1. **BASELINE**: Run all tests
2. **EXTRACT**: Identify refactor target
3. **TRANSFORM**: Small, safe steps
4. **VALIDATE**: Re-run tests after each change
5. **POLISH**: Improve naming, docs

**Example:**
```
"Refactor the UserService class using Protocol C"
```

---

### Protocol D: Performance
**Use when:** Optimizing speed/efficiency

**Steps:**
1. **MEASURE**: Profile with real data
2. **HYPOTHESIS**: Form theories
3. **EXPERIMENT**: Try optimizations
4. **BENCHMARK**: Measure improvement
5. **MONITOR**: Check for regressions

**Example:**
```
"Optimize the product list rendering using Protocol D"
```

---

## Automation Scripts

### 📊 Full Audit
```bash
./.claude/scripts/audit.sh
```

**Checks:**
- TypeScript strict compliance
- ESLint (zero warnings)
- Test coverage (>80%)
- Security vulnerabilities
- Bundle size
- Code complexity
- Secrets detection

**When to run:**
- Before major releases
- Weekly code health check
- After large refactors

---

### ✅ Quality Check
```bash
./.claude/scripts/quality-check.sh
```

**Checks:**
- TypeScript type checking
- ESLint
- Unit tests
- Environment verification

**When to run:**
- Pre-commit hook
- Before pushing code
- Quick validation

---

### 🚀 Deploy Check
```bash
./.claude/scripts/deploy-check.sh
```

**Validates:**
- Git status clean
- On main branch
- Dependencies synced
- Production build succeeds
- Tests pass
- No vulnerabilities
- Environment variables

**When to run:**
- Before production deployment
- Pre-release validation

---

### ⚡ Performance Profile
```bash
./.claude/scripts/perf-profile.sh
```

**Analyzes:**
- Bundle size breakdown
- Dependency analysis
- Code metrics
- Render performance patterns
- Lighthouse scores

**When to run:**
- Performance optimization sessions
- Before/after comparisons
- Monthly performance review

---

### 🔒 Security Scan
```bash
./.claude/scripts/security-scan.sh
```

**Scans for:**
- NPM vulnerabilities
- Hardcoded secrets
- Dangerous functions
- Auth/authz patterns
- Environment security

**When to run:**
- Before each release
- After dependency updates
- Security audit reviews

---

## Best Practices

### 1. Always Use Type Safety
```typescript
// ❌ BAD
const user: any = getData();

// ✅ GOOD
const user: User = getData();
```

### 2. Write Tests First
```typescript
// ✅ GOOD - TDD approach
describe('calculateTotal', () => {
  it('should sum all item prices', () => {
    expect(calculateTotal([...])).toBe(100);
  });
});

// Then implement
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### 3. Error Handling is Mandatory
```typescript
// ❌ BAD
const data = await fetch('/api/users');

// ✅ GOOD
try {
  const data = await fetch('/api/users');
  if (!data.ok) throw new Error(`HTTP ${data.status}`);
  return await data.json();
} catch (error) {
  logger.error('Failed to fetch users', error);
  throw new UserFetchError('Unable to load users', { cause: error });
}
```

### 4. Security First
```typescript
// ❌ BAD - XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ GOOD - Sanitized
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />

// ✅ BETTER - Avoid entirely
<div>{userInput}</div>
```

### 5. Performance Optimization
```typescript
// ❌ BAD - Expensive re-renders
function UserList({ users }) {
  const filtered = users.filter(u => u.active); // Runs every render!
  return <>{filtered.map(u => <User key={u.id} user={u} />)}</>;
}

// ✅ GOOD - Memoized
function UserList({ users }) {
  const filtered = useMemo(
    () => users.filter(u => u.active),
    [users]
  );
  return <>{filtered.map(u => <User key={u.id} user={u} />)}</>;
}
```

---

## Advanced Usage

### Custom Quality Gates

Create a custom script combining multiple checks:

```bash
#!/bin/bash
# .claude/scripts/custom-gate.sh

# Run checks
./.claude/scripts/quality-check.sh || exit 1
./.claude/scripts/security-scan.sh || exit 1

# Custom checks
npm run custom-validation || exit 1

echo "✅ Custom quality gate passed!"
```

### Integration with CI/CD

```yaml
# .github/workflows/claude-devops.yml
name: Claude DevOps Quality Gate

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - name: Full DevOps Audit
        run: ./.claude/scripts/audit.sh
      - name: Security Scan
        run: ./.claude/scripts/security-scan.sh
```

### Daily Automated Reports

```bash
#!/bin/bash
# cron job: 0 9 * * * /path/to/daily-report.sh

cd /path/to/project
./.claude/scripts/audit.sh > /tmp/claude-audit-$(date +%Y%m%d).log 2>&1

# Email report
mail -s "Daily DevOps Audit" team@example.com < /tmp/claude-audit-$(date +%Y%m%d).log
```

---

## Troubleshooting

### Issue: Scripts fail with permission denied
**Solution:**
```bash
chmod +x .claude/scripts/*.sh
```

### Issue: Skill not activating
**Solution:**
1. Check file exists: `.claude/skills/devops.md`
2. Restart Claude Code
3. Use explicit activation: `/skill devops`

### Issue: TypeScript errors after strict config
**Solution:**
This is expected! The strict config catches real issues. Fix them systematically:
```bash
# See all errors
npm run typecheck

# Fix file by file
npm run typecheck -- --noEmit src/components/Button.tsx
```

---

## Tips & Tricks

### 1. Incremental Adoption
Don't enable all checks at once. Start with:
1. TypeScript type checking
2. ESLint
3. Unit tests
4. Then add security, performance, etc.

### 2. Customize for Your Team
Edit scripts to match your standards:
- Adjust coverage thresholds
- Add custom lint rules
- Include team-specific checks

### 3. Documentation is Key
Use the DevOps skill to generate documentation:
```
"Document this API endpoint with maximum technical mastery.
Include: params, responses, examples, error codes, rate limits"
```

### 4. Pair with Learning
Ask Claude to explain best practices:
```
"Explain why useMemo is important here and when I should use it"
```

---

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Performance](https://web.dev/performance/)

---

**Need help? Just ask Claude with DevOps mastery activated!** 🚀
