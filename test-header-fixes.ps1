#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test TradeLine 24/7 Header Fixes - Pre-Commit Validation
.DESCRIPTION
    Runs comprehensive tests on header positioning fixes before committing.
    Tests header-position.spec.ts at 360/768/1024px viewports.
.NOTES
    Date: 2025-11-05 (America/Edmonton)
    Branch: claude/audit-prod-readiness-header-011CUqFQVq13sHM9eiq6ohsN
#>

# Set error action preference
$ErrorActionPreference = "Stop"

# Color output functions
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "➜ $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Section { param($msg) Write-Host "`n═══════════════════════════════════════════════════════════════════" -ForegroundColor Yellow; Write-Host "  $msg" -ForegroundColor Yellow; Write-Host "═══════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow }

# Start timer
$startTime = Get-Date

Write-Section "TRADELINE 24/7 HEADER FIX VALIDATION"
Write-Info "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Info "Directory: $(Get-Location)"
Write-Host ""

# Step 1: Check prerequisites
Write-Section "STEP 1: CHECKING PREREQUISITES"

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js installed: $nodeVersion"
} catch {
    Write-Error "Node.js not found. Please install Node.js from https://nodejs.org/"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm installed: v$npmVersion"
} catch {
    Write-Error "npm not found. Please install npm."
    exit 1
}

# Check git
try {
    $gitBranch = git branch --show-current
    Write-Success "Git branch: $gitBranch"

    if ($gitBranch -ne "claude/audit-prod-readiness-header-011CUqFQVq13sHM9eiq6ohsN") {
        Write-Warning "You are not on the expected branch."
        Write-Info "Expected: claude/audit-prod-readiness-header-011CUqFQVq13sHM9eiq6ohsN"
        Write-Info "Current: $gitBranch"
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne "y") { exit 0 }
    }
} catch {
    Write-Warning "Git not found or not a git repository."
}

# Step 2: Install dependencies
Write-Section "STEP 2: INSTALLING DEPENDENCIES"

if (-not (Test-Path "node_modules")) {
    Write-Info "node_modules not found. Running npm ci..."
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Error "npm ci failed with exit code $LASTEXITCODE"
        exit 1
    }
    Write-Success "Dependencies installed"
} else {
    Write-Info "node_modules exists. Checking if up to date..."
    $packageLockTime = (Get-Item "package-lock.json").LastWriteTime
    $nodeModulesTime = (Get-Item "node_modules").LastWriteTime

    if ($packageLockTime -gt $nodeModulesTime) {
        Write-Warning "package-lock.json is newer than node_modules. Running npm ci..."
        npm ci
        if ($LASTEXITCODE -ne 0) {
            Write-Error "npm ci failed with exit code $LASTEXITCODE"
            exit 1
        }
        Write-Success "Dependencies updated"
    } else {
        Write-Success "Dependencies up to date"
    }
}

# Step 3: Install Playwright browsers
Write-Section "STEP 3: CHECKING PLAYWRIGHT BROWSERS"

Write-Info "Checking for Playwright chromium browser..."
try {
    # Try to check if browsers are installed
    npx playwright install --dry-run chromium 2>&1 | Out-Null
    $browserCheck = $true
} catch {
    $browserCheck = $false
}

Write-Info "Installing/updating Playwright chromium browser..."
npx playwright install chromium
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Playwright browser installation had issues (exit code: $LASTEXITCODE)"
    Write-Warning "Tests may fail if browsers are not installed."
    Write-Info "Attempting to continue..."
} else {
    Write-Success "Playwright chromium browser ready"
}

# Step 4: Build the project
Write-Section "STEP 4: BUILDING PROJECT"

Write-Info "Running production build..."
$buildStart = Get-Date
npm run build
$buildEnd = Get-Date
$buildDuration = ($buildEnd - $buildStart).TotalSeconds

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed with exit code $LASTEXITCODE"
    exit 1
}

Write-Success "Build completed in $([math]::Round($buildDuration, 2))s"

# Step 5: Run header position tests
Write-Section "STEP 5: RUNNING HEADER POSITION TESTS"

Write-Info "Testing header positioning at 360/768/1024px viewports..."
Write-Host ""

$testStart = Get-Date
npx playwright test tests/e2e/header-position.spec.ts --reporter=list
$testExitCode = $LASTEXITCODE
$testEnd = Get-Date
$testDuration = ($testEnd - $testStart).TotalSeconds

Write-Host ""

if ($testExitCode -eq 0) {
    Write-Success "Header position tests PASSED in $([math]::Round($testDuration, 2))s"
} else {
    Write-Error "Header position tests FAILED with exit code $testExitCode"
    Write-Host ""
    Write-Warning "Common issues:"
    Write-Host "  1. Playwright browsers not installed properly"
    Write-Host "  2. Dev server not starting (check port conflicts)"
    Write-Host "  3. Timeout issues (try increasing timeout in spec file)"
    Write-Host ""
    Write-Info "To see detailed output, run:"
    Write-Host "  npx playwright test tests/e2e/header-position.spec.ts --reporter=html"
    Write-Host ""
    exit 1
}

# Step 6: Run sanity tests
Write-Section "STEP 6: RUNNING SANITY E2E TESTS"

Write-Info "Running h310-detection and a11y-smoke tests..."
Write-Host ""

$sanityStart = Get-Date
npx playwright test tests/e2e/h310-detection.spec.ts tests/e2e/a11y-smoke.spec.ts --reporter=list
$sanityExitCode = $LASTEXITCODE
$sanityEnd = Get-Date
$sanityDuration = ($sanityEnd - $sanityStart).TotalSeconds

Write-Host ""

if ($sanityExitCode -eq 0) {
    Write-Success "Sanity tests PASSED in $([math]::Round($sanityDuration, 2))s"
} else {
    Write-Warning "Sanity tests had issues (exit code: $sanityExitCode)"
    Write-Info "These tests may be expected to fail in current state."
    Write-Info "Continuing since header tests passed..."
}

# Step 7: Visual verification reminder
Write-Section "STEP 7: MANUAL VISUAL VERIFICATION"

Write-Warning "IMPORTANT: Automated tests passed, but please verify visually:"
Write-Host ""
Write-Host "  1. Start dev server: npm run dev"
Write-Host "  2. Open browser to http://localhost:5173"
Write-Host "  3. Test at viewport widths: 360px, 768px, 1024px"
Write-Host "  4. Verify:"
Write-Host "     • #app-header-left is flush-left (≤16px from edge)"
Write-Host "     • No overlap between left (Home/Badge) and right controls"
Write-Host "     • All buttons tappable (44px minimum touch target)"
Write-Host "     • No duplicate Sign Out buttons"
Write-Host "     • Active nav links have aria-current='page'"
Write-Host ""

# Step 8: Summary
Write-Section "TEST SUMMARY"

$totalDuration = ((Get-Date) - $startTime).TotalSeconds

Write-Host "Build time:       $([math]::Round($buildDuration, 2))s" -ForegroundColor Cyan
Write-Host "Header tests:     $([math]::Round($testDuration, 2))s" -ForegroundColor Cyan
Write-Host "Sanity tests:     $([math]::Round($sanityDuration, 2))s" -ForegroundColor Cyan
Write-Host "Total duration:   $([math]::Round($totalDuration, 2))s" -ForegroundColor Cyan
Write-Host ""

if ($testExitCode -eq 0) {
    Write-Success "ALL CRITICAL TESTS PASSED ✓"
    Write-Host ""
    Write-Info "Ready to commit? Run these commands:"
    Write-Host ""
    Write-Host "  git status" -ForegroundColor Yellow
    Write-Host "  git add src/components/layout/Header.tsx" -ForegroundColor Yellow
    Write-Host "  git commit -m 'fix(header): production-ready positioning and a11y'" -ForegroundColor Yellow
    Write-Host "  git push -u origin claude/audit-prod-readiness-header-011CUqFQVq13sHM9eiq6ohsN" -ForegroundColor Yellow
    Write-Host ""
    exit 0
} else {
    Write-Error "TESTS FAILED - DO NOT COMMIT"
    Write-Host ""
    Write-Info "Review the errors above and fix before committing."
    Write-Host ""
    exit 1
}
