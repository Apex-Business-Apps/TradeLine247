# Push wallpaper-rollback-20251208 branch to GitHub
Write-Host "=== Pushing wallpaper-rollback-20251208 branch ===" -ForegroundColor Cyan

# Ensure we're on the correct branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

if ($currentBranch -ne "wallpaper-rollback-20251208") {
    Write-Host "Switching to wallpaper-rollback-20251208 branch..." -ForegroundColor Yellow
    git checkout -b wallpaper-rollback-20251208
}

# Check if there are changes to commit
$status = git status --porcelain
if ($status) {
    Write-Host "`nStaging files..." -ForegroundColor Yellow
    git add src/sections/HeroRoiDuo.tsx src/pages/Index.tsx src/index.css tests/hero-background.spec.ts docs/HERO_BACKGROUND_TESTING_CHECKLIST.md scripts/verify-hero-background.mjs
    
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m "fix(ui): restore hero background responsiveness (wallpaper-rollback-20251208)

- Remove background from #app-home div (scoped to hero only)
- Add responsive Tailwind classes to HeroRoiDuo section
- Fix CSS conflict (remove background: transparent override)
- Add comprehensive test suite and verification scripts
- Preserve overlays, gradients, and all hero content"
    
    Write-Host "Commit created successfully!" -ForegroundColor Green
} else {
    Write-Host "No changes to commit" -ForegroundColor Yellow
}

# Push to remote
Write-Host "`nPushing to origin..." -ForegroundColor Yellow
$pushResult = git push -u origin wallpaper-rollback-20251208 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Branch: wallpaper-rollback-20251208" -ForegroundColor Cyan
    Write-Host "Remote: https://github.com/Apex-Business-Apps/TradeLine247" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Push failed!" -ForegroundColor Red
    Write-Host $pushResult -ForegroundColor Red
    Write-Host "`nExit code: $LASTEXITCODE" -ForegroundColor Red
}

Write-Host "`n=== Done ===" -ForegroundColor Cyan






