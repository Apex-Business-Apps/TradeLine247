# Set Remote and Push Script
# This script sets the remote URL and pushes your current branch

$ErrorActionPreference = "Continue"

Write-Host "=== Set Remote and Push ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set remote URL
Write-Host "[1] Setting remote to TradeLine247..." -ForegroundColor Yellow
git remote set-url origin https://github.com/Apex-Business-Apps/TradeLine247.git

# Verify remote
$remote = git remote get-url origin
Write-Host "Remote set to: $remote" -ForegroundColor Green
Write-Host ""

# Step 2: Get current branch
$branch = git rev-parse --abbrev-ref HEAD
Write-Host "[2] Current branch: $branch" -ForegroundColor Yellow
Write-Host ""

# Step 3: Stage all changes
Write-Host "[3] Staging all changes..." -ForegroundColor Yellow
git add -A
Write-Host "✓ Files staged" -ForegroundColor Green
Write-Host ""

# Step 4: Commit (if there are changes)
$status = git status --porcelain
if ($status) {
    Write-Host "[4] Committing changes..." -ForegroundColor Yellow
    git commit -m "Fix build blockers: path resolution and GitHub Actions updates"
    Write-Host "✓ Changes committed" -ForegroundColor Green
} else {
    Write-Host "[4] No uncommitted changes" -ForegroundColor Gray
}
Write-Host ""

# Step 5: Push
Write-Host "[5] Pushing to origin/$branch..." -ForegroundColor Yellow
$pushResult = git push -u origin $branch 2>&1

# Show push output
$pushResult | ForEach-Object { Write-Host $_ }

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓✓✓ SUCCESS! Branch pushed! ✓✓✓" -ForegroundColor Green
    Write-Host ""
    Write-Host "Create PR at:" -ForegroundColor Cyan
    Write-Host "https://github.com/Apex-Business-Apps/TradeLine247/compare/main...$branch" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Push failed. Exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Check authentication: gh auth login" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Complete ===" -ForegroundColor Cyan
