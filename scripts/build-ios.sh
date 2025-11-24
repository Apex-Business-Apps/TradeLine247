#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Workspace / scheme detection with env overrides
: "${XCODE_WORKSPACE:=App/App.xcworkspace}"
: "${XCODE_SCHEME:=App}"
CONFIGURATION="${CONFIGURATION:-Release}"

IOS_DIR="ios"

# Normalize XCODE_WORKSPACE so it is always relative to ios/
# If it already starts with "ios/", strip that prefix
if [[ "$XCODE_WORKSPACE" == ios/* ]]; then
  XCODE_WORKSPACE="${XCODE_WORKSPACE#ios/}"
fi

WORKSPACE_PATH="$IOS_DIR/$XCODE_WORKSPACE"

# Try main workspace path
if [ ! -f "$WORKSPACE_PATH" ]; then
  echo "⚠️ Workspace $WORKSPACE_PATH not found, trying fallback ios/App.xcworkspace"
  WORKSPACE_PATH="$IOS_DIR/App.xcworkspace"
fi

if [ ! -f "$WORKSPACE_PATH" ]; then
  echo "❌ Could not find any Xcode workspace at:"
  echo "    $IOS_DIR/$XCODE_WORKSPACE"
  echo "    or $IOS_DIR/App.xcworkspace"
  exit 1
fi

echo "ℹ️ Using workspace: $WORKSPACE_PATH"
echo "ℹ️ Using scheme: $XCODE_SCHEME"
echo "ℹ️ Configuration: $CONFIGURATION"

EXPORT_OPTIONS_PLIST="${EXPORT_OPTIONS_PLIST:-ios/ExportOptions.plist}"
ARCHIVE_PATH="${ARCHIVE_PATH:-ios/build/TradeLine247.xcarchive}"
EXPORT_PATH="${EXPORT_PATH:-ios/build/export}"

if [[ ! -f "$EXPORT_OPTIONS_PLIST" ]]; then
  echo "❌ Export options plist missing at $EXPORT_OPTIONS_PLIST" >&2
  exit 1
fi

mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_PATH"

cat <<INFO
==============================================
🏗️  TradeLine 24/7 iOS Build
==============================================
Workspace: ${WORKSPACE_PATH}
Scheme:    ${XCODE_SCHEME}
Config:    ${CONFIGURATION}
Archive:   ${ARCHIVE_PATH}
Export:    ${EXPORT_PATH}
==============================================
INFO

echo "[build-ios] Building web assets..."
npm run build

echo "[build-ios] Syncing Capacitor iOS project..."
npx cap sync ios

echo "[build-ios] Installing CocoaPods dependencies..."
pushd ios/App >/dev/null
pod install --repo-update
popd >/dev/null

echo "[build-ios] Archiving app..."
xcodebuild archive \
  -workspace "${WORKSPACE_PATH}" \
  -scheme "${XCODE_SCHEME}" \
  -configuration "${CONFIGURATION}" \
  -destination "generic/platform=iOS" \
  -archivePath "${ARCHIVE_PATH}" \
  -allowProvisioningUpdates \
  clean archive

echo "[build-ios] Exporting IPA..."
xcodebuild -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS_PLIST}" \
  -exportPath "${EXPORT_PATH}" \
  -allowProvisioningUpdates

IPA_PATH=$(find "${EXPORT_PATH}" -maxdepth 1 -name "*.ipa" | head -1)

if [[ -z "${IPA_PATH}" || ! -f "${IPA_PATH}" ]]; then
  echo "❌ IPA not found in ${EXPORT_PATH}" >&2
  exit 70
fi

export IPA_PATH
printf "%s" "${IPA_PATH}" > "${EXPORT_PATH}/ipa_path.txt"

echo "=============================================="
echo "✅ BUILD SUCCESSFUL"
echo "Archive: ${ARCHIVE_PATH}"
echo "IPA:     ${IPA_PATH}"
echo "=============================================="
