#!/usr/bin/env bash
# =============================================================================
# TradeLine 24/7 - iOS Build Script for Codemagic
# =============================================================================
# Version: 4.1.0 (Fixed: Removed global PROVISIONING_PROFILE_SPECIFIER)
#
# FIX: Pods targets (CapacitorCordova, Capacitor, Pods-App) do not support
#      provisioning profiles. Removed global PROVISIONING_PROFILE_SPECIFIER
#      and rely on Codemagic ios_signing + -allowProvisioningUpdates to apply
#      profile only to App target.
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Configuration
TEAM_ID="${TEAM_ID:-NWGUYF42KW}"
BUNDLE_ID="${BUNDLE_ID:-com.apex.tradeline}"
PROVISIONING_PROFILE_NAME="${PROVISIONING_PROFILE_NAME:-TL247_mobpro_tradeline_01}"
XCODE_SCHEME="${XCODE_SCHEME:-App}"
# Use CM_BUILD_DIR if available (Codemagic), otherwise use ROOT/build
BUILD_DIR="${CM_BUILD_DIR:-$ROOT/build}"
ARCHIVE_PATH="${ARCHIVE_PATH:-$BUILD_DIR/TradeLine247.xcarchive}"
EXPORT_DIR="$BUILD_DIR/ipa"
LOG_DIR="$BUILD_DIR"
EXPORT_OPTIONS_PLIST="${EXPORT_OPTIONS_PLIST:-$BUILD_DIR/ExportOptions.plist}"

# Detect workspace
if [ -f "ios/App/App.xcworkspace/contents.xcworkspacedata" ]; then
    XCODE_WORKSPACE="ios/App/App.xcworkspace"
elif [ -f "ios/App.xcworkspace/contents.xcworkspacedata" ]; then
    XCODE_WORKSPACE="ios/App.xcworkspace"
else
    echo "❌ ERROR: Could not find Xcode workspace"
    find ios -name "*.xcworkspace" -type d 2>/dev/null || true
    exit 1
fi

mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_DIR" "$LOG_DIR" ios/build/export

echo "=============================================="
echo "🏗️  TradeLine 24/7 iOS Build"
echo "=============================================="
echo "Bundle ID:    $BUNDLE_ID"
echo "Team ID:      $TEAM_ID"
echo "Scheme:       $XCODE_SCHEME"
echo "Workspace:    $XCODE_WORKSPACE"
echo "Profile:      $PROVISIONING_PROFILE_NAME"
echo "=============================================="

echo ""
echo "📦 Ensuring node_modules..."
if [[ ! -d "node_modules" ]]; then
  npm ci --legacy-peer-deps
fi

echo ""
echo "🔧 Building web app..."
npm run build

echo ""
echo "🔄 Syncing Capacitor iOS..."
npx cap sync ios

echo ""
echo "📦 Installing CocoaPods..."
pushd ios/App >/dev/null 2>&1 || pushd ios >/dev/null
pod install --repo-update
popd >/dev/null

echo ""
echo "🔍 Verifying Capacitor Pods signing configuration..."
# Verify that Capacitor Pods targets have Automatic signing set
if [ -f "ios/App/Pods/Pods.xcodeproj/project.pbxproj" ]; then
  CAPACITOR_TARGETS=$(grep -c "Capacitor.*CODE_SIGN_STYLE = Automatic" ios/App/Pods/Pods.xcodeproj/project.pbxproj 2>/dev/null || echo "0")
  if [ "$CAPACITOR_TARGETS" -eq "0" ]; then
    echo "⚠️  WARNING: Capacitor targets may not have Automatic signing configured"
    echo "   This should be handled by Podfile post_install hook"
  else
    echo "✅ Capacitor Pods targets configured with Automatic signing"
  fi
fi

echo ""
echo "🧰 Ensuring codemagic-cli-tools..."
pip3 install --quiet --upgrade codemagic-cli-tools 2>/dev/null || pip install codemagic-cli-tools 2>/dev/null || true

# Diagnostic output
echo ""
echo "🔐 Signing identities:"
security find-identity -v -p codesigning || true

echo ""
echo "📱 Provisioning profiles:"
ls ~/Library/MobileDevice/Provisioning\ Profiles/ || true

# =============================================================================
# CREATE EXPORT OPTIONS
# Critical: provisioningProfiles dict must ONLY contain the App's bundle ID.
# Do NOT add entries for Capacitor, CapacitorCordova, or Pods-App.
# =============================================================================
echo ""
echo "📝 Creating ExportOptions.plist..."

