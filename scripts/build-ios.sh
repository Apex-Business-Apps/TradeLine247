#!/bin/bash
# =============================================================================
# TradeLine 24/7 - iOS Build Script for Codemagic
# =============================================================================
# Version: 3.0.0 (Fixed: Provisioning profile scope)
#
# FIX: Provisioning profile must NOT be passed globally to xcodebuild.
#      Pods/frameworks don't support provisioning profiles.
#      Profile is specified ONLY in ExportOptions.plist for IPA export.
# =============================================================================

set -e
set -o pipefail

# Configuration
BUNDLE_ID="${BUNDLE_ID:-com.apex.tradeline}"
TEAM_ID="${TEAM_ID:-NWGUYF42KW}"
SCHEME="${XCODE_SCHEME:-App}"
PROVISIONING_PROFILE_NAME="${PROVISIONING_PROFILE_NAME:-TL247_mobpro_tradeline_01}"

# Detect workspace
if [ -f "ios/App/App.xcworkspace/contents.xcworkspacedata" ]; then
    WORKSPACE="ios/App/App.xcworkspace"
elif [ -f "ios/App.xcworkspace/contents.xcworkspacedata" ]; then
    WORKSPACE="ios/App.xcworkspace"
else
    echo "❌ ERROR: Could not find Xcode workspace"
    find ios -name "*.xcworkspace" -type d 2>/dev/null || true
    exit 1
fi

echo "=============================================="
echo "🏗️  TradeLine 24/7 iOS Build"
echo "=============================================="
echo "Bundle ID:    $BUNDLE_ID"
echo "Team ID:      $TEAM_ID"
echo "Scheme:       $SCHEME"
echo "Workspace:    $WORKSPACE"
echo "Profile:      $PROVISIONING_PROFILE_NAME"
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
pip install codemagic-cli-tools 2>/dev/null || true

# Fix Xcode project signing
echo ""
echo "🛠️ Forcing manual signing in ios/App/App.xcodeproj/project.pbxproj"

PBXPROJ="ios/App/App.xcodeproj/project.pbxproj"
if [ -f "$PBXPROJ" ]; then
    cp "$PBXPROJ" "${PBXPROJ}.backup"
    sed -i '' 's/CODE_SIGN_STYLE = Automatic;/CODE_SIGN_STYLE = Manual;/g' "$PBXPROJ"
    sed -i '' 's/ProvisioningStyle = Automatic;/ProvisioningStyle = Manual;/g' "$PBXPROJ"
    sed -i '' "s/PRODUCT_BUNDLE_IDENTIFIER = .*;/PRODUCT_BUNDLE_IDENTIFIER = ${BUNDLE_ID};/g" "$PBXPROJ"
    sed -i '' "s/DEVELOPMENT_TEAM = .*;/DEVELOPMENT_TEAM = ${TEAM_ID};/g" "$PBXPROJ"
fi

# Diagnostic output
echo ""
echo "🔐 Signing identities:"
security find-identity -v -p codesigning || true

echo ""
echo "📱 Provisioning profiles:"
ls ~/Library/MobileDevice/Provisioning\ Profiles/ || true

# Create build directory
mkdir -p build

# =============================================================================
# BUILD ARCHIVE
# CRITICAL: Do NOT pass PROVISIONING_PROFILE_SPECIFIER here!
# It applies to ALL targets including Pods which don't support it.
# =============================================================================
echo ""
echo "🏗  Running xcodebuild archive..."

xcodebuild archive \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration Release \
    -archivePath "build/App.xcarchive" \
    -destination "generic/platform=iOS" \
    -allowProvisioningUpdates \
    CODE_SIGN_STYLE=Manual \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    CODE_SIGN_IDENTITY="iPhone Distribution" \
    PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
    2>&1 | tee build/xcodebuild.log

if [ ! -d "build/App.xcarchive" ]; then
    echo "❌ ERROR: Archive was not created"
    exit 1
fi

echo "✅ Archive created successfully"

# =============================================================================
# CREATE EXPORT OPTIONS (Provisioning profile goes HERE, not in archive step)
# =============================================================================
echo ""
echo "📝 Creating ExportOptions.plist..."

cat > build/ExportOptions.plist << EOF
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
# EXPORT IPA
# =============================================================================
echo ""
echo "📦 Exporting IPA..."

xcodebuild -exportArchive \
    -archivePath "build/App.xcarchive" \
    -exportPath "build/ipa" \
    -exportOptionsPlist "build/ExportOptions.plist" \
    -allowProvisioningUpdates \
    2>&1 | tee build/export.log

IPA_FILE=$(find build/ipa -name "*.ipa" 2>/dev/null | head -1)

if [ -z "$IPA_FILE" ]; then
    echo "❌ ERROR: IPA was not created"
    exit 1
fi

echo ""
echo "=============================================="
echo "✅ BUILD SUCCESSFUL"
echo "=============================================="
echo "Archive: build/App.xcarchive"
echo "IPA:     $IPA_FILE"
echo "=============================================="

# Copy artifacts to expected locations
mkdir -p ios/build/export
cp "$IPA_FILE" ios/build/export/
cp -r build/App.xcarchive ios/build/TradeLine247.xcarchive 2>/dev/null || true

echo "📁 Artifacts ready for upload"
ls -la ios/build/export/
