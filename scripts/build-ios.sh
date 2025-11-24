#!/usr/bin/env bash
set -euo pipefail

# Use environment variables from Codemagic
WORKSPACE="${XCODE_WORKSPACE}"
SCHEME="${XCODE_SCHEME}"
CONFIGURATION="Release"
ARCHIVE_PATH="/Users/builder/clone/ios/build/TradeLine247.xcarchive"
EXPORT_PATH="/Users/builder/clone/ios/build/export"

echo "[build-ios] Using workspace: ${WORKSPACE}"
echo "[build-ios] Using scheme: ${SCHEME}"
echo "[build-ios] Configuration: ${CONFIGURATION}"
echo "[build-ios] Archive path: ${ARCHIVE_PATH}"
echo "[build-ios] Export path: ${EXPORT_PATH}"

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

# Create export options plist
cat > /tmp/exportOptions.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>${TEAM_ID}</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>manual</string>
    <key>signingCertificate</key>
    <string>Apple Distribution</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>${BUNDLE_ID}</key>
        <string>TL247_mobpro_tradeline_01</string>
    </dict>
</dict>
</plist>
EOF

xcodebuild -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportPath "${EXPORT_PATH}" \
  -exportOptionsPlist /tmp/exportOptions.plist \
  -allowProvisioningUpdates \
  | xcpretty

# Find and save IPA path
IPA_PATH=$(find "${EXPORT_PATH}" -name "*.ipa" | head -1)
if [ -z "$IPA_PATH" ]; then
  echo "[build-ios] ERROR: No IPA found in ${EXPORT_PATH}"
  exit 1
fi

echo "[build-ios] ✅ IPA created: ${IPA_PATH}"
echo "${IPA_PATH}" > /Users/builder/clone/ipa_path.txt
