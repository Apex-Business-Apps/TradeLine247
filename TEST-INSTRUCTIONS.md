# Header Fix Testing Instructions

## Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.0.0 or higher
- **PowerShell** 5.1+ (Windows PowerShell) or PowerShell Core 7+ (cross-platform)

## Quick Test (Recommended)

**PowerShell:**
```powershell
.\quick-test.ps1
```

**PowerShell Core (Windows/Mac/Linux):**
```pwsh
pwsh quick-test.ps1
```

**If execution policy blocks scripts:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\quick-test.ps1
```

---

## Comprehensive Test (Full Validation)

**PowerShell:**
```powershell
.\test-header-fixes.ps1
```

**PowerShell Core:**
```pwsh
pwsh test-header-fixes.ps1
```

This script includes:
1. ✓ Prerequisites check (Node.js, npm, git)
2. ✓ Dependency installation/update
3. ✓ Playwright browser installation
4. ✓ Production build
5. ✓ Header position tests (360/768/1024px)
6. ✓ Sanity E2E tests
7. ✓ Visual verification checklist
8. ✓ Summary with timing

---

## Manual Test Commands

If you prefer to run commands individually:

### 1. Install dependencies
```powershell
npm ci
```

### 2. Install Playwright browsers
```powershell
npx playwright install chromium
```

### 3. Build project
```powershell
npm run build
```

### 4. Run header tests
```powershell
npx playwright test tests/e2e/header-position.spec.ts --reporter=list
```

### 5. Run with HTML report (detailed debugging)
```powershell
npx playwright test tests/e2e/header-position.spec.ts --reporter=html
npx playwright show-report
```

---

## Visual Testing (Required)

After automated tests pass, manually verify:

### Start dev server:
```powershell
npm run dev
```

### Test in browser at these viewport widths:
- **360px** (mobile)
- **768px** (tablet)
- **1024px** (desktop)

### Chrome DevTools:
1. Press `F12` to open DevTools
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Set viewport to 360px, 768px, 1024px
4. Inspect element `#app-header-left`

### Verify:
- [ ] Left section (Home + Badge) flush-left (≤16px from edge)
- [ ] No overlap between left and right controls
- [ ] All buttons 44px+ touch target size
- [ ] Only ONE Sign Out button visible (in dropdown)
- [ ] Active nav link has `aria-current="page"`

---

## Troubleshooting

### "Execution policy error"
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### "Playwright browsers not found"
```powershell
npx playwright install --force chromium
```

### "Port already in use"
Kill existing processes on port 5173/4173:
```powershell
# Find process
netstat -ano | findstr :5173

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Tests timeout
Increase timeout in `tests/e2e/header-position.spec.ts`:
```typescript
await expect(headerLeft).toBeVisible({ timeout: 30000 }); // 30s
```

### Build fails
```powershell
# Clean and reinstall
Remove-Item -Recurse -Force node_modules, dist
npm ci
npm run build
```

---

## Expected Test Output

### ✅ SUCCESS:
```
✓ header left elements should be positioned near left edge at 360px width
✓ header left elements should be positioned near left edge at 768px width
✓ header left elements should be positioned near left edge at 1024px width

3 passed (10.5s)
```

### ❌ FAILURE Examples:

**Positioning failure:**
```
✗ header left elements should be positioned near left edge at 360px width
  expect(received).toBeLessThanOrEqual(expected)
  Expected: <= 32
  Received: 48
```
→ Left container not flush-left. Check `ml-0` class.

**Element not found:**
```
✗ header left elements should be positioned near left edge at 360px width
  Locator('#app-header-left').toBeVisible() timeout exceeded
```
→ Element ID missing or incorrect.

---

## Commit Workflow (After Tests Pass)

```powershell
# 1. Check status
git status

# 2. Review changes
git diff src/components/layout/Header.tsx

# 3. Stage changes
git add src/components/layout/Header.tsx

# 4. Commit
git commit -m "fix(header): production-ready positioning and a11y"

# 5. Push
git push -u origin claude/audit-prod-readiness-header-011CUqFQVq13sHM9eiq6ohsN
```

---

## CI/CD Pipeline

After pushing, GitHub Actions will run:
- ✓ `npm ci`
- ✓ `npm run build`
- ✓ `npx playwright test` (all E2E tests)
- ✓ Deployment checks

Monitor: https://github.com/apexbusiness-systems/tradeline247aicom/actions

---

## Rollback Plan

If issues arise after merge:
```powershell
git revert <commit-hash>
git push
```

Current commits:
- `263dab1` - Initial header fixes
- `1c6eae5` - aria-current fix

---

**Questions?** Check the full audit report in commit message or contact the team.
