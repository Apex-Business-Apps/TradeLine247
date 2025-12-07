# Verify Push Status Script
# This script checks if commits were pushed and writes results to a file

$output = @()
$output += "=== Git Push Verification ==="
$output += "Time: $(Get-Date)"
$output += ""

# Current branch
$branch = git rev-parse --abbrev-ref HEAD 2>&1
$output += "Current Branch: $branch"
$output += ""

# Check if files exist
$files = @(
    "scripts/production-rubric.mjs",
    "scripts/check-required-files.mjs",
    ".github/workflows/ci.yml",
    ".github/workflows/ios-build.yml",
    ".github/workflows/app-deploy.yml"
)

$output += "File Status:"
foreach ($file in $files) {
    $exists = Test-Path $file
    $tracked = git ls-files $file 2>&1
    $output += "  $file : Exists=$exists, Tracked=$($tracked -ne '')"
}
$output += ""

# Check commits
$output += "Recent Commits:"
$commits = git log --oneline -5 2>&1
$output += $commits
$output += ""

# Check if branch exists on remote
$output += "Remote Branch Check:"
$remoteBranch = git ls-remote --heads origin $branch 2>&1
if ($remoteBranch) {
    $output += "  Branch EXISTS on remote: $remoteBranch"
} else {
    $output += "  Branch DOES NOT exist on remote"
}
$output += ""

# Check commits ahead
$output += "Commits Ahead of Remote:"
$commitsAhead = git rev-list --count origin/$branch..HEAD 2>&1
if ($LASTEXITCODE -ne 0) {
    $output += "  Cannot compare (branch may not exist on remote)"
    $localCommits = git rev-list --count HEAD 2>&1
    $output += "  Local commits: $localCommits"
} else {
    $output += "  Commits ahead: $commitsAhead"
}
$output += ""

# Check workflow versions
$output += "GitHub Actions Versions:"
$ciCheckout = Select-String -Path ".github/workflows/ci.yml" -Pattern "checkout@v" | Select-Object -First 1
$output += "  CI workflow: $($ciCheckout.Line)"
$iosCheckout = Select-String -Path ".github/workflows/ios-build.yml" -Pattern "checkout@v" | Select-Object -First 1
$output += "  iOS workflow: $($iosCheckout.Line)"
$output += ""

# Write to file
$output | Out-File -FilePath "push-verification.txt" -Encoding UTF8

# Also display
$output | Write-Host

Write-Host ""
Write-Host "Results saved to: push-verification.txt" -ForegroundColor Cyan
