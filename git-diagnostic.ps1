# Git Diagnostic Script
$output = @()

$output += "=== Git Diagnostic Report ==="
$output += "Date: $(Get-Date)"
$output += ""

# Check git version
try {
    $gitVersion = git --version 2>&1 | Out-String
    $output += "Git Version: $gitVersion"
} catch {
    $output += "Git Version: ERROR - $($_.Exception.Message)"
}

$output += ""

# Check current branch
try {
    $branch = git rev-parse --abbrev-ref HEAD 2>&1 | Out-String
    $output += "Current Branch: $branch"
} catch {
    $output += "Current Branch: ERROR - $($_.Exception.Message)"
}

$output += ""

# Check git status
try {
    $status = git status --porcelain 2>&1 | Out-String
    $output += "Git Status (porcelain):"
    $output += $status
} catch {
    $output += "Git Status: ERROR - $($_.Exception.Message)"
}

$output += ""

# Check last commit
try {
    $lastCommit = git log -1 --pretty=format:"%h %s" HEAD 2>&1 | Out-String
    $output += "Last Commit: $lastCommit"
} catch {
    $output += "Last Commit: ERROR - $($_.Exception.Message)"
}

$output += ""

# Check remote
try {
    $remote = git remote get-url origin 2>&1 | Out-String
    $output += "Remote URL: $remote"
} catch {
    $output += "Remote URL: ERROR - $($_.Exception.Message)"
}

$output += ""

# Check if files are tracked
try {
    $productionRubric = git ls-files scripts/production-rubric.mjs 2>&1 | Out-String
    $output += "production-rubric.mjs tracked: $productionRubric"
} catch {
    $output += "production-rubric.mjs tracked: NOT TRACKED"
}

$output += ""

# Check uncommitted changes
try {
    $uncommitted = git diff --name-only 2>&1 | Out-String
    $output += "Uncommitted changes:"
    $output += $uncommitted
} catch {
    $output += "Uncommitted changes: ERROR"
}

$output += ""

# Try to push and capture output
try {
    $output += "=== Attempting Push ==="
    $pushOutput = git push origin HEAD 2>&1 | Out-String
    $output += $pushOutput
} catch {
    $output += "Push Error: $($_.Exception.Message)"
}

# Write to file
$output | Out-File -FilePath "git-diagnostic-output.txt" -Encoding UTF8
Write-Output "Diagnostic complete. Check git-diagnostic-output.txt"