mkdir -p "$(dirname "$EXPORT_OPTIONS_PLIST")"

cat > "$EXPORT_OPTIONS_PLIST" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>NWGUYF42KW</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>manual</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>com.apex.tradeline</key>
        <string>TL247_mobpro_tradeline_01</string>
    </dict>
</dict>
</plist>
EOF

# =============================================================================
# BUILD ARCHIVE
# Pods targets (CapacitorCordova, Capacitor, Pods-App) do not support
# provisioning profiles. We rely on Codemagic ios_signing + -allowProvisioningUpdates
# to apply profile only to App target. Do NOT pass PROVISIONING_PROFILE_SPECIFIER
# globally as it breaks Pods targets.
# =============================================================================
echo ""
echo "[build-ios] Running xcodebuild archive"
echo "  Workspace: $XCODE_WORKSPACE"
echo "  Scheme:    $XCODE_SCHEME"
echo "  Team ID:   $TEAM_ID"
echo "  Bundle ID: $BUNDLE_ID"

mkdir -p "$(dirname "$ARCHIVE_PATH")"

xcodebuild archive \
  -workspace "$XCODE_WORKSPACE" \
  -scheme "$XCODE_SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  CODE_SIGN_STYLE="Manual" \
  CODE_SIGN_IDENTITY="Apple Distribution" \
  -allowProvisioningUpdates \
  clean archive \
  2>&1 | tee "$LOG_DIR/xcodebuild.log"

ARCHIVE_EXIT=$?

if [ $ARCHIVE_EXIT -ne 0 ]; then
  echo "❌ Archive failed with exit code $ARCHIVE_EXIT"
  exit $ARCHIVE_EXIT
fi

if [ ! -d "$ARCHIVE_PATH" ]; then
  echo "❌ ERROR: Archive was not created"
  exit 65
fi

echo "✅ Archive succeeded"

# =============================================================================
# EXPORT IPA
# =============================================================================
echo ""
echo "[build-ios] Exporting IPA..."

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
  -allowProvisioningUpdates \
  2>&1 | tee "$LOG_DIR/export.log"

EXPORT_EXIT=$?

if [ $EXPORT_EXIT -ne 0 ]; then
  echo "❌ Export failed with exit code $EXPORT_EXIT"
  exit $EXPORT_EXIT
fi

echo "✅ IPA exported"

IPA_PATH=$(find "$EXPORT_DIR" -name "*.ipa" 2>/dev/null | head -1)

if [[ -z "$IPA_PATH" || ! -f "$IPA_PATH" ]]; then
  echo "❌ ERROR: IPA not found in $EXPORT_DIR" >&2
  exit 70
fi

# Export IPA_PATH for Fastlane (ensure IPA is at expected location)
if [[ -n "${CM_BUILD_DIR:-}" ]]; then
  mkdir -p "$CM_BUILD_DIR/ipa"
  # Only copy if source and destination are different
  if [[ "$IPA_PATH" != "$CM_BUILD_DIR/ipa/App.ipa" ]]; then
    cp "$IPA_PATH" "$CM_BUILD_DIR/ipa/App.ipa" 2>/dev/null || true
  fi
  export IPA_PATH="$CM_BUILD_DIR/ipa/App.ipa"
else
  export IPA_PATH="$IPA_PATH"
fi

echo ""
echo "=============================================="
echo "✅ BUILD SUCCESSFUL"
echo "=============================================="
echo "Archive: $ARCHIVE_PATH"
echo "IPA:     $IPA_PATH"
echo "=============================================="

# Copy artifacts to expected locations for Fastlane
mkdir -p ios/build/export
# Only copy if source and destination are different
if [[ "$IPA_PATH" != "ios/build/export/$(basename "$IPA_PATH")" ]]; then
  cp "$IPA_PATH" ios/build/export/ 2>/dev/null || true
fi
cp -r "$ARCHIVE_PATH" ios/build/TradeLine247.xcarchive 2>/dev/null || true

echo ""
echo "📁 Artifacts ready for upload"
ls -la ios/build/export/

# Export IPA_PATH for Fastlane
if [[ -n "${CM_ENV:-}" ]]; then
  echo "IPA_PATH=$IPA_PATH" >> "$CM_ENV"
fi
