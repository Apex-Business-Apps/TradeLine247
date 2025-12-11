# PowerShell Script to Push All Commits to TradeLine247 Repository
# Usage: .\push-all-commits.ps1 [branch-name]

param(
    [string]$BranchName = "fix/build-blockers-20251207"
)

# Set error handling - Continue on errors to prevent terminal closure
$ErrorActionPreference = "Continue"

Write-Host "=== TradeLine247 Git Push Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify we're in a git repository
Write-Host "[1/7] Verifying git repository..." -ForegroundColor Yellow
if (-not (Test-Path .git)) {
    Write-Host "ERROR: Not in a git repository!" -ForegroundColor Red
    Write-Host "Press any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    return
}
Write-Host "✓ Git repository found" -ForegroundColor Green
Write-Host ""

# Step 2: Set remote URL
Write-Host "[2/7] Configuring remote repository..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/Apex-Business-Apps/TradeLine247.git"
try {
    $currentRemote = git remote get-url origin 2>&1
    if ($LASTEXITCODE -ne 0 -or $currentRemote -notmatch "TradeLine247") {
        Write-Host "Setting remote URL to: $remoteUrl" -ForegroundColor Gray
        git remote set-url origin $remoteUrl
        if ($LASTEXITCODE -ne 0) {
            git remote add origin $remoteUrl
        }
    } else {
        Write-Host "Remote already configured: $currentRemote" -ForegroundColor Gray
    }
    Write-Host "✓ Remote configured" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to configure remote - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Press any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    return
}
Write-Host ""

# Step 3: Check current branch
Write-Host "[3/7] Checking current branch..." -ForegroundColor Yellow
$currentBranch = git rev-parse --abbrev-ref HEAD 2>&1
Write-Host "Current branch: $currentBranch" -ForegroundColor Gray

# Create or switch to target branch
if ($currentBranch -ne $BranchName) {
    Write-Host "Switching to branch: $BranchName" -ForegroundColor Gray
    $branchExists = git branch --list $BranchName 2>&1
    if ($branchExists) {
        git checkout $BranchName
    } else {
        git checkout -b $BranchName
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to switch/create branch" -ForegroundColor Red
        Write-Host "Press any key to continue..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }
    Write-Host "✓ Switched to branch: $BranchName" -ForegroundColor Green
} else {
    Write-Host "✓ Already on branch: $BranchName" -ForegroundColor Green
}
Write-Host ""

# Step 4: Check for uncommitted changes
Write-Host "[4/7] Checking for uncommitted changes..." -ForegroundColor Yellow
$status = git status --porcelain 2>&1
if ($status) {
    Write-Host "Found uncommitted changes:" -ForegroundColor Gray
    $status | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    
    # Stage all changes
    Write-Host "Staging all changes..." -ForegroundColor Gray
    git add -A
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to stage changes" -ForegroundColor Red
        Write-Host "Press any key to continue..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }
    
    # Commit changes
    Write-Host "Committing changes..." -ForegroundColor Gray
    $commitMessage = "Fix build blockers: path resolution and GitHub Actions updates"
    git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Commit failed or nothing to commit" -ForegroundColor Yellow
    } else {
        Write-Host "✓ Changes committed" -ForegroundColor Green
    }
} else {
    Write-Host "✓ No uncommitted changes" -ForegroundColor Green
}
Write-Host ""

# Step 5: Show commits to be pushed
Write-Host "[5/7] Checking commits to push..." -ForegroundColor Yellow
$commitsAhead = git rev-list --count origin/$BranchName..HEAD 2>&1
if ($LASTEXITCODE -ne 0) {
    # Branch doesn't exist on remote yet
    $commitsAhead = git rev-list --count HEAD 2>&1
    Write-Host "Branch doesn't exist on remote. Local commits: $commitsAhead" -ForegroundColor Gray
} else {
    Write-Host "Commits ahead of remote: $commitsAhead" -ForegroundColor Gray
}

if ($commitsAhead -eq 0) {
    Write-Host "No commits to push" -ForegroundColor Yellow
} else {
    Write-Host "Commits to push:" -ForegroundColor Gray
    git log origin/$BranchName..HEAD --oneline 2>&1 | ForEach-Object {
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
}
Write-Host ""

# Step 6: Fetch latest from remote
Write-Host "[6/7] Fetching latest from remote..." -ForegroundColor Yellow
git fetch origin
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Fetch failed, continuing anyway..." -ForegroundColor Yellow
} else {
    Write-Host "✓ Fetched latest changes" -ForegroundColor Green
}
Write-Host ""

# Step 7: Push to remote
Write-Host "[7/7] Pushing to remote..." -ForegroundColor Yellow
Write-Host "Pushing branch '$BranchName' to origin..." -ForegroundColor Gray

try {
    git push -u origin $BranchName 2>&1 | ForEach-Object {
        Write-Host $_ -ForegroundColor Gray
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓✓✓ SUCCESS: All commits pushed! ✓✓✓" -ForegroundColor Green
        Write-Host ""
        Write-Host "Repository: https://github.com/Apex-Business-Apps/TradeLine247" -ForegroundColor Cyan
        Write-Host "Branch: $BranchName" -ForegroundColor Cyan
        Write-Host "Create PR: https://github.com/Apex-Business-Apps/TradeLine247/compare/main...$BranchName" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "ERROR: Push failed!" -ForegroundColor Red
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  1. Authentication required - run: gh auth login" -ForegroundColor Gray
        Write-Host "  2. Branch protection - check repository settings" -ForegroundColor Gray
        Write-Host "  3. Network issues - check internet connection" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Push exception - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    return
}

Write-Host ""
Write-Host "=== Script Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


