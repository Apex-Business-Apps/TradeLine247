# Fix Branch History - Rebase feature branch onto main
# This will make the branch comparable with main

$ErrorActionPreference = "Continue"

Write-Host "=== Fix Branch History ===" -ForegroundColor Cyan
Write-Host ""

# Get current branch
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $branch" -ForegroundColor Yellow
Write-Host ""

# Fetch latest main
Write-Host "[1] Fetching latest from origin..." -ForegroundColor Yellow
git fetch origin main
Write-Host "✓ Fetched" -ForegroundColor Green
Write-Host ""

# Check if we can find common ancestor
Write-Host "[2] Checking branch relationship..." -ForegroundColor Yellow
$mergeBase = git merge-base origin/main $branch 2>&1
if ($LASTEXITCODE -eq 0 -and $mergeBase) {
    Write-Host "Common ancestor found: $($mergeBase.Substring(0,7))" -ForegroundColor Green
} else {
    Write-Host "WARNING: No common ancestor found - branches have diverged" -ForegroundColor Yellow
    Write-Host "Will create new branch from main with your changes" -ForegroundColor Gray
}
Write-Host ""

# Show commits that would be rebased
Write-Host "[3] Commits in your branch:" -ForegroundColor Yellow
$commits = git log --oneline origin/main..$branch 2>&1
if ($commits) {
    $commits | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "  No unique commits found" -ForegroundColor Yellow
}
Write-Host ""

# Option: Create new branch from main
Write-Host "[4] Creating new branch from main with your fixes..." -ForegroundColor Yellow
$newBranch = "fix/build-blockers-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "New branch name: $newBranch" -ForegroundColor Cyan

# Checkout main
git checkout main
git pull origin main

# Create new branch
git checkout -b $newBranch

# Cherry-pick or apply changes
Write-Host "Applying your fixes..." -ForegroundColor Gray

# Copy the fixed files
$files = @(
    "scripts/production-rubric.mjs",
    "scripts/check-required-files.mjs",
    ".github/workflows/ci.yml",
    ".github/workflows/ios-build.yml",
    ".github/workflows/app-deploy.yml"
)

foreach ($file in $files) {
    if (Test-Path "../$branch/$file") {
        Copy-Item "../$branch/$file" $file -Force
        Write-Host "  Copied $file" -ForegroundColor Gray
    }
}

# Stage and commit
git add -A
git commit -m "Fix build blockers: path resolution and GitHub Actions updates"

Write-Host "✓ New branch created: $newBranch" -ForegroundColor Green
Write-Host ""

# Push new branch
Write-Host "[5] Pushing new branch..." -ForegroundColor Yellow
git push -u origin $newBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓✓✓ SUCCESS! ✓✓✓" -ForegroundColor Green
    Write-Host "PR Link: https://github.com/Apex-Business-Apps/TradeLine247/compare/main...$newBranch" -ForegroundColor Cyan
} else {
    Write-Host "Push failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Complete ===" -ForegroundColor Cyan




