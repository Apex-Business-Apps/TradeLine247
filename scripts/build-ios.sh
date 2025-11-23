#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

XCODE_WORKSPACE="${XCODE_WORKSPACE:-App/App.xcworkspace}"
XCODE_SCHEME="${XCODE_SCHEME:-App}"
CONFIGURATION="${CONFIGURATION:-Release}"
EXPORT_OPTIONS_PLIST="${EXPORT_OPTIONS_PLIST:-ios/ExportOptions.plist}"
ARCHIVE_PATH="${ARCHIVE_PATH:-ios/build/TradeLine247.xcarchive}"
EXPORT_PATH="${EXPORT_PATH:-ios/build/export}"

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
