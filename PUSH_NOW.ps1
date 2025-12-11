# Simple push script - run this manually
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pushing wallpaper-rollback-20251208" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location "c:\Users\sinyo\TradeLine24-7\TradeLine247"

# Ensure we're on main first
Write-Host "`n1. Checking out main..." -ForegroundColor Yellow
git checkout main
git pull origin main

# Create branch
Write-Host "`n2. Creating branch..." -ForegroundColor Yellow
git checkout -b wallpaper-rollback-20251208

# Stage files
Write-Host "`n3. Staging files..." -ForegroundColor Yellow
git add src/sections/HeroRoiDuo.tsx
git add src/pages/Index.tsx
git add src/index.css
git add .gitignore
git add tests/hero-background.spec.ts
git add docs/HERO_BACKGROUND_TESTING_CHECKLIST.md
git add scripts/verify-hero-background.mjs

# Show what will be committed
Write-Host "`n4. Files to commit:" -ForegroundColor Yellow
git status --short

# Commit
Write-Host "`n5. Committing..." -ForegroundColor Yellow
git commit -m "fix(ui): restore hero background responsiveness (wallpaper-rollback-20251208)

- Remove background from #app-home div (scoped to hero only)
- Add responsive Tailwind classes to HeroRoiDuo section
- Fix CSS conflict (remove background: transparent override)
- Add comprehensive test suite and verification scripts
- Preserve overlays, gradients, and all hero content"

# Show commit
Write-Host "`n6. Commit created:" -ForegroundColor Green
git log -1 --oneline

# Push
Write-Host "`n7. Pushing to GitHub..." -ForegroundColor Yellow
$result = git push -u origin wallpaper-rollback-20251208 2>&1
Write-Host $result

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS! Branch pushed!" -ForegroundColor Green
    Write-Host "`nCreate PR at:" -ForegroundColor Cyan
    Write-Host "https://github.com/Apex-Business-Apps/TradeLine247/compare/main...wallpaper-rollback-20251208" -ForegroundColor White
} else {
    Write-Host "`n❌ Push failed. Exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Error: $result" -ForegroundColor Red
}
