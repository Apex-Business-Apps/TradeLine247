#!/bin/bash
# =============================================================================
# TradeLine 24/7 - iOS Build Script for Codemagic
# =============================================================================
# Version: 4.0.0 (Manual signing with explicit provisioning profile)
#
# FIX: Use Manual signing configured in project.pbxproj with explicit
#      PROVISIONING_PROFILE_SPECIFIER to prevent "requires provisioning profile"
#      and export failures.
# =============================================================================

set -e
set -o pipefail

# Configuration
BUNDLE_ID="${BUNDLE_ID:-com.apex.tradeline}"
TEAM_ID="${TEAM_ID:-NWGUYF42KW}"
XCODE_WORKSPACE="${XCODE_WORKSPACE:-ios/App/App.xcworkspace}"
XCODE_SCHEME="${XCODE_SCHEME:-App}"
PROVISIONING_PROFILE_NAME="${PROVISIONING_PROFILE_NAME:-TL247_mobpro_tradeline_01}"

# Use Codemagic build dir if available
if [ -n "$CM_BUILD_DIR" ]; then
    BUILD_DIR="$CM_BUILD_DIR"
else
    BUILD_DIR="$(pwd)/build"
fi

ARCHIVE_PATH="$BUILD_DIR/TradeLine247.xcarchive"
EXPORT_DIR="$BUILD_DIR/ipa"
EXPORT_OPTIONS_PLIST="$BUILD_DIR/ExportOptions.plist"

echo "=============================================="
echo "🏗️  TradeLine 24/7 iOS Build"
echo "=============================================="
echo "Bundle ID:    $BUNDLE_ID"
echo "Team ID:      $TEAM_ID"
echo "Scheme:       $XCODE_SCHEME"
echo "Workspace:    $XCODE_WORKSPACE"
echo "Profile:      $PROVISIONING_PROFILE_NAME"
echo "Build Dir:    $BUILD_DIR"
echo "=============================================="

# Build web assets
echo ""
echo "📦 Building web assets..."
npm run build

# Sync Capacitor
echo ""
echo "🔄 Syncing Capacitor iOS..."
npx cap sync ios

# Install CocoaPods
echo ""
echo "📦 Installing CocoaPods..."
cd ios/App
pod install --repo-update
cd ../..

# Ensure codemagic-cli-tools
echo ""
echo "🧰 Ensuring codemagic-cli-tools..."
pip3 install --quiet --upgrade codemagic-cli-tools 2>/dev/null || pip install codemagic-cli-tools 2>/dev/null || true

# Diagnostic output
echo ""
echo "🔐 Signing identities:"
security find-identity -v -p codesigning || true

echo ""
echo "📱 Provisioning profiles:"
ls ~/Library/MobileDevice/Provisioning\ Profiles/ 2>/dev/null || true

# Create build directory
mkdir -p "$BUILD_DIR" "$EXPORT_DIR"

# =============================================================================
# BUILD ARCHIVE with Manual signing
# =============================================================================
echo ""
echo "[build-ios] Running xcodebuild archive"
echo "  Workspace: $XCODE_WORKSPACE"
echo "  Scheme: $XCODE_SCHEME"
echo "  Team ID: $TEAM_ID"
echo "  Bundle ID: $BUNDLE_ID"

xcodebuild archive \
  -workspace "$XCODE_WORKSPACE" \
  -scheme "$XCODE_SCHEME" \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
  CODE_SIGN_STYLE=Manual \
  CODE_SIGN_IDENTITY="Apple Distribution" \
  PROVISIONING_PROFILE_SPECIFIER="$PROVISIONING_PROFILE_NAME" \
  clean archive

if [ $? -ne 0 ]; then
  echo "❌ Archive failed"
  exit 65
fi
echo "✅ Archive succeeded"

if [ ! -d "$ARCHIVE_PATH" ]; then
    echo "❌ ERROR: Archive was not created at $ARCHIVE_PATH"
    exit 65
fi

# =============================================================================
# CREATE EXPORT OPTIONS with Manual signing
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
# EXPORT IPA
# =============================================================================
echo ""
echo "[build-ios] Exporting IPA"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
  -allowProvisioningUpdates

if [ $? -ne 0 ]; then
  echo "❌ Export failed"
  exit 70
fi
echo "✅ IPA exported"

IPA_FILE=$(find "$EXPORT_DIR" -name "*.ipa" 2>/dev/null | head -1)

if [ -z "$IPA_FILE" ]; then
    echo "❌ ERROR: IPA was not created"
    exit 70
fi

echo ""
echo "=============================================="
echo "✅ BUILD SUCCESSFUL"
echo "=============================================="
echo "Archive: $ARCHIVE_PATH"
echo "IPA:     $IPA_FILE"
echo "=============================================="

# Copy artifacts to expected locations for Codemagic
mkdir -p ios/build/export
cp "$IPA_FILE" ios/build/export/ 2>/dev/null || true
cp -r "$ARCHIVE_PATH" ios/build/TradeLine247.xcarchive 2>/dev/null || true

echo "📁 Artifacts ready for upload"
ls -la ios/build/export/ 2>/dev/null || ls -la "$EXPORT_DIR"

# Set IPA_PATH for Fastlane/Codemagic
if [ -n "${CM_ENV:-}" ]; then
  echo "IPA_PATH=$IPA_FILE" >> "$CM_ENV"
fi
