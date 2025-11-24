#!/usr/bin/env bash
set -euo pipefail

# Ensure we start from the project root regardless of where the script is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

XCODE_WORKSPACE="${XCODE_WORKSPACE:-App/App.xcworkspace}"
XCODE_SCHEME="${XCODE_SCHEME:-App}"
CONFIGURATION="${CONFIGURATION:-Release}"
ARCHIVE_PATH="${ARCHIVE_PATH:-$PROJECT_ROOT/ios/build/TradeLine247.xcarchive}"
EXPORT_PATH="${EXPORT_PATH:-$PROJECT_ROOT/ios/build/export}"
EXPORT_OPTIONS_PLIST="${EXPORT_OPTIONS_PLIST:-$PROJECT_ROOT/ios/ExportOptions.plist}"

log() {
  echo "[build-ios] $*"
}

log "Working directory: $(pwd)"

log "Building web assets..."
npm run build

log "Syncing Capacitor iOS project..."
npx cap sync ios

# Check for workspace AFTER Capacitor sync creates it (using -d for directory)
if [[ ! -d "ios/${XCODE_WORKSPACE}" ]]; then
  echo "❌ Xcode workspace ios/${XCODE_WORKSPACE} not found" >&2
  exit 1
fi

if [[ ! -f "$EXPORT_OPTIONS_PLIST" ]]; then
  echo "❌ Export options plist missing at $EXPORT_OPTIONS_PLIST" >&2
  exit 1
fi

mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_PATH"

log "Using workspace: ${WORKSPACE_PATH#"$PROJECT_ROOT/"}"
log "Using scheme: $XCODE_SCHEME"
log "Configuration: $CONFIGURATION"
log "Archive path: $ARCHIVE_PATH"
log "Export path: $EXPORT_PATH"

log "Archiving iOS app..."
if ! xcodebuild \
  -workspace "$WORKSPACE_PATH" \
  -scheme "$XCODE_SCHEME" \
  -configuration "$CONFIGURATION" \
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

log "Exporting IPA..."
if ! xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS_PLIST" \
  -exportPath "$EXPORT_PATH" \
  -allowProvisioningUpdates; then
  echo "❌ xcodebuild exportArchive failed" >&2
  exit 1
fi

log "Selecting IPA..."
IPA_PATH=$(find "$EXPORT_PATH" -maxdepth 1 -name "*.ipa" -type f -print0 | xargs -0 ls -t 2>/dev/null | head -1 || true)

if [[ -z "$IPA_PATH" || ! -f "$IPA_PATH" ]]; then
  echo "❌ CRITICAL: IPA file not found in ${EXPORT_PATH}" >&2
  echo "   Contents of export directory:" >&2
  ls -la "$EXPORT_PATH" 2>/dev/null || echo "   Export directory not found" >&2
  exit 70
fi

IPA_SIZE=$(stat -f%z "$IPA_PATH" 2>/dev/null || stat -c%s "$IPA_PATH" 2>/dev/null || echo "0")
if [[ "$IPA_SIZE" -lt 10000000 ]]; then
  echo "❌ IPA file seems too small (${IPA_SIZE} bytes), likely corrupted" >&2
  exit 70
fi

export IPA_PATH
printf "%s" "$IPA_PATH" > "$EXPORT_PATH/ipa_path.txt"
log "IPA ready: ${IPA_PATH#"$PROJECT_ROOT/"} (${IPA_SIZE} bytes)"

cat <<SUCCESS
==============================================
✅ BUILD SUCCESSFUL
Archive: ${ARCHIVE_PATH}
IPA:     ${IPA_PATH}
==============================================
SUCCESS
