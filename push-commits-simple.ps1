# Simple PowerShell Script to Push All Commits
# Run: .\push-commits-simple.ps1

$ErrorActionPreference = "Continue"
$output = @()

$output += "=== Starting Git Push Script ==="
$output += "Time: $(Get-Date)"
$output += ""

# Set remote
$output += "[1] Setting remote URL..."
git remote set-url origin https://github.com/Apex-Business-Apps/TradeLine247.git
$output += "Remote set"
$output += ""

# Check branch
$output += "[2] Checking branch..."
$branch = "fix/build-blockers-20251207"
$currentBranch = git rev-parse --abbrev-ref HEAD
$output += "Current: $currentBranch"
$output += "Target: $branch"

if ($currentBranch -ne $branch) {
    git checkout -b $branch 2>&1 | Out-String
    $output += "Created/switched to $branch"
}
$output += ""

# Stage all
$output += "[3] Staging files..."
git add -A
$output += "Files staged"
$output += ""

# Commit
$output += "[4] Committing..."
$commitResult = git commit -m "Fix build blockers: path resolution and GitHub Actions updates" 2>&1 | Out-String
$output += $commitResult
$output += ""

# Push
$output += "[5] Pushing to remote..."
$pushResult = git push -u origin $branch 2>&1 | Out-String
$output += $pushResult
$output += ""

# Final status
$output += "[6] Final status..."
$status = git status --short 2>&1 | Out-String
$output += $status
$output += ""

$output += "=== Script Complete ==="

# Write to file
$output | Out-File -FilePath "push-output.txt" -Encoding UTF8

# Also display
$output | Write-Host

Write-Host ""
Write-Host "Output also saved to: push-output.txt" -ForegroundColor Cyan
Write-Host "PR Link: https://github.com/Apex-Business-Apps/TradeLine247/compare/main...$branch" -ForegroundColor Green






