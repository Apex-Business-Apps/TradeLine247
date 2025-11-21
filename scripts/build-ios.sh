#!/usr/bin/env bash
# =============================================================================
# TradeLine 24/7 - iOS Build Script for Codemagic
# =============================================================================
# Version: 4.0.0 (Complete Manual Signing Fix)
#
# FIX: Complete manual signing configuration with all parameters:
#      - CODE_SIGN_STYLE=Manual in project.pbxproj and xcodebuild
#      - CODE_SIGN_IDENTITY="Apple Distribution"
#      - PROVISIONING_PROFILE_SPECIFIER explicitly set
#      - Proper exit codes 65 (archive) and 70 (export)
#      - ExportOptions.plist with manual signing
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Configuration
TEAM_ID="${TEAM_ID:-NWGUYF42KW}"
BUNDLE_ID="${BUNDLE_ID:-com.apex.tradeline}"
PROVISIONING_PROFILE_NAME="${PROVISIONING_PROFILE_NAME:-TL247_mobpro_tradeline_01}"
XCODE_SCHEME="${XCODE_SCHEME:-App}"
ARCHIVE_PATH="${ARCHIVE_PATH:-$ROOT/build/App.xcarchive}"
EXPORT_DIR="$ROOT/build/ipa"
LOG_DIR="$ROOT/build"
EXPORT_OPTIONS_PLIST="${EXPORT_OPTIONS_PLIST:-$ROOT/build/ExportOptions.plist}"

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
# CREATE EXPORT OPTIONS (Provisioning profile specified here for IPA export)
# =============================================================================
echo ""
echo "[build-ios] Creating ExportOptions.plist"

cat > "$EXPORT_OPTIONS_PLIST" << 'EXPORTEOF'
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
EXPORTEOF

# =============================================================================
# BUILD ARCHIVE
# The App target now has manual signing committed in project.pbxproj with
# PROVISIONING_PROFILE_SPECIFIER set, so we don't need to mutate the project.
# We reinforce all signing parameters for deterministic Codemagic output.
# =============================================================================
echo ""
echo "[build-ios] Running xcodebuild archive"
echo "  Workspace: $XCODE_WORKSPACE"
echo "  Scheme: $XCODE_SCHEME"
echo "  Configuration: Release"
echo "  Team ID: $TEAM_ID"
echo "  Bundle ID: $BUNDLE_ID"
echo "  Signing: Manual (Profile: $PROVISIONING_PROFILE_NAME)"
echo ""
echo "🏗  Building archive..."

# Pass all signing parameters explicitly to xcodebuild for deterministic behavior
xcodebuild archive \
  -workspace "$XCODE_WORKSPACE" \
  -scheme "$XCODE_SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -destination "generic/platform=iOS" \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Manual \
  CODE_SIGN_IDENTITY="Apple Distribution" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  PROVISIONING_PROFILE_SPECIFIER="$PROVISIONING_PROFILE_NAME" \
  PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
  clean archive \
  2>&1 | tee "$LOG_DIR/xcodebuild.log"

if [ $? -ne 0 ]; then
  echo "❌ Archive failed"
  exit 65
fi

if [ ! -d "$ARCHIVE_PATH" ]; then
    echo "❌ ERROR: Archive was not created"
    exit 65
fi

echo "✅ Archive created successfully"

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

if [ $? -ne 0 ]; then
  echo "❌ Export failed"
  exit 70
fi
echo "✅ IPA exported"

IPA_PATH=$(find "$EXPORT_DIR" -name "*.ipa" 2>/dev/null | head -1)

if [[ -z "$IPA_PATH" || ! -f "$IPA_PATH" ]]; then
  echo "❌ ERROR: IPA not found in $EXPORT_DIR" >&2
  exit 70
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
cp "$IPA_PATH" ios/build/export/
cp -r "$ARCHIVE_PATH" ios/build/TradeLine247.xcarchive 2>/dev/null || true

echo ""
echo "📁 Artifacts ready for upload"
ls -la ios/build/export/

# Export IPA_PATH for Fastlane
if [[ -n "${CM_ENV:-}" ]]; then
  echo "IPA_PATH=$IPA_PATH" >> "$CM_ENV"
fi
