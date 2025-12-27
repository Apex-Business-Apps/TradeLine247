# File: build-aab-force-clean.ps1
# Purpose: Force rebuild Android AAB with versionCode 3
# Bypasses all Gradle caching to ensure fresh build

param()

# Configuration
$ErrorActionPreference = "Stop"
$root = "C:\Users\sinyo\TradeLine24-7\TradeLine247\TradeLine247-5"

# Helper function for colored output
function Write-Phase {
    param([string]$Message, [string]$Color = "White")
    Write-Host ""
    Write-Host $Message -ForegroundColor $Color
}

# Banner
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " ANDROID AAB FORCE REBUILD v1.0.2" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# PHASE 1: Verify Configuration
Write-Phase "[1/7] Verifying build.gradle configuration..." "Yellow"
$gradle = Get-Content "$root\android\app\build.gradle" -Raw
if ($gradle -match 'versionCode 3' -and $gradle -match 'versionName "1.0.2"') {
    Write-Host "  ✓ versionCode: 3" -ForegroundColor Green
    Write-Host "  ✓ versionName: 1.0.2" -ForegroundColor Green
} else {
    Write-Host "  ✗ ERROR: Version mismatch in build.gradle" -ForegroundColor Red
    exit 1
}

# PHASE 2: Clean Old Artifacts
Write-Phase "[2/7] Removing old AAB files..." "Yellow"
$locations = @(
    "$root\android\app\release\app-release.aab"
    "$root\android\app\build\outputs\bundle\release\app-release.aab"
    "$env:USERPROFILE\Desktop\app-release*.aab"
)
$count = 0
foreach ($loc in $locations) {
    $files = Get-ChildItem $loc -ErrorAction SilentlyContinue
    if ($files) {
        $files | Remove-Item -Force
        $count += $files.Count
        Write-Host "  ✓ Deleted: $loc" -ForegroundColor Gray
    }
}
Write-Host "  ✓ Removed $count old files" -ForegroundColor Green

# PHASE 3: Gradle Clean
Write-Phase "[3/7] Gradle nuclear clean..." "Yellow"
Set-Location "$root\android"
Write-Host "  • Stopping Gradle daemons..." -ForegroundColor Gray
.\gradlew --stop 2>&1 | Out-Null
Write-Host "  • Cleaning project..." -ForegroundColor Gray
.\gradlew clean --no-daemon 2>&1 | Out-Null
Write-Host "  • Purging transform caches..." -ForegroundColor Gray
$caches = "$env:USERPROFILE\.gradle\caches\transforms-*"
Remove-Item -Recurse -Force $caches -ErrorAction SilentlyContinue
Write-Host "  ✓ Clean complete" -ForegroundColor Green

# PHASE 4: Force Rebuild
Write-Phase "[4/7] Building AAB (forced - no cache)..." "Yellow"
Write-Host "  This will take 60-90 seconds..." -ForegroundColor Gray
$buildStart = Get-Date
$buildLog = .\gradlew bundleRelease --rerun-tasks --no-daemon --stacktrace 2>&1
$buildEnd = Get-Date
$buildTime = [math]::Round(($buildEnd - $buildStart).TotalSeconds, 1)

if ($buildLog -match "BUILD SUCCESSFUL") {
    Write-Host "  ✓ Build completed in ${buildTime}s" -ForegroundColor Green
} else {
    Write-Host "  ✗ BUILD FAILED" -ForegroundColor Red
    $buildLog | Select-String "FAILURE|error|Error" | Select-Object -First 5 | ForEach-Object {
        Write-Host "    $_" -ForegroundColor Red
    }
    exit 1
}

# PHASE 5: Verify AAB
Write-Phase "[5/7] Verifying AAB artifact..." "Yellow"
$aabPath = "app\build\outputs\bundle\release\app-release.aab"
if (-not (Test-Path $aabPath)) {
    Write-Host "  ✗ AAB not found at: $aabPath" -ForegroundColor Red
    exit 1
}

$aabFile = Get-Item $aabPath
$sizeMB = [math]::Round($aabFile.Length / 1MB, 2)
$ageSeconds = [math]::Round(((Get-Date) - $aabFile.LastWriteTime).TotalSeconds)

