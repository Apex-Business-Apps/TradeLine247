# Check if commits were pushed
$output = @()

$output += "=== Git Push Status Check ==="
$output += "Time: $(Get-Date)"
$output += ""

# Current branch
$branch = git rev-parse --abbrev-ref HEAD
$output += "Current Branch: $branch"
$output += ""

# Check if branch exists on remote
$remoteBranches = git ls-remote --heads origin 2>&1 | Out-String
$output += "Remote branches found:"
$output += $remoteBranches
$output += ""

# Check commits ahead
$commitsAhead = git rev-list --count origin/$branch..HEAD 2>&1
if ($LASTEXITCODE -ne 0) {
    $output += "Branch '$branch' does NOT exist on remote (needs push)"
    $output += "Local commits: $(git rev-list --count HEAD 2>&1)"
} else {
    if ($commitsAhead -eq 0) {
        $output += "✓ All commits pushed! (0 commits ahead)"
    } else {
        $output += "⚠ Still $commitsAhead commits ahead of remote"
    }
}
$output += ""

# Last 5 commits
$output += "Last 5 commits:"
git log --oneline -5 2>&1 | ForEach-Object { $output += "  $_" }
$output += ""

# Status
$status = git status --short 2>&1 | Out-String
if ($status.Trim()) {
    $output += "Uncommitted changes:"
    $output += $status
} else {
    $output += "✓ No uncommitted changes"
}

# Write to file
$output | Out-File -FilePath "push-status-check.txt" -Encoding UTF8

# Display
$output | Write-Host

Write-Host ""
Write-Host "Full report saved to: push-status-check.txt" -ForegroundColor Cyan


