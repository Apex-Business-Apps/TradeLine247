#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TEAM_ID="${TEAM_ID:-NWGUYF42KW}"
BUNDLE_ID="${BUNDLE_ID:-com.apex.tradeline}"
XCODE_WORKSPACE="${XCODE_WORKSPACE:-ios/App/App.xcworkspace}"
XCODE_SCHEME="${XCODE_SCHEME:-App}"
PROVISIONING_PROFILE_NAME="${PROVISIONING_PROFILE_NAME:-TL247_mobpro_tradeline_01}"
ARCHIVE_PATH="${ARCHIVE_PATH:-$ROOT/build/App.xcarchive}"
EXPORT_DIR="$ROOT/build/ipa"
LOG_DIR="$ROOT/build"
EXPORT_OPTIONS_PLIST="${EXPORT_OPTIONS_PLIST:-$ROOT/ios/ExportOptions.plist}"

mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_DIR" "$LOG_DIR" /tmp/xcodebuild_logs ios/build/export

echo "📦 Ensuring node_modules..."
if [[ ! -d "node_modules" ]]; then
  npm ci --legacy-peer-deps
fi

echo "🔧 Building web app..."
npm run build

echo "🔄 Syncing Capacitor iOS project..."
npx cap sync ios

echo "📦 Installing CocoaPods..."
pushd ios/App >/dev/null 2>&1 || pushd ios >/dev/null
pod install --repo-update
popd >/dev/null

echo "🧰 Ensuring codemagic-cli-tools..."
pip3 install --quiet --upgrade codemagic-cli-tools

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

echo "🔐 Signing identities:"
security find-identity -v -p codesigning || true
echo "📱 Provisioning profiles:"
ls ~/Library/MobileDevice/Provisioning\ Profiles/ || true

# Print explicit build context so debugging exit code 65 is easier.
echo "[build-ios] Workspace: $XCODE_WORKSPACE"
echo "[build-ios] Scheme: $XCODE_SCHEME"
echo "[build-ios] Signing (Release): Manual • Team $TEAM_ID • Profile $PROVISIONING_PROFILE_NAME"

# The App target was previously missing a provisioning profile which triggered:
#   "App requires a provisioning profile. Select a provisioning profile..."
# After committing the manual-signing settings to the project we simply
# reinforce the same values here to keep Codemagic output deterministic.
echo "🏗  Running xcodebuild archive..."
xcodebuild archive \
  -workspace "$XCODE_WORKSPACE" \
  -scheme "$XCODE_SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -destination "generic/platform=iOS" \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Manual \
  DEVELOPMENT_TEAM="$TEAM_ID" \
  CODE_SIGN_IDENTITY="iPhone Distribution" \
  PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
  2>&1 | tee "$LOG_DIR/xcodebuild.log"

echo "📦 Exporting IPA..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
  -allowProvisioningUpdates \
  2>&1 | tee "$LOG_DIR/export.log"

IPA_PATH=$(find "$EXPORT_DIR" -name "*.ipa" | head -1)

if [[ -z "$IPA_PATH" || ! -f "$IPA_PATH" ]]; then
  echo "❌ ERROR: IPA not found in $EXPORT_DIR" >&2
  exit 1
fi

echo "📁 Copying IPA to ios/build/export for Fastlane..."
cp "$IPA_PATH" ios/build/export/ 2>/dev/null || true

echo "[build-ios] IPA created at $IPA_PATH"
if [[ -n "${CM_ENV:-}" ]]; then
  echo "IPA_PATH=$IPA_PATH" >> "$CM_ENV"
fi

