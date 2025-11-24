#!/usr/bin/env bash
set -euo pipefail

# Ensure we start from the project root regardless of where the script is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

XCODE_WORKSPACE="${XCODE_WORKSPACE:-App/App.xcworkspace}"
XCODE_SCHEME="${XCODE_SCHEME:-App}"
CONFIGURATION="${CONFIGURATION:-Release}"

if [[ ! -f "$EXPORT_OPTIONS_PLIST" ]]; then
  echo "❌ Export options plist missing at $EXPORT_OPTIONS_PLIST" >&2
  exit 1
fi

mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_PATH"

echo "=============================================="
echo "🏗️  TradeLine 24/7 iOS Build"
echo "=============================================="
echo "Workspace: ios/${XCODE_WORKSPACE}"
echo "Scheme:    ${XCODE_SCHEME}"
echo "Config:    ${CONFIGURATION}"
echo "Archive:   ${ARCHIVE_PATH}"
echo "Export:    ${EXPORT_PATH}"
echo "=============================================="

echo "[build-ios] Building web assets..."
npm run build

echo "[build-ios] Syncing Capacitor iOS project..."
npx cap sync ios

# Check for workspace AFTER Capacitor sync creates it
if [[ ! -f "ios/${XCODE_WORKSPACE}" ]]; then
  echo "❌ Xcode workspace ios/${XCODE_WORKSPACE} not found" >&2
  exit 1
fi

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
