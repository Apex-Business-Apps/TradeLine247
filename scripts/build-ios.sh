#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# TradeLine 24/7 iOS Build Script - Enterprise Ready
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Environment variables with defaults (allow env override)
XCODE_WORKSPACE="${XCODE_WORKSPACE:-App/App.xcworkspace}"
XCODE_SCHEME="${XCODE_SCHEME:-App}"
CONFIGURATION="${CONFIGURATION:-Release}"

IOS_DIR="ios"
EXPORT_OPTIONS_PLIST="${EXPORT_OPTIONS_PLIST:-$PROJECT_ROOT/ios/ExportOptions.plist}"
ARCHIVE_PATH="${ARCHIVE_PATH:-$PROJECT_ROOT/ios/build/TradeLine247.xcarchive}"
EXPORT_PATH="${EXPORT_PATH:-$PROJECT_ROOT/ios/build/export}"

echo "[build-ios] Working directory: $(pwd)"

# Confirm ExportOptions.plist exists
if [[ ! -f "$EXPORT_OPTIONS_PLIST" ]]; then
  echo "❌ Export options plist missing at $EXPORT_OPTIONS_PLIST" >&2
  exit 1
fi

# Create build dirs
mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_PATH"

# ============================================================================
# PHASE 1: Build Web Assets
# ============================================================================

echo "[build-ios] Building web assets..."
npm run build

# ============================================================================
# PHASE 2: Capacitor iOS Project Setup
# ============================================================================

echo "[build-ios] Syncing Capacitor iOS project..."
npx cap sync ios

# ============================================================================
# PHASE 3: CocoaPods Dependencies
# ============================================================================

echo "[build-ios] Installing CocoaPods dependencies..."
pushd "$PROJECT_ROOT/ios/App" >/dev/null
pod install --repo-update
popd >/dev/null

# ============================================================================
# PHASE 4: Workspace Verification
# ============================================================================

# Normalize XCODE_WORKSPACE if it has a leading ios/
if [[ "$XCODE_WORKSPACE" == ios/* ]]; then
  XCODE_WORKSPACE="${XCODE_WORKSPACE#ios/}"
fi

PRIMARY_WORKSPACE_PATH="$PROJECT_ROOT/$IOS_DIR/$XCODE_WORKSPACE"
FALLBACK_WORKSPACE_PATH="$PROJECT_ROOT/$IOS_DIR/App.xcworkspace"

echo "[build-ios] Looking for workspace at: $PRIMARY_WORKSPACE_PATH"

if [[ -d "$PRIMARY_WORKSPACE_PATH" ]]; then
  WORKSPACE_PATH="$PRIMARY_WORKSPACE_PATH"
elif [[ -d "$FALLBACK_WORKSPACE_PATH" ]]; then
  echo "⚠️ Primary workspace not found, using fallback $FALLBACK_WORKSPACE_PATH"
  WORKSPACE_PATH="$FALLBACK_WORKSPACE_PATH"
else
  echo "❌ CRITICAL: Could not find Xcode workspace directory!"
  echo "   Searched:"
  echo "     - $PRIMARY_WORKSPACE_PATH"
  echo "     - $FALLBACK_WORKSPACE_PATH"
  echo
  echo "   Hint: Ensure the iOS project exists and CocoaPods generated a .xcworkspace."
  echo "[build-ios] Contents of ios/:"
  ls -la "$PROJECT_ROOT/ios" || true
  echo "[build-ios] Contents of ios/App/:"
  ls -la "$PROJECT_ROOT/ios/App" || true
  exit 1
fi

echo "ℹ️ Using workspace: $WORKSPACE_PATH"
echo "ℹ️ Using scheme: $XCODE_SCHEME"
echo "ℹ️ Configuration: $CONFIGURATION"

# ============================================================================
# PHASE 5: Archive Creation
# ============================================================================

echo "[build-ios] Archiving app..."
xcodebuild archive \
  -workspace "$WORKSPACE_PATH" \
  -scheme "$XCODE_SCHEME" \
  -configuration "$CONFIGURATION" \
  -destination "generic/platform=iOS" \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  clean archive

# Verify archive was created
if [[ ! -d "${ARCHIVE_PATH}" ]]; then
  echo "❌ CRITICAL: Archive directory not found at ${ARCHIVE_PATH}"
  exit 1
fi

# ============================================================================
# PHASE 6: IPA Export
# ============================================================================

echo "[build-ios] Exporting IPA..."
xcodebuild -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS_PLIST}" \
  -exportPath "${EXPORT_PATH}" \
  -allowProvisioningUpdates

# ============================================================================
# PHASE 7: IPA Verification & Export
# ============================================================================

IPA_PATH=$(find "$EXPORT_PATH" -maxdepth 1 -name "*.ipa" | head -1)

if [[ -z "${IPA_PATH:-}" || ! -f "$IPA_PATH" ]]; then
  echo "❌ IPA not found in $EXPORT_PATH" >&2
  exit 70
fi

export IPA_PATH
printf "%s" "$IPA_PATH" > "$EXPORT_PATH/ipa_path.txt"

echo "=============================================="
echo "✅ BUILD SUCCESSFUL"
echo "Archive: $ARCHIVE_PATH"
echo "IPA:     $IPA_PATH"
echo "=============================================="