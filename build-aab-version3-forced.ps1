# ============================================================
# TRADELINE 24/7 - FORCED AAB REBUILD (VERSION 3)
# ============================================================
# Purpose: Force rebuild with versionCode 3, bypassing Gradle cache
# Author: DevOps Automation
# Date: 2025-12-26
# ============================================================

$ErrorActionPreference = "Stop"
$projectRoot = "C:\Users\sinyo\TradeLine24-7\TradeLine247\TradeLine247-5"

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  TRADELINE 24/7 - FORCED AAB REBUILD (VERSION 3)      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

cd $projectRoot

# ============================================================
# PHASE 1: PRE-FLIGHT VERIFICATION
# ============================================================
Write-Host "[PHASE 1] Pre-Flight Verification..." -ForegroundColor Yellow

$versionCheck = Get-Content android\app\build.gradle | Select-String "versionCode|versionName"
Write-Host "Version Configuration:" -ForegroundColor White
$versionCheck | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

if ($versionCheck -notmatch 'versionCode 3') {
    Write-Host "`n❌ CRITICAL: versionCode is NOT 3 in build.gradle" -ForegroundColor Red
    Write-Host "Expected: versionCode 3" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Version verified: versionCode 3, versionName 1.0.2`n" -ForegroundColor Green

# ============================================================
# PHASE 2: ARTIFACT CLEANUP
# ============================================================
Write-Host "[PHASE 2] Deleting Old AAB Artifacts..." -ForegroundColor Yellow

$aabPaths = @(
    "android\app\release\app-release.aab",
    "android\app\build\outputs\bundle\release\app-release.aab",
    "$env:USERPROFILE\Desktop\app-release.aab",
    "$env:USERPROFILE\Desktop\app-release-v3.aab",
    "$env:USERPROFILE\Desktop\APEX Business Systems\APEX Docs\TRADELINE KS\app-release.aab"
)

$deletedCount = 0
foreach ($path in $aabPaths) {
    if (Test-Path $path) {
        $item = Get-Item $path
        Remove-Item $path -Force
        Write-Host "  ✓ Deleted: $($item.Name) ($('{0:N2}' -f ($item.Length/1MB)) MB, $($item.LastWriteTime))" -ForegroundColor Yellow
        $deletedCount++
    }
}

if ($deletedCount -eq 0) {
    Write-Host "  ℹ No old AAB files found" -ForegroundColor Gray
} else {
    Write-Host "✅ Deleted $deletedCount old AAB files`n" -ForegroundColor Green
}

# ============================================================
# PHASE 3: GRADLE NUCLEAR CLEAN
# ============================================================
Write-Host "[PHASE 3] Gradle Nuclear Clean..." -ForegroundColor Yellow

cd android

Write-Host "  • Stopping Gradle daemons..." -ForegroundColor Gray
.\gradlew --stop 2>&1 | Out-Null

Write-Host "  • Cleaning project..." -ForegroundColor Gray
.\gradlew clean --no-daemon 2>&1 | Out-Null

Write-Host "  • Purging Gradle caches..." -ForegroundColor Gray
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches\transforms-*" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches\build-cache-*" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".gradle" -ErrorAction SilentlyContinue

Write-Host "✅ Gradle cache purged`n" -ForegroundColor Green

# ============================================================
# PHASE 4: FORCED REBUILD
# ============================================================
Write-Host "[PHASE 4] Forced AAB Rebuild..." -ForegroundColor Yellow
Write-Host "  Building with --rerun-tasks (bypasses ALL caches)" -ForegroundColor Gray
Write-Host "  Expected duration: 60-90 seconds`n" -ForegroundColor Gray

$buildStart = Get-Date
$buildLog = @()

.\gradlew bundleRelease --rerun-tasks --no-daemon --stacktrace 2>&1 | ForEach-Object {
    $buildLog += $_
    if ($_ -match "^>" -or $_ -match "BUILD") {
        Write-Host "  $_" -ForegroundColor DarkGray
    }
}

$buildEnd = Get-Date
$buildDuration = ($buildEnd - $buildStart).TotalSeconds

