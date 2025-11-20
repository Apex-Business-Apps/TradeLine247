# ========================================
# Windows Desktop Build Script
# ========================================
# Creates production-ready web bundle for Windows Desktop distribution
# Compatible with: PWABuilder, MSIX packaging, Electron wrapper

param(
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Windows Desktop Build Pipeline" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# ────────────────────────────────────────────────────────────────────────────
# Step 1: Environment Validation
# ────────────────────────────────────────────────────────────────────────────
Write-Host "`n[1/6] Validating environment..." -ForegroundColor Yellow

# Check Node.js version
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    throw "Node.js not found. Please install Node.js 20.x"
}
Write-Host "  ✓ Node.js: $nodeVersion" -ForegroundColor Green

# Check npm version
$npmVersion = npm --version
if ($LASTEXITCODE -ne 0) {
    throw "npm not found"
}
Write-Host "  ✓ npm: $npmVersion" -ForegroundColor Green

# ────────────────────────────────────────────────────────────────────────────
# Step 2: Clean Previous Build
# ────────────────────────────────────────────────────────────────────────────
Write-Host "`n[2/6] Cleaning previous build..." -ForegroundColor Yellow

if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
    Write-Host "  ✓ Removed dist/" -ForegroundColor Green
}

if (Test-Path "playwright-report") {
    Remove-Item -Path "playwright-report" -Recurse -Force
    Write-Host "  ✓ Removed playwright-report/" -ForegroundColor Green
}

# ────────────────────────────────────────────────────────────────────────────
# Step 3: Install Dependencies
# ────────────────────────────────────────────────────────────────────────────
Write-Host "`n[3/6] Installing dependencies..." -ForegroundColor Yellow

npm ci
if ($LASTEXITCODE -ne 0) {
    throw "npm ci failed"
}
Write-Host "  ✓ Dependencies installed" -ForegroundColor Green

# ────────────────────────────────────────────────────────────────────────────
# Step 4: Quality Gates (if not skipped)
# ────────────────────────────────────────────────────────────────────────────
if (-not $SkipTests) {
    Write-Host "`n[4/6] Running quality gates..." -ForegroundColor Yellow
    
    Write-Host "  → Linting..." -ForegroundColor Gray
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        throw "Linting failed"
    }
    Write-Host "    ✓ Lint passed" -ForegroundColor Green
    
    Write-Host "  → Type checking..." -ForegroundColor Gray
    npm run typecheck
    if ($LASTEXITCODE -ne 0) {
        throw "Type check failed"
    }
    Write-Host "    ✓ Type check passed" -ForegroundColor Green
    
    Write-Host "  → Unit tests..." -ForegroundColor Gray
    npm run test:unit
    if ($LASTEXITCODE -ne 0) {
        throw "Unit tests failed"
    }
    Write-Host "    ✓ Unit tests passed" -ForegroundColor Green
} else {
    Write-Host "`n[4/6] Skipping quality gates (--SkipTests)" -ForegroundColor Yellow
}

# ────────────────────────────────────────────────────────────────────────────
# Step 5: Production Build
# ────────────────────────────────────────────────────────────────────────────
Write-Host "`n[5/6] Building production bundle..." -ForegroundColor Yellow

npm run build:web
if ($LASTEXITCODE -ne 0) {
    throw "Production build failed"
}

# Verify critical files exist
$criticalFiles = @(
    "dist/index.html",
    "dist/assets",
    "dist/manifest.json"
)

foreach ($file in $criticalFiles) {
    if (-not (Test-Path $file)) {
        throw "Build verification failed: $file not found"
    }
}

Write-Host "  ✓ Production bundle created" -ForegroundColor Green

# ────────────────────────────────────────────────────────────────────────────
# Step 6: Create Build Metadata
# ────────────────────────────────────────────────────────────────────────────
Write-Host "`n[6/6] Creating build metadata..." -ForegroundColor Yellow

$commitHash = git rev-parse --short HEAD 2>$null
if ([string]::IsNullOrEmpty($commitHash)) {
    $commitHash = "unknown"
}

$buildInfo = @{
    platform = "windows"
    buildDate = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    commitHash = $commitHash
    nodeVersion = $nodeVersion
    npmVersion = $npmVersion
} | ConvertTo-Json -Depth 2

$buildInfo | Out-File -FilePath "dist/build-info.json" -Encoding UTF8 -NoNewline

Write-Host "  ✓ Build metadata created" -ForegroundColor Green

# ────────────────────────────────────────────────────────────────────────────
# Success Summary
# ────────────────────────────────────────────────────────────────────────────
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  ✅ Windows Desktop Build Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "`n📦 Artifacts Location: ./dist/" -ForegroundColor Cyan
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Package with PWABuilder: https://www.pwabuilder.com/" -ForegroundColor White
Write-Host "  2. Or create MSIX package for Microsoft Store" -ForegroundColor White
Write-Host "  3. Or wrap with Electron for standalone distribution`n" -ForegroundColor White

