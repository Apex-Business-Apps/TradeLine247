#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Validate required environment variables
if [[ -z "${TEAM_ID:-}" ]]; then
  echo "❌ ERROR: TEAM_ID environment variable is not set" >&2
  echo "   Required for iOS code signing. Check Codemagic environment configuration." >&2
  exit 1
fi

echo "[build-ios] Configuration"
echo "  TEAM_ID: $TEAM_ID"
echo "  BUNDLE_ID: ${CM_BUNDLE_ID:-$BUNDLE_ID}"

XCODE_WORKSPACE="${XCODE_WORKSPACE:-ios/App/App.xcworkspace}"
XCODE_SCHEME="${XCODE_SCHEME:-App}"
ARCHIVE_PATH="${ARCHIVE_PATH:-$ROOT/ios/build/TradeLine247.xcarchive}"
EXPORT_DIR="${EXPORT_DIR:-$ROOT/ios/build/export}"
EXPORT_OPTIONS_PLIST="${EXPORT_OPTIONS_PLIST:-$ROOT/ios/build/ExportOptions.plist}"

mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_DIR"

echo "[build-ios] Building web assets"
npm run build:web

echo "[build-ios] Syncing Capacitor iOS project"
npx cap sync ios

echo "[build-ios] Fixing Xcode signing configuration"
bash scripts/fix-xcode-signing.sh

echo "[build-ios] Installing CocoaPods"
pushd ios/App >/dev/null
pod install --repo-update
popd >/dev/null

cat > "$EXPORT_OPTIONS_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key><string>app-store</string>
  <key>stripSwiftSymbols</key><true/>
  <key>compileBitcode</key><false/>
</dict>
</plist>
EOF

echo "[build-ios] Running xcodebuild archive"
echo "  Workspace: $XCODE_WORKSPACE"
echo "  Scheme: $XCODE_SCHEME"
echo "  Team ID: $TEAM_ID"
echo "  Bundle ID: ${BUNDLE_ID:-$CM_BUNDLE_ID}"

if command -v xcpretty >/dev/null; then
  xcodebuild \
    -workspace "$XCODE_WORKSPACE" \
    -scheme "$XCODE_SCHEME" \
    -configuration Release \
    -sdk iphoneos \
    -destination "generic/platform=iOS" \
    -archivePath "$ARCHIVE_PATH" \
    -allowProvisioningUpdates \
    -allowProvisioningDeviceRegistration \
    CODE_SIGN_STYLE=Automatic \
    CODE_SIGN_IDENTITY="iPhone Distribution" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    PRODUCT_BUNDLE_IDENTIFIER="${BUNDLE_ID:-$CM_BUNDLE_ID}" \
    clean archive \
    2>&1 | tee /tmp/xcodebuild.log | xcpretty
  
  XCODE_EXIT_CODE=${PIPESTATUS[0]}
else
  xcodebuild \
    -workspace "$XCODE_WORKSPACE" \
    -scheme "$XCODE_SCHEME" \
    -configuration Release \
    -sdk iphoneos \
    -destination "generic/platform=iOS" \
    -archivePath "$ARCHIVE_PATH" \
    -allowProvisioningUpdates \
    -allowProvisioningDeviceRegistration \
    CODE_SIGN_STYLE=Automatic \
    CODE_SIGN_IDENTITY="iPhone Distribution" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    PRODUCT_BUNDLE_IDENTIFIER="${BUNDLE_ID:-$CM_BUNDLE_ID}" \
    clean archive \
    2>&1 | tee /tmp/xcodebuild.log
  
  XCODE_EXIT_CODE=$?
fi

if [[ $XCODE_EXIT_CODE -ne 0 ]]; then
  echo "" >&2
  echo "❌ xcodebuild archive failed with exit code $XCODE_EXIT_CODE" >&2
  echo "" >&2
  echo "=== Last 50 lines of xcodebuild log ===" >&2
  tail -50 /tmp/xcodebuild.log >&2
  echo "" >&2
  exit $XCODE_EXIT_CODE
fi

IPA_PATH="$EXPORT_DIR/TradeLine247.ipa"

echo "[build-ios] Exporting IPA"
if command -v xcpretty >/dev/null; then
  xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
    -exportPath "$EXPORT_DIR" | xcpretty
else
  xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
    -exportPath "$EXPORT_DIR"
fi

if [[ -f "$IPA_PATH" ]]; then
  echo "[build-ios] IPA created at $IPA_PATH"
  if [[ -n "${CM_ENV:-}" ]]; then
    echo "IPA_PATH=$IPA_PATH" >> "$CM_ENV"
  fi
else
  echo "[build-ios] ERROR: IPA not found in $EXPORT_DIR" >&2
  exit 1
fi

