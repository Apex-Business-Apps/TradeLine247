# Simple script to push current branch - won't close terminal
# Usage: .\push-current-branch.ps1

$ErrorActionPreference = "Continue"

Write-Host "=== Push Current Branch ===" -ForegroundColor Cyan
Write-Host ""

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow
Write-Host ""

# Set remote
Write-Host "Setting remote..." -ForegroundColor Gray
git remote set-url origin https://github.com/Apex-Business-Apps/TradeLine247.git
Write-Host ""

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "Staging uncommitted changes..." -ForegroundColor Gray
    git add -A
    git commit -m "Fix build blockers: path resolution and GitHub Actions updates"
    Write-Host ""
}

# Show commits to push
Write-Host "Checking commits to push..." -ForegroundColor Gray
$commitsAhead = git rev-list --count origin/$currentBranch..HEAD 2>&1
if ($LASTEXITCODE -ne 0) {
    $commitsAhead = git rev-list --count HEAD 2>&1
    Write-Host "Branch doesn't exist on remote. Local commits: $commitsAhead" -ForegroundColor Yellow
} else {
    Write-Host "Commits ahead: $commitsAhead" -ForegroundColor Yellow
}
Write-Host ""

# Push
Write-Host "Pushing to origin/$currentBranch..." -ForegroundColor Yellow
$pushOutput = git push -u origin $currentBranch 2>&1

# Display output
$pushOutput | ForEach-Object { Write-Host $_ }

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓✓✓ SUCCESS! ✓✓✓" -ForegroundColor Green
    Write-Host "PR Link: https://github.com/Apex-Business-Apps/TradeLine247/compare/main...$currentBranch" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Push failed. Check authentication or network." -ForegroundColor Red
}

Write-Host ""
Write-Host "Script complete. Terminal will remain open." -ForegroundColor Green






