#!/usr/bin/env bash
set -euo pipefail

# Ensure we start from the project root regardless of where the script is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

XCODE_WORKSPACE="${XCODE_WORKSPACE:-App/App.xcworkspace}"
XCODE_SCHEME="${XCODE_SCHEME:-App}"
CONFIGURATION="${CONFIGURATION:-Release}"

IOS_DIR="ios"

# Ensure we're in the right directory
echo "[build-ios] Running from: $(pwd)"

# Normalize XCODE_WORKSPACE so it is always relative to ios/
# If it already starts with "ios/", strip that prefix
if [[ "$XCODE_WORKSPACE" == ios/* ]]; then
  XCODE_WORKSPACE="${XCODE_WORKSPACE#ios/}"
fi

# Use absolute path to ensure it works regardless of cwd
WORKSPACE_PATH="$PROJECT_ROOT/$IOS_DIR/$XCODE_WORKSPACE"

# Try main workspace path
if [ ! -f "$WORKSPACE_PATH" ]; then
  echo "⚠️ Workspace $WORKSPACE_PATH not found, trying fallback ios/App.xcworkspace"
  WORKSPACE_PATH="$PROJECT_ROOT/$IOS_DIR/App.xcworkspace"
fi

if [ ! -f "$WORKSPACE_PATH" ]; then
  echo "❌ Could not find any Xcode workspace at:"
  echo "    $PROJECT_ROOT/$IOS_DIR/$XCODE_WORKSPACE"
  echo "    or $PROJECT_ROOT/$IOS_DIR/App.xcworkspace"
  exit 1
fi

echo "ℹ️ Using workspace: $WORKSPACE_PATH"
echo "ℹ️ Using scheme: $XCODE_SCHEME"
echo "ℹ️ Configuration: $CONFIGURATION"

EXPORT_OPTIONS_PLIST="${EXPORT_OPTIONS_PLIST:-$PROJECT_ROOT/ios/ExportOptions.plist}"
ARCHIVE_PATH="${ARCHIVE_PATH:-$PROJECT_ROOT/ios/build/TradeLine247.xcarchive}"
EXPORT_PATH="${EXPORT_PATH:-$PROJECT_ROOT/ios/build/export}"

if [[ ! -f "ios/${XCODE_WORKSPACE}" ]]; then
  echo "❌ Xcode workspace ios/${XCODE_WORKSPACE} not found" >&2
  exit 1
fi

if [[ ! -f "$EXPORT_OPTIONS_PLIST" ]]; then
  echo "❌ Export options plist missing at $EXPORT_OPTIONS_PLIST" >&2
  exit 1
fi

mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_PATH"

cat <<INFO
==============================================
🏗️  TradeLine 24/7 iOS Build
==============================================
Workspace: ios/${XCODE_WORKSPACE}
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
pushd "$PROJECT_ROOT/ios/App" >/dev/null
pod install --repo-update
popd >/dev/null

echo "[build-ios] Archiving app..."
xcodebuild archive \
  -workspace "ios/${XCODE_WORKSPACE}" \
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
