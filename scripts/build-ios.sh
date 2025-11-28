#!/usr/bin/env bash
set -euo pipefail

WORKSPACE="${XCODE_WORKSPACE:-ios/App/App.xcworkspace}"
SCHEME="${XCODE_SCHEME:-App}"
CONFIGURATION="${CONFIGURATION:-Release}"
PROFILE_SPECIFIER="TL247_mobpro_tradeline_01"
EXPORT_OPTIONS="/tmp/exportOptions.plist"

echo "[build-ios] Workspace: ${WORKSPACE}"
echo "[build-ios] Scheme:   ${SCHEME}"
echo "[build-ios] Config:   ${CONFIGURATION}"

# Verify that CocoaPods has been installed (xcconfig files should exist)
if [[ ! -f "ios/App/Pods/Target Support Files/Pods-App/Pods-App.release.xcconfig" ]]; then
  echo "[build-ios] ERROR: CocoaPods xcconfig file not found!"
  echo "[build-ios] Make sure 'pod install --repo-update' was run in ios/App directory before this script."
  exit 1
fi
echo "[build-ios] ✅ CocoaPods xcconfig files found"

# Build number is now set in Info.plist by scripts/set-ios-version-from-codemagic.sh
# This script no longer handles versioning to avoid conflicts
XCODEBUILD_EXTRA_ARGS=""

# Archive
echo "[build-ios] Archiving iOS app..."
xcodebuild archive \
  -workspace "${WORKSPACE}" \
  -scheme "${SCHEME}" \
  -configuration "${CONFIGURATION}" \
  -archivePath "${ARCHIVE_PATH}" \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Manual \
  CODE_SIGN_IDENTITY="Apple Distribution: 2755419 Alberta Ltd (NWGUYF42KW)" \
  DEVELOPMENT_TEAM="${TEAM_ID}" \
  PROVISIONING_PROFILE_SPECIFIER="TL247_mobpro_tradeline_01" \
  | xcpretty

# Export IPA
echo "[build-ios] Exporting IPA..."

cat >"${EXPORT_OPTIONS}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store</string>
  <key>signingStyle</key>
  <string>manual</string>
  <key>teamID</key>
  <string>${TEAM_ID}</string>
  <key>provisioningProfiles</key>
  <dict>
    <key>${BUNDLE_ID}</key>
    <string>${PROFILE_SPECIFIER}</string>
  </dict>
  <key>uploadSymbols</key>
  <true/>
  <key>stripSwiftSymbols</key>
  <true/>
  <key>compileBitcode</key>
  <false/>
</dict>
</plist>
EOF

echo "[build-ios] Archiving with manual signing..."
xcodebuild \
  -workspace "${WORKSPACE}" \
  -scheme "${SCHEME}" \
  -configuration "${CONFIGURATION}" \
  -archivePath ios/build/TradeLine247.xcarchive \
  CODE_SIGN_STYLE=Manual \
  DEVELOPMENT_TEAM="${TEAM_ID}" \
  PROVISIONING_PROFILE_SPECIFIER="${PROFILE_SPECIFIER}" \
  archive

echo "[build-ios] Exporting IPA via xcodebuild -exportArchive..."
xcodebuild -exportArchive \
  -archivePath ios/build/TradeLine247.xcarchive \
  -exportOptionsPlist "${EXPORT_OPTIONS}" \
  -exportPath ios/build/export

echo "[build-ios] Locating generated IPA..."
IPA_SOURCE="$(find ios/build/export -type f -name '*.ipa' | head -1)"

if [ -z "${IPA_SOURCE:-}" ] || [ ! -f "${IPA_SOURCE:-/dev/null}" ]; then
  echo "❌ No IPA produced by xcodebuild export" >&2
  exit 70
fi

cp "${IPA_SOURCE}" ios/build/export/TradeLine247.ipa
ABS_IPA_PATH="$(pwd)/ios/build/export/TradeLine247.ipa"
printf "%s" "${ABS_IPA_PATH}" > ipa_path.txt
printf "%s" "${ABS_IPA_PATH}" > ios/build/export/ipa_path.txt

echo "=============================================="
echo "✅ iOS archive & IPA successfully built"
echo "    IPA:     ios/build/export/TradeLine247.ipa"
echo "    Archive: ios/build/TradeLine247.xcarchive"
echo "=============================================="
