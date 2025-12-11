# Quick Push Script for TradeLine247
# Run: powershell -ExecutionPolicy Bypass -File quick-push.ps1

Write-Host "=== Quick Push Script ===" -ForegroundColor Cyan

# Set remote
Write-Host "Setting remote..." -ForegroundColor Yellow
git remote set-url origin https://github.com/Apex-Business-Apps/TradeLine247.git

# Branch name
$branch = "fix/build-blockers-20251207"

# Create branch if needed
Write-Host "Checking branch..." -ForegroundColor Yellow
$current = git rev-parse --abbrev-ref HEAD
if ($current -ne $branch) {
    git checkout -b $branch
}

# Stage and commit
Write-Host "Staging and committing..." -ForegroundColor Yellow
git add -A
git commit -m "Fix build blockers: path resolution and GitHub Actions updates" 2>&1

# Push
Write-Host "Pushing..." -ForegroundColor Yellow
git push -u origin $branch 2>&1

Write-Host ""
Write-Host "Done! Check: https://github.com/Apex-Business-Apps/TradeLine247" -ForegroundColor Green