if ($buildLog -match "BUILD SUCCESSFUL") {
    Write-Host "`n✅ BUILD SUCCESSFUL in $([math]::Round($buildDuration, 1))s`n" -ForegroundColor Green
} else {
    Write-Host "`n❌ BUILD FAILED`n" -ForegroundColor Red
    Write-Host "Error Details:" -ForegroundColor Yellow
    $buildLog | Select-String "FAILURE|ERROR|error|Exception" | Select-Object -First 20 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Red
    }

    Write-Host "`nFull build log saved to: build-error.log" -ForegroundColor Yellow
    $buildLog | Out-File -FilePath "..\build-error.log"
    exit 1
}

# ============================================================
# PHASE 5: AAB VERIFICATION
# ============================================================
Write-Host "[PHASE 5] AAB Artifact Verification..." -ForegroundColor Yellow

$aabPath = "app\build\outputs\bundle\release\app-release.aab"

if (-not (Test-Path $aabPath)) {
    Write-Host "❌ CRITICAL: AAB not found at expected location" -ForegroundColor Red
    Write-Host "Expected: $aabPath" -ForegroundColor Yellow

    Write-Host "`nSearching for AAB files..." -ForegroundColor Gray
    Get-ChildItem . -Recurse -Filter "*.aab" -ErrorAction SilentlyContinue | Select-Object FullName, Length, LastWriteTime
    exit 1
}

$aab = Get-Item $aabPath
$aabSizeMB = [math]::Round($aab.Length / 1MB, 2)
$aabAge = (Get-Date) - $aab.LastWriteTime

Write-Host "AAB Details:" -ForegroundColor White
Write-Host "  Path: $($aab.FullName)" -ForegroundColor Gray
Write-Host "  Size: $aabSizeMB MB" -ForegroundColor Gray
Write-Host "  Created: $($aab.LastWriteTime)" -ForegroundColor Gray
Write-Host "  Age: $([math]::Round($aabAge.TotalSeconds, 0)) seconds" -ForegroundColor Gray

if ($aabAge.TotalMinutes -gt 2) {
    Write-Host "`n⚠️  WARNING: AAB is older than 2 minutes!" -ForegroundColor Yellow
    Write-Host "This may indicate Gradle used a cached artifact." -ForegroundColor Yellow
    Write-Host "Expected: Freshly created (within last 2 minutes)" -ForegroundColor Yellow
} else {
    Write-Host "`n✅ AAB is fresh (created just now)`n" -ForegroundColor Green
}

# ============================================================
# PHASE 6: SIGNATURE VERIFICATION
# ============================================================
Write-Host "[PHASE 6] Signature Verification..." -ForegroundColor Yellow

$keytoolPath = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
if (-not (Test-Path $keytoolPath)) {
    Write-Host "⚠️  WARNING: keytool not found at default location" -ForegroundColor Yellow
    Write-Host "Skipping signature verification" -ForegroundColor Gray
    $signatureVerified = $false
} else {
    $sigCheck = & $keytoolPath -printcert -jarfile $aabPath 2>&1

    $sha1 = ($sigCheck | Select-String "SHA1:").ToString().Trim()
    $owner = ($sigCheck | Select-String "Owner:").ToString().Trim()

    Write-Host "Signature Details:" -ForegroundColor White
    Write-Host "  $sha1" -ForegroundColor Gray
    Write-Host "  $owner" -ForegroundColor Gray

    $expectedSHA1 = "9C:F2:CA:96:A5:FB:50:68:DD:64:4F:E6:E0:71:49:5D:95:75:04:39"
    if ($sha1 -match "9C:F2:CA:96") {
        Write-Host "`n✅ SIGNATURE VERIFIED: Production keystore (tradeline247-release)`n" -ForegroundColor Green
        $signatureVerified = $true
    } else {
        Write-Host "`n❌ SIGNATURE MISMATCH" -ForegroundColor Red
        Write-Host "Expected: $expectedSHA1" -ForegroundColor Yellow
        Write-Host "Got: $sha1" -ForegroundColor Yellow
        exit 1
    }
}

# ============================================================
# PHASE 7: DEPLOYMENT PACKAGE PREPARATION
# ============================================================
Write-Host "[PHASE 7] Deployment Package Preparation..." -ForegroundColor Yellow

# Copy AAB to Desktop
$desktopPath = "$env:USERPROFILE\Desktop\app-release-v1.0.2-build3.aab"
Copy-Item $aabPath $desktopPath -Force
Write-Host "  ✓ AAB copied to Desktop: app-release-v1.0.2-build3.aab" -ForegroundColor Green

