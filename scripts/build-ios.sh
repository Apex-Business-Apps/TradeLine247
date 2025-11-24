#!/usr/bin/env bash
set -euo pipefail

# Always start from project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo "[build-ios] Working directory: $(pwd)"

# --- Core configuration (env-driven with safe defaults) ---
XCODE_WORKSPACE="${XCODE_WORKSPACE:-App/App.xcworkspace}"
XCODE_SCHEME="${XCODE_SCHEME:-App}"
CONFIGURATION="${CONFIGURATION:-Release}"
BUNDLE_ID="${BUNDLE_ID:-com.apex.tradeline}"
TEAM_ID="${TEAM_ID:-NWGUYF42KW}"

IOS_DIR="ios"

# Normalize workspace to always be relative to ios/
if [[ "$XCODE_WORKSPACE" == ios/* ]]; then
  XCODE_WORKSPACE="${XCODE_WORKSPACE#ios/}"
fi

WORKSPACE_ABS_PATH="$PROJECT_ROOT/$IOS_DIR/$XCODE_WORKSPACE"

EXPORT_OPTIONS_PLIST="${EXPORT_OPTIONS_PLIST:-$PROJECT_ROOT/ios/ExportOptions.plist}"
ARCHIVE_PATH="${ARCHIVE_PATH:-$PROJECT_ROOT/ios/build/TradeLine247.xcarchive}"
EXPORT_PATH="${EXPORT_PATH:-$PROJECT_ROOT/ios/build/export}"

log() {
  echo "[build-ios] $*"
}

log "Working directory: $(pwd)"

cat <<INFO
npm run build

log "Syncing Capacitor iOS project..."
npx cap sync ios

echo "[build-ios] Installing CocoaPods dependencies..."
pushd "$PROJECT_ROOT/ios/App" >/dev/null
pod install --repo-update
popd >/dev/null

# Sanity check: workspace must exist after sync + pods
if [[ ! -f "$WORKSPACE_ABS_PATH" ]]; then
  echo "❌ CRITICAL: Xcode workspace not found after Capacitor sync + pod install."
  echo "   Looked for: $WORKSPACE_ABS_PATH"
  exit 1
fi

# Sanity check: bundle id matches expectation
TARGET_BUNDLE_ID="$(
  xcodebuild -showBuildSettings \
    -workspace "$WORKSPACE_ABS_PATH" \
    -scheme "$XCODE_SCHEME" \
    -configuration "$CONFIGURATION" \
    | grep -m1 'PRODUCT_BUNDLE_IDENTIFIER' \
    | awk '{print $3}'
)"

echo "[build-ios] Xcode target bundle id: ${TARGET_BUNDLE_ID}"
if [[ "$TARGET_BUNDLE_ID" != "$BUNDLE_ID" ]]; then
  echo "❌ Bundle ID mismatch. Expected ${BUNDLE_ID}, got ${TARGET_BUNDLE_ID}."
  echo "   Fix the Xcode project to use ${BUNDLE_ID} for the App target (Release)."
  exit 1
fi

echo "[build-ios] Using workspace: $WORKSPACE_ABS_PATH"
echo "[build-ios] Using scheme:   $XCODE_SCHEME"
echo "[build-ios] Configuration:  $CONFIGURATION"

echo "[build-ios] Archiving iOS app..."
xcodebuild archive \
  -workspace "$WORKSPACE_ABS_PATH" \
  -scheme "${XCODE_SCHEME}" \
  -configuration "${CONFIGURATION}" \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  clean archive; then
  echo "❌ xcodebuild archive failed" >&2
  exit 1
fi

if [[ ! -d "$ARCHIVE_PATH" ]]; then
  echo "❌ Archive not created at ${ARCHIVE_PATH}" >&2
  exit 1
fi
log "Archive created"

IPA_PATH="$(find "${EXPORT_PATH}" -maxdepth 1 -name "*.ipa" | head -1)"

IPA_SIZE=$(stat -f%z "$IPA_PATH" 2>/dev/null || stat -c%s "$IPA_PATH" 2>/dev/null || echo "0")
if [[ "$IPA_SIZE" -lt 10000000 ]]; then
  echo "❌ IPA file seems too small (${IPA_SIZE} bytes), likely corrupted" >&2
  exit 70
fi

export IPA_PATH
printf "%s" "$IPA_PATH" > "$EXPORT_PATH/ipa_path.txt"
log "IPA ready: ${IPA_PATH#"$PROJECT_ROOT/"} (${IPA_SIZE} bytes)"

echo "=============================================="
echo "✅ BUILD SUCCESSFUL"
echo "Archive: ${ARCHIVE_PATH}"
echo "IPA:     ${IPA_PATH}"
