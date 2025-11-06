# 🧪 RUN HEADER TESTS - COPY/PASTE COMMANDS

## OPTION 1: PowerShell Script (Recommended)

Open PowerShell in the project directory and run:

```powershell
# If you get execution policy error, run this first:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Then run the test script:
.\test-header-fixes.ps1
```

**OR** for quick test only:
```powershell
.\quick-test.ps1
```

---

## OPTION 2: One-Liner (No Script Files)

Copy/paste this entire command into PowerShell:

```powershell
npm ci; if ($LASTEXITCODE -ne 0) { exit 1 }; npm run build; if ($LASTEXITCODE -ne 0) { exit 1 }; npx playwright install chromium; npx playwright test tests/e2e/header-position.spec.ts --reporter=list; if ($LASTEXITCODE -eq 0) { Write-Host "`n✓ TESTS PASSED" -ForegroundColor Green } else { Write-Host "`n✗ TESTS FAILED" -ForegroundColor Red; exit 1 }
```

---

## OPTION 3: Step-by-Step (Manual)

Run each command separately:

```powershell
# 1. Install dependencies
npm ci

# 2. Build
npm run build

# 3. Install Playwright browser
npx playwright install chromium

# 4. Run header tests
npx playwright test tests/e2e/header-position.spec.ts --reporter=list
```

---

## WHAT THE TESTS CHECK

✓ Header `#app-header-left` positioned ≤32px from left edge  
✓ Tests at 360px (mobile), 768px (tablet), 1024px (desktop)  
✓ No overlap between left and right controls  
✓ No duplicate Sign Out buttons  
✓ Build completes successfully  

---

## EXPECTED OUTPUT (SUCCESS)

```
Running 3 tests using 3 workers

  ✓ [chromium] › header-position.spec.ts:7:5 › Header Position › 360px width
  ✓ [chromium] › header-position.spec.ts:7:5 › Header Position › 768px width  
  ✓ [chromium] › header-position.spec.ts:7:5 › Header Position › 1024px width

3 passed (10.5s)

✓ TESTS PASSED
```

---

## IF TESTS FAIL

1. Check error message - it will show which viewport failed and the measured position
2. Verify you're on the correct branch: `claude/audit-prod-readiness-header-011CUqFQVq13sHM9eiq6ohsN`
3. Ensure you pulled the latest changes: `git pull origin <branch>`
4. Try clearing node_modules: `Remove-Item -Recurse -Force node_modules; npm ci`
5. Check Playwright browsers: `npx playwright install --force chromium`

---

## AFTER TESTS PASS

Review and commit:

```powershell
git status
git diff src/components/layout/Header.tsx
git add src/components/layout/Header.tsx
git commit -m "fix(header): production-ready positioning and a11y"
git push -u origin claude/audit-prod-readiness-header-011CUqFQVq13sHM9eiq6ohsN
```

---

**IMPORTANT:** These changes are already committed to the branch. You're testing to VERIFY the fixes work before merging.

Current commits on branch:
- `263dab1` - Initial header fixes (positioning, dedup, isolate)
- `1c6eae5` - aria-current implementation fix