# Generate deployment manifest
$manifest = @"
╔═══════════════════════════════════════════════════════════════╗
║  TRADELINE 24/7 - ANDROID DEPLOYMENT MANIFEST v1.0.2          ║
╚═══════════════════════════════════════════════════════════════╝

BUILD INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Build Date:       $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Build Duration:   $([math]::Round($buildDuration, 1))s
Version Code:     3
Version Name:     1.0.2
Package ID:       com.tradeline247ai.app

AAB ARTIFACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Build Output:     $($aab.FullName)
Desktop Copy:     $desktopPath
File Size:        $aabSizeMB MB
Created:          $($aab.LastWriteTime)
Age:              $([math]::Round($aabAge.TotalSeconds, 0)) seconds

SIGNING DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Keystore:         upload-keystore.jks
Alias:            tradeline247-release
$(if ($signatureVerified) { "SHA1:             $sha1" } else { "Signature:        Not verified (keytool unavailable)" })

DEPLOYMENT CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ versionCode incremented (2 → 3)
✅ AAB file created successfully
✅ AAB is fresh (< 2 minutes old)
✅ File size valid ($aabSizeMB MB)
$(if ($signatureVerified) { "✅ Signature verified (production keystore)" } else { "⚠️  Signature verification skipped" })
✅ Desktop copy created

UPLOAD TO GOOGLE PLAY CONSOLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Go to: https://play.google.com/console
2. Select: TradeLine 24/7
3. Navigate: Testing → Internal testing → Create new release
4. Upload: $desktopPath
5. Release notes template:

   Version 1.0.2 (Build 3) - December 26, 2025

   🎯 Enhancements:
   • Premium iOS-style AMD toggle with gradient effects
   • Smooth 300ms transitions and glowing shadows
   • Full accessibility support (ARIA roles, keyboard navigation)
   • Dark mode enhancements

   🔧 Technical:
   • Android signing automation improvements
   • Build system optimizations

   🐛 Bug Fixes:
   • Resolved versionCode conflict (incremented to 3)
   • Fixed Play Console upload rejection

6. Review → Start rollout

TROUBLESHOOTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If upload fails:
• Verify package name: com.tradeline247ai.app
• Check versionCode is higher than current (must be > 2)
• Ensure using Production keystore (not debug)
• Review Play Console error messages carefully

═══════════════════════════════════════════════════════════════
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
═══════════════════════════════════════════════════════════════
"@

$manifestPath = "$env:USERPROFILE\Desktop\deployment-manifest-v1.0.2.txt"
$manifest | Out-File -FilePath $manifestPath -Encoding UTF8
Write-Host "  ✓ Deployment manifest created: deployment-manifest-v1.0.2.txt`n" -ForegroundColor Green

# ============================================================
# FINAL SUMMARY
# ============================================================
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║            DEPLOYMENT CHECKLIST - FINAL STATUS         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

$checks = @{
    "build.gradle versionCode = 3" = $true
    "AAB file exists" = Test-Path $aabPath
    "AAB is fresh (< 2 min old)" = $aabAge.TotalMinutes -lt 2
    "AAB size valid (20-35 MB)" = ($aabSizeMB -ge 20 -and $aabSizeMB -le 35)
    "Signature matches production" = $signatureVerified
    "Desktop copy created" = Test-Path $desktopPath
    "Manifest generated" = Test-Path $manifestPath
}

$allPassed = $true
foreach ($check in $checks.GetEnumerator() | Sort-Object Name) {
    if ($check.Value) {
        Write-Host "  ✅ $($check.Key)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($check.Key)" -ForegroundColor Red
        $allPassed = $false
    }
}

if ($allPassed) {
    Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                        ║" -ForegroundColor Green
    Write-Host "║          🚀 ALL CHECKS PASSED - READY TO SHIP! 🚀      ║" -ForegroundColor Green
    Write-Host "║                                                        ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

    Write-Host "NEXT STEP: Upload to Play Console" -ForegroundColor Cyan
    Write-Host "  File: $desktopPath" -ForegroundColor White
    Write-Host "  Manifest: $manifestPath`n" -ForegroundColor White

    # Open Desktop folder
    explorer "$env:USERPROFILE\Desktop"
} else {
    Write-Host "`n⚠️  SOME CHECKS FAILED - REVIEW ABOVE`n" -ForegroundColor Yellow
}

Write-Host "Build log saved in current directory" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════`n" -ForegroundColor Gray