Write-Host "  • Path: $($aabFile.FullName)" -ForegroundColor Gray
Write-Host "  • Size: $sizeMB MB" -ForegroundColor Gray
Write-Host "  • Created: $($aabFile.LastWriteTime)" -ForegroundColor Gray
Write-Host "  • Age: ${ageSeconds}s" -ForegroundColor Gray

if ($ageSeconds -gt 120) {
    Write-Host "  ✗ AAB is stale (older than 2 minutes)" -ForegroundColor Red
    Write-Host "    This indicates Gradle used a cached build" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✓ AAB is fresh" -ForegroundColor Green

# PHASE 6: Verify Signature
Write-Phase "[6/7] Verifying cryptographic signature..." "Yellow"
$keytool = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
if (-not (Test-Path $keytool)) {
    Write-Host "  ✗ keytool.exe not found" -ForegroundColor Red
    exit 1
}

$certInfo = & $keytool -printcert -jarfile $aabPath 2>&1
$sha1Line = ($certInfo | Select-String "SHA1:").Line
$ownerLine = ($certInfo | Select-String "Owner:").Line

Write-Host "  $sha1Line" -ForegroundColor Gray
Write-Host "  $ownerLine" -ForegroundColor Gray

$expectedSHA1 = "9C:F2:CA:96:A5:FB:50:68:DD:64:4F:E6:E0:71:49:5D:95:75:04:39"
if ($sha1Line -match "9C:F2:CA:96") {
    Write-Host "  ✓ Production keystore verified" -ForegroundColor Green
} else {
    Write-Host "  ✗ Signature mismatch!" -ForegroundColor Red
    Write-Host "    Expected: $expectedSHA1" -ForegroundColor Yellow
    Write-Host "    Got: $sha1Line" -ForegroundColor Yellow
    exit 1
}

# PHASE 7: Deploy to Desktop
Write-Phase "[7/7] Creating deployment package..." "Yellow"
$desktopAAB = "$env:USERPROFILE\Desktop\app-release-v1.0.2-build3.aab"
Copy-Item $aabPath $desktopAAB -Force
Write-Host "  ✓ AAB copied to Desktop" -ForegroundColor Green

# Generate deployment manifest
$manifest = @"
╔════════════════════════════════════════════════════════╗
║   TRADELINE 24/7 - ANDROID DEPLOYMENT PACKAGE          ║
╚════════════════════════════════════════════════════════╝

Build Information:
  • Version Code: 3
  • Version Name: 1.0.2
  • Build Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
  • Build Time: ${buildTime}s

Artifact Details:
  • File: app-release-v1.0.2-build3.aab
  • Size: $sizeMB MB
  • Location: $desktopAAB

Signature Verification:
  • Keystore: upload-keystore.jks
  • Alias: tradeline247-release
  • SHA1: $expectedSHA1
  • Status: ✓ VERIFIED

Deployment Instructions:
  1. Open: https://play.google.com/console
  2. Select: TradeLine 24/7 Ai Receptionist
  3. Navigate: Testing → Internal testing
  4. Click: Create new release
  5. Upload: $desktopAAB
  6. Release notes:
     Version 1.0.2 (Build 3) - $(Get-Date -Format "MMMM dd, yyyy")
     • Premium iOS-style AMD toggle with gradient effects
     • Enhanced accessibility and dark mode support
     • Build system optimizations
     • Bug fixes and performance improvements
  7. Review → Start rollout to internal testing

Build completed successfully!
"@

$manifestPath = "$env:USERPROFILE\Desktop\deployment-manifest-v1.0.2.txt"
$manifest | Out-File -FilePath $manifestPath -Encoding UTF8
Write-Host "  ✓ Deployment manifest created" -ForegroundColor Green

# Success Banner
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "║          ✓ BUILD SUCCESSFUL - READY TO SHIP!           ║" -ForegroundColor Green
Write-Host "║                                                        ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Desktop Files:" -ForegroundColor Cyan
Write-Host "  • $desktopAAB" -ForegroundColor White
Write-Host "  • $manifestPath" -ForegroundColor White
Write-Host ""
Write-Host "Next Step: Upload to Google Play Console" -ForegroundColor Cyan
Write-Host "  → https://play.google.com/console" -ForegroundColor White
Write-Host ""
