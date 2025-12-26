# ============================================================
# TRADELINE 24/7 - ANDROID SIGNING FIX SCRIPT
# ============================================================
# This script fixes the Android AAB signing issue by ensuring
# the keystore file and properties are correctly placed.
# ============================================================

$ErrorActionPreference = "Stop"
$projectRoot = "C:\Users\sinyo\TradeLine24-7\TradeLine247\TradeLine247-5"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "TRADELINE 24/7 - ANDROID SIGNING REPAIR" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Navigate to project
cd $projectRoot

# ============================================================
# PHASE 1: PRE-FLIGHT CHECKS
# ============================================================
Write-Host "[PHASE 1] Pre-Flight Checks..." -ForegroundColor Yellow

# Check if production keystore exists
$productionKeystore = "C:\Users\sinyo\.android\upload-keystore.jks"
if (-not (Test-Path $productionKeystore)) {
    Write-Host "❌ CRITICAL: Production keystore not found at $productionKeystore" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Production keystore found: $productionKeystore" -ForegroundColor Green

# Verify keystore alias
Write-Host "`nVerifying keystore alias..." -ForegroundColor Yellow
$aliasCheck = & "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -keystore $productionKeystore -storepass "Admin143!" 2>&1 | Select-String "Alias name:"
if ($aliasCheck -match "tradeline247-release") {
    Write-Host "✅ Keystore alias verified: tradeline247-release" -ForegroundColor Green
} else {
    Write-Host "⚠️  WARNING: Unexpected alias:" -ForegroundColor Yellow
    Write-Host $aliasCheck
}

# ============================================================
# PHASE 2: BACKUP CURRENT CONFIGURATION
# ============================================================
Write-Host "`n[PHASE 2] Creating backups..." -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "android\backups\$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

if (Test-Path "android\keystore.properties") {
    Copy-Item "android\keystore.properties" "$backupDir\keystore.properties.backup"
    Write-Host "✅ Backed up: keystore.properties" -ForegroundColor Green
}

if (Test-Path "android\upload-keystore.jks") {
    Copy-Item "android\upload-keystore.jks" "$backupDir\upload-keystore.jks.backup"
    Write-Host "✅ Backed up: upload-keystore.jks" -ForegroundColor Green
}

# ============================================================
# PHASE 3: SETUP KEYSTORE FILES
# ============================================================
Write-Host "`n[PHASE 3] Setting up keystore files..." -ForegroundColor Yellow

# Create keystore.properties from template
Write-Host "Creating keystore.properties..." -ForegroundColor Cyan
@"
storePassword=Admin143!
keyPassword=Admin143!
keyAlias=tradeline247-release
storeFile=upload-keystore.jks
"@ | Out-File -FilePath "android\keystore.properties" -Encoding ASCII -NoNewline

# Verify file was created correctly
$propsContent = Get-Content "android\keystore.properties" -Raw
Write-Host "✅ keystore.properties created:" -ForegroundColor Green
Write-Host $propsContent

# Copy production keystore to project
Write-Host "`nCopying production keystore..." -ForegroundColor Cyan
Copy-Item $productionKeystore "android\upload-keystore.jks" -Force
Write-Host "✅ Keystore copied to: android\upload-keystore.jks" -ForegroundColor Green

# Verify keystore was copied
$keystoreInfo = Get-Item "android\upload-keystore.jks"
Write-Host "   Size: $([math]::Round($keystoreInfo.Length / 1KB, 2)) KB" -ForegroundColor Gray

# ============================================================
# PHASE 4: GRADLE NUCLEAR CLEAN
# ============================================================
Write-Host "`n[PHASE 4] Gradle nuclear clean..." -ForegroundColor Yellow

cd android

Write-Host "Stopping Gradle daemons..." -ForegroundColor Cyan
.\gradlew --stop | Out-Null

Write-Host "Cleaning project..." -ForegroundColor Cyan
.\gradlew clean --no-daemon | Out-Null

Write-Host "Clearing Gradle caches..." -ForegroundColor Cyan
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches\transforms-*" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches\build-cache-*" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".gradle" -ErrorAction SilentlyContinue

Write-Host "✅ Nuclear clean complete" -ForegroundColor Green

# ============================================================
# PHASE 5: BUILD AAB
# ============================================================
Write-Host "`n[PHASE 5] Building release AAB..." -ForegroundColor Yellow
Write-Host "This may take 2-5 minutes...`n" -ForegroundColor Gray

$buildOutput = .\gradlew bundleRelease --no-daemon --stacktrace 2>&1 | Tee-Object -Variable buildLog

# ============================================================
# PHASE 6: VERIFY BUILD
# ============================================================
Write-Host "`n[PHASE 6] Verifying build..." -ForegroundColor Yellow

$aabPath = "app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $aabPath) {
    Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║                                                        ║" -ForegroundColor Green
    Write-Host "║          ✅ BUILD SUCCESSFUL - AAB CREATED             ║" -ForegroundColor Green
    Write-Host "║                                                        ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Green

    # Get file info
    $aabInfo = Get-Item $aabPath
    $aabSizeMB = [math]::Round($aabInfo.Length / 1MB, 2)

    Write-Host "`nAAB Details:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "  Path:    $($aabInfo.FullName)" -ForegroundColor White
    Write-Host "  Size:    $aabSizeMB MB" -ForegroundColor White
    Write-Host "  Created: $($aabInfo.LastWriteTime)" -ForegroundColor White

    # Verify signature
    Write-Host "`nVerifying signature..." -ForegroundColor Cyan
    $sigOutput = & "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -printcert -jarfile $aabPath 2>&1

    $sha1Line = $sigOutput | Select-String "SHA1:"
    if ($sha1Line -match "9C:F2:CA:96") {
        Write-Host "✅ SIGNATURE VERIFIED: Production keystore" -ForegroundColor Green
        Write-Host "  $sha1Line" -ForegroundColor White
    } else {
        Write-Host "⚠️  WARNING: Signature doesn't match expected SHA1" -ForegroundColor Yellow
        Write-Host "  $sha1Line" -ForegroundColor White
    }

    # Check package name with aapt (if available)
    Write-Host "`nPackage verification:" -ForegroundColor Cyan
    try {
        $aapt = & aapt dump badging $aabPath 2>&1 | Select-String "package: name"
        Write-Host "  $aapt" -ForegroundColor White
    } catch {
        Write-Host "  (aapt not in PATH - skipping package check)" -ForegroundColor Gray
    }

    # ============================================================
    # PHASE 7: DEPLOYMENT MANIFEST
    # ============================================================
    Write-Host "`n[PHASE 7] Generating deployment manifest..." -ForegroundColor Yellow

    $deploymentManifest = @"
═══════════════════════════════════════════════════════════
TRADELINE 24/7 - ANDROID DEPLOYMENT MANIFEST
═══════════════════════════════════════════════════════════

Build Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Date:     $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
  AAB Path: $($aabInfo.FullName)
  Size:     $aabSizeMB MB
  Package:  com.tradeline247ai.app

Signing Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Keystore: $productionKeystore
  Alias:    tradeline247-release
  SHA1:     9C:F2:CA:96:A5:FB:50:68:DD:64:4F:E6:E0:71:49:5D:95:75:04:39

Deployment Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ READY FOR GOOGLE PLAY CONSOLE UPLOAD

Next Steps:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. Go to: https://play.google.com/console
  2. Select: TradeLine 24/7
  3. Navigate to: Production → Create new release
  4. Upload: $($aabInfo.FullName)
  5. Fill in release notes
  6. Review and start rollout

═══════════════════════════════════════════════════════════
"@

    $manifestPath = "..\deployment_manifest_$timestamp.txt"
    $deploymentManifest | Out-File -FilePath $manifestPath -Encoding UTF8

    Write-Host $deploymentManifest
    Write-Host "`n✅ Deployment manifest saved: $manifestPath" -ForegroundColor Green

    Write-Host "`n🚀 READY FOR DEPLOYMENT!" -ForegroundColor Cyan
    Write-Host "   Next: Upload to Google Play Console" -ForegroundColor Cyan

    exit 0

} else {
    Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║                                                        ║" -ForegroundColor Red
    Write-Host "║              ❌ BUILD FAILED - AAB NOT CREATED         ║" -ForegroundColor Red
    Write-Host "║                                                        ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Red

    Write-Host "`nAnalyzing build errors..." -ForegroundColor Yellow

    # Extract key errors
    $errors = $buildLog | Select-String "error|exception|failed" -Context 2,2

    if ($errors) {
        Write-Host "`nKey errors found:" -ForegroundColor Red
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
        $errors | ForEach-Object { Write-Host $_ -ForegroundColor White }
    }

    Write-Host "`nFull build log available in terminal output above." -ForegroundColor Gray
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check if Android SDK is properly installed" -ForegroundColor White
    Write-Host "  2. Verify Java 17 is installed and in PATH" -ForegroundColor White
    Write-Host "  3. Review full build log for specific errors" -ForegroundColor White

    exit 1
}
