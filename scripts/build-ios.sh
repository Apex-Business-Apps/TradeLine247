#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${XCODE_WORKSPACE:-ios/App/App.xcworkspace}"
SCHEME="${XCODE_SCHEME:-App}"
CONFIGURATION="${CONFIGURATION:-Release}"

echo "[build-ios] Workspace: ${WORKSPACE}"
echo "[build-ios] Scheme:   ${SCHEME}"
echo "[build-ios] Config:   ${CONFIGURATION}"

echo "[build-ios] Ensuring codemagic-cli-tools are available..."
pip3 install codemagic-cli-tools --upgrade

echo "[build-ios] Applying provisioning profiles via xcode-project use-profiles..."
xcode-project use-profiles

echo "[build-ios] Building IPA via xcode-project build-ipa..."
xcode-project build-ipa \
  --workspace "${WORKSPACE}" \
  --scheme "${SCHEME}" \
  --config "${CONFIGURATION}" \
  --log-path /tmp/xcodebuild_logs

echo "[build-ios] Locating generated IPA and .xcarchive..."
set +u
IPA_SOURCE="$(find build -type f -name '*.ipa' | head -1)"
ARCHIVE_SOURCE="$(find build -type d -name '*.xcarchive' | head -1)"
set -u

if [ -z "${IPA_SOURCE:-}" ] || [ ! -f "${IPA_SOURCE:-/dev/null}" ]; then
  echo "❌ No IPA produced by xcode-project build-ipa" >&2
  exit 70
fi

mkdir -p ios/build/export ios/build

cp "${IPA_SOURCE}" ios/build/export/TradeLine247.ipa
ABS_IPA_PATH="$(pwd)/ios/build/export/TradeLine247.ipa"
printf "%s" "${ABS_IPA_PATH}" > ipa_path.txt
printf "%s" "${ABS_IPA_PATH}" > ios/build/export/ipa_path.txt

if [ -n "${ARCHIVE_SOURCE:-}" ] && [ -d "${ARCHIVE_SOURCE:-}" ]; then
  rm -rf ios/build/TradeLine247.xcarchive
  cp -R "${ARCHIVE_SOURCE}" ios/build/TradeLine247.xcarchive
fi

echo "=============================================="
echo "✅ iOS archive & IPA successfully built"
echo "    IPA:     ios/build/export/TradeLine247.ipa"
echo "    Archive: ios/build/TradeLine247.xcarchive"
echo "=============================================="
