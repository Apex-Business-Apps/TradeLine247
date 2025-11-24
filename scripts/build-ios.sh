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

echo "[build-ios] Building web assets..."
if ! npm run build; then
  echo "❌ Web build failed"
  exit 1
fi

echo "[build-ios] Syncing Capacitor iOS project..."
if ! npx cap sync ios; then
  echo "❌ Capacitor sync failed"
  exit 1
fi

# Verify that the Capacitor sync created the expected files
if [ ! -d "$PROJECT_ROOT/ios/App" ]; then
  echo "❌ Capacitor sync did not create ios/App directory"
  exit 1
fi

# Now that Capacitor has synced, check for the workspace
# Normalize XCODE_WORKSPACE so it is always relative to ios/
# If it already starts with "ios/", strip that prefix
if [[ "$XCODE_WORKSPACE" == ios/* ]]; then
  XCODE_WORKSPACE="${XCODE_WORKSPACE#ios/}"
fi

# Use absolute path to ensure it works regardless of cwd
WORKSPACE_PATH="$PROJECT_ROOT/$IOS_DIR/$XCODE_WORKSPACE"

echo "[build-ios] Looking for workspace at: $WORKSPACE_PATH"

# Try main workspace path
if [ ! -f "$WORKSPACE_PATH" ]; then
  echo "⚠️ Primary workspace $WORKSPACE_PATH not found, trying fallback ios/App.xcworkspace"
  WORKSPACE_PATH="$PROJECT_ROOT/$IOS_DIR/App.xcworkspace"
  echo "[build-ios] Trying fallback workspace at: $WORKSPACE_PATH"
fi

if [ ! -f "$WORKSPACE_PATH" ]; then
  echo "❌ CRITICAL: Could not find Xcode workspace file!"
  echo "   Searched locations:"
  echo "     - $PROJECT_ROOT/$IOS_DIR/$XCODE_WORKSPACE"
  echo "     - $PROJECT_ROOT/$IOS_DIR/App.xcworkspace"
  echo ""
  echo "   This usually means Capacitor sync failed to create the iOS project."
  echo "   Check that:"
  echo "   - Capacitor sync completed successfully"
  echo "   - iOS platform is added to the project"
  echo "   - No conflicts in the ios/ directory"
  ls -la "$PROJECT_ROOT/$IOS_DIR/" 2>/dev/null || echo "   ios/ directory not found"
  exit 1
fi

echo "✅ Found workspace at: $WORKSPACE_PATH"

echo "ℹ️ Using workspace: $WORKSPACE_PATH"
echo "ℹ️ Using scheme: $XCODE_SCHEME"
echo "ℹ️ Configuration: $CONFIGURATION"

EXPORT_OPTIONS_PLIST="${EXPORT_OPTIONS_PLIST:-$PROJECT_ROOT/ios/ExportOptions.plist}"
ARCHIVE_PATH="${ARCHIVE_PATH:-$PROJECT_ROOT/ios/build/TradeLine247.xcarchive}"
EXPORT_PATH="${EXPORT_PATH:-$PROJECT_ROOT/ios/build/export}"

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

echo "[build-ios] Installing CocoaPods dependencies..."
pushd "$PROJECT_ROOT/ios/App" >/dev/null
if ! pod install --repo-update; then
  echo "❌ CocoaPods install failed"
  popd >/dev/null
  exit 1
fi
popd >/dev/null

# Verify Podfile.lock was created/updated
if [ ! -f "$PROJECT_ROOT/ios/App/Podfile.lock" ]; then
  echo "❌ Podfile.lock not found after pod install"
  exit 1
fi
echo "✅ CocoaPods dependencies installed"

echo "[build-ios] Archiving app..."
if ! xcodebuild archive \
  -workspace "${WORKSPACE_PATH}" \
  -scheme "${XCODE_SCHEME}" \
  -configuration "${CONFIGURATION}" \
  -destination "generic/platform=iOS" \
  -archivePath "${ARCHIVE_PATH}" \
  -allowProvisioningUpdates \
  clean archive; then
  echo "❌ xcodebuild archive failed"
  exit 1
fi

# Verify archive was created
if [ ! -d "${ARCHIVE_PATH}" ]; then
  echo "❌ Archive not created at ${ARCHIVE_PATH}"
  exit 1
fi
echo "✅ App archived successfully"

echo "[build-ios] Exporting IPA..."
if ! xcodebuild -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS_PLIST}" \
  -exportPath "${EXPORT_PATH}" \
  -allowProvisioningUpdates; then
  echo "❌ xcodebuild exportArchive failed"
  exit 1
fi

echo "✅ IPA exported successfully"

echo "[build-ios] Verifying IPA creation..."
IPA_PATH=$(find "${EXPORT_PATH}" -maxdepth 1 -name "*.ipa" | head -1)

if [[ -z "${IPA_PATH}" || ! -f "${IPA_PATH}" ]]; then
  echo "❌ CRITICAL: IPA file not found in ${EXPORT_PATH}" >&2
  echo "   Contents of export directory:"
  ls -la "${EXPORT_PATH}" 2>/dev/null || echo "   Export directory not found"
  exit 70
fi

# Verify IPA file size (should be at least 10MB for a reasonable app)
IPA_SIZE=$(stat -f%z "${IPA_PATH}" 2>/dev/null || stat -c%s "${IPA_PATH}" 2>/dev/null || echo "0")
if [ "$IPA_SIZE" -lt 10000000 ]; then
  echo "❌ IPA file seems too small (${IPA_SIZE} bytes), likely corrupted"
  exit 70
fi

export IPA_PATH
printf "%s" "${IPA_PATH}" > "${EXPORT_PATH}/ipa_path.txt"
echo "✅ IPA verified: ${IPA_PATH} (${IPA_SIZE} bytes)"

echo "=============================================="
echo "✅ BUILD SUCCESSFUL"
echo "Archive: ${ARCHIVE_PATH}"
echo "IPA:     ${IPA_PATH}"
echo "=============================================="
