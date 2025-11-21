#!/usr/bin/env bash
# =============================================================================
# TradeLine 24/7 - iOS Build Script for Codemagic
# =============================================================================
# Version: 3.1.0 (Merged: Manual signing with workspace detection)
#
# FIX: Provisioning profile is now committed in project.pbxproj, so we don't
#      mutate it at runtime. The App target uses manual signing with explicit
#      PROVISIONING_PROFILE_SPECIFIER for Codemagic builds.
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
echo "📝 Creating ExportOptions.plist..."

cat > "$EXPORT_OPTIONS_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>teamID</key>
    <string>${TEAM_ID}</string>
    <key>destination</key>
    <string>upload</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>${BUNDLE_ID}</key>
        <string>${PROVISIONING_PROFILE_NAME}</string>
    </dict>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>
EOF

# =============================================================================
# BUILD ARCHIVE
# The App target now has manual signing committed in project.pbxproj with
# PROVISIONING_PROFILE_SPECIFIER set, so we don't need to mutate the project.
# We just reinforce the same values here for deterministic Codemagic output.
# =============================================================================
echo ""
echo "[build-ios] Workspace: $XCODE_WORKSPACE"
echo "[build-ios] Scheme: $XCODE_SCHEME"
echo "[build-ios] Configuration: Release"
echo "[build-ios] Signing: Manual (Team: $TEAM_ID, Profile: $PROVISIONING_PROFILE_NAME)"
echo ""
echo "🏗  Running xcodebuild archive..."

# The project file has Manual signing with PROVISIONING_PROFILE_SPECIFIER set for the App target.
# We explicitly pass PROVISIONING_PROFILE_SPECIFIER to ensure xcodebuild finds the profile.
# Pods/Capacitor targets use Automatic signing and will ignore this flag.
xcodebuild archive \
  -workspace "$XCODE_WORKSPACE" \
  -scheme "$XCODE_SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -destination "generic/platform=iOS" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  PROVISIONING_PROFILE_SPECIFIER="$PROVISIONING_PROFILE_NAME" \
  PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
  2>&1 | tee "$LOG_DIR/xcodebuild.log"

if [ ! -d "$ARCHIVE_PATH" ]; then
    echo "❌ ERROR: Archive was not created"
    exit 1
fi

echo "✅ Archive created successfully"

# =============================================================================
# EXPORT IPA
# =============================================================================
echo ""
echo "📦 Exporting IPA..."

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
  -allowProvisioningUpdates \
  2>&1 | tee "$LOG_DIR/export.log"

IPA_PATH=$(find "$EXPORT_DIR" -name "*.ipa" 2>/dev/null | head -1)

if [[ -z "$IPA_PATH" || ! -f "$IPA_PATH" ]]; then
  echo "❌ ERROR: IPA not found in $EXPORT_DIR" >&2
  exit 1
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
