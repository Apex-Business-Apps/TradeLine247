#!/usr/bin/env pwsh
# Quick test script - minimal version
Write-Host "`n=== QUICK HEADER TEST ===" -ForegroundColor Cyan
npm run build && npx playwright install chromium && npx playwright test tests/e2e/header-position.spec.ts --reporter=list
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ TESTS PASSED - Ready to commit`n" -ForegroundColor Green
} else {
    Write-Host "`n✗ TESTS FAILED - Fix issues before committing`n" -ForegroundColor Red
    exit 1
}
