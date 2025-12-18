#!/usr/bin/env bash
set -euo pipefail

# Dynamic workspace/project detection
IOS_DIR="ios"
WORKSPACE="$(find "$IOS_DIR" -maxdepth 4 -name "*.xcworkspace" -print -quit || true)"
PROJECT="$(find "$IOS_DIR" -maxdepth 4 -name "*.xcodeproj" -print -quit || true)"

if [[ -n "${WORKSPACE}" ]]; then
  echo "[build-ios] ✅ Using workspace: ${WORKSPACE}"
  XCODE_CONTAINER_ARGS=(-workspace "$WORKSPACE")
elif [[ -n "${PROJECT}" ]]; then
  echo "[build-ios] ✅ Using project: ${PROJECT}"
  XCODE_CONTAINER_ARGS=(-project "$PROJECT")
else
  echo "❌ No .xcworkspace or .xcodeproj found under ios/"
  find "$IOS_DIR" -maxdepth 4 -type d -print
  exit 2
fi

# Safe defaults for all variables
SCHEME="${XCODE_SCHEME:-$(basename "${PROJECT:-$WORKSPACE}" | sed 's/\.\(xcodeproj\|xcworkspace\)$//')}"
CONFIGURATION="${CONFIGURATION:-Release}"
PROFILE_SPECIFIER="TL247_mobpro_tradeline_01"
EXPORT_OPTIONS="/tmp/exportOptions.plist"
ARCHIVE_PATH="${ARCHIVE_PATH:-$PWD/ios/build/${SCHEME}.xcarchive}"
EXPORT_PATH="${EXPORT_PATH:-$PWD/ios/build/export}"

# Ensure directories exist
mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_PATH"

echo "[build-ios] Scheme:   ${SCHEME}"
echo "[build-ios] Config:   ${CONFIGURATION}"
echo "[build-ios] Archive:  ${ARCHIVE_PATH}"

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
  "${XCODE_CONTAINER_ARGS[@]}" \
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
  "${XCODE_CONTAINER_ARGS[@]}" \
  -scheme "${SCHEME}" \
  -configuration "${CONFIGURATION}" \
  -archivePath "${ARCHIVE_PATH}" \
  CODE_SIGN_STYLE=Manual \
  DEVELOPMENT_TEAM="${TEAM_ID}" \
  PROVISIONING_PROFILE_SPECIFIER="${PROFILE_SPECIFIER}" \
  archive

echo "[build-ios] Exporting IPA via xcodebuild -exportArchive..."
xcodebuild -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS}" \
  -exportPath "${EXPORT_PATH}"

echo "[build-ios] Locating generated IPA..."
IPA_SOURCE="$(find "${EXPORT_PATH}" -type f -name '*.ipa' | head -1)"

if [ -z "${IPA_SOURCE:-}" ] || [ ! -f "${IPA_SOURCE:-/dev/null}" ]; then
  echo "❌ No IPA produced by xcodebuild export" >&2
  exit 70
fi

IPA_NAME="${SCHEME}.ipa"
FINAL_IPA_PATH="${EXPORT_PATH}/${IPA_NAME}"
cp "${IPA_SOURCE}" "${FINAL_IPA_PATH}"
ABS_IPA_PATH="$(cd "$(dirname "${FINAL_IPA_PATH}")" && pwd)/${IPA_NAME}"
printf "%s" "${ABS_IPA_PATH}" > ipa_path.txt
printf "%s" "${ABS_IPA_PATH}" > "${EXPORT_PATH}/ipa_path.txt"

echo "=============================================="
echo "✅ iOS archive & IPA successfully built"
echo "    IPA:     ${FINAL_IPA_PATH}"
echo "    Archive: ${ARCHIVE_PATH}"
echo "=============================================="
