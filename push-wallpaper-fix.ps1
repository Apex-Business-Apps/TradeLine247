# Comprehensive Push Script for wallpaper-rollback-20251208
$ErrorActionPreference = 'Stop'

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Push wallpaper-rollback-20251208" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Get current directory
$repoPath = "c:\Users\sinyo\TradeLine24-7\TradeLine247"
Set-Location $repoPath

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Check if branch exists
$branchExists = git branch --list wallpaper-rollback-20251208
if ($branchExists) {
    Write-Host "Branch exists locally" -ForegroundColor Green
    git checkout wallpaper-rollback-20251208
} else {
    Write-Host "Creating branch..." -ForegroundColor Yellow
    git checkout -b wallpaper-rollback-20251208
}

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "`nStaging files..." -ForegroundColor Yellow
    git add src/sections/HeroRoiDuo.tsx
    git add src/pages/Index.tsx
    git add src/index.css
    git add tests/hero-background.spec.ts
    git add docs/HERO_BACKGROUND_TESTING_CHECKLIST.md
    git add scripts/verify-hero-background.mjs
    
    Write-Host "Files staged:" -ForegroundColor Green
    git status --short
    
    Write-Host "`nCommitting..." -ForegroundColor Yellow
    $commitMsg = @"
fix(ui): restore hero background responsiveness (wallpaper-rollback-20251208)

- Remove background from #app-home div (scoped to hero only)
- Add responsive Tailwind classes to HeroRoiDuo section
- Fix CSS conflict (remove background: transparent override)
- Add comprehensive test suite and verification scripts
- Preserve overlays, gradients, and all hero content
"@
    git commit -m $commitMsg
    
    Write-Host "Commit created!" -ForegroundColor Green
    git log -1 --oneline
} else {
    Write-Host "No uncommitted changes" -ForegroundColor Yellow
    $lastCommit = git log -1 --oneline
    Write-Host "Last commit: $lastCommit" -ForegroundColor Cyan
}

# Check if branch exists on remote
Write-Host "`nChecking remote..." -ForegroundColor Yellow
$remoteBranch = git ls-remote --heads origin wallpaper-rollback-20251208 2>&1

if ($remoteBranch) {
    Write-Host "Branch exists on remote" -ForegroundColor Green
} else {
    Write-Host "Branch does NOT exist on remote - will push" -ForegroundColor Yellow
}

# Push to remote
Write-Host "`nPushing to origin..." -ForegroundColor Yellow
try {
    $pushOutput = git push -u origin wallpaper-rollback-20251208 2>&1 | Out-String
    Write-Host $pushOutput
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ SUCCESS! Branch pushed to GitHub" -ForegroundColor Green
        Write-Host "`nCreate PR at:" -ForegroundColor Cyan
        Write-Host "https://github.com/Apex-Business-Apps/TradeLine247/compare/main...wallpaper-rollback-20251208" -ForegroundColor White -BackgroundColor DarkBlue
    } else {
        Write-Host "`n❌ Push failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Output: $pushOutput" -ForegroundColor Red
    }
} catch {
    Write-Host "`n❌ Error during push:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Done" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

