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

if [[ -d "ios/App" && -f "ios/App/Podfile" ]]; then
  log "Installing CocoaPods dependencies..."
  pushd ios/App >/dev/null
  pod install --repo-update
  popd >/dev/null
else
  log "Skipping CocoaPods install (Podfile not found)"
fi

normalize_workspace_input() {
  local workspace_input="$1"

  [[ -z "$workspace_input" ]] && return

  workspace_input="${workspace_input#./}"
  workspace_input="${workspace_input#ios/}"

  if [[ "$workspace_input" == /* ]]; then
    echo "$workspace_input"
  else
    echo "$PROJECT_ROOT/ios/${workspace_input}"
  fi
}

find_workspace() {
  local normalized_input
  normalized_input=$(normalize_workspace_input "$1")

  declare -a candidates searched

  if [[ -n "$normalized_input" ]]; then
    candidates+=("$normalized_input")
    searched+=("$normalized_input")
  fi

  if [[ -d "$PROJECT_ROOT/ios/App" ]]; then
    while IFS= read -r path; do
      candidates+=("$path")
    done < <(find "$PROJECT_ROOT/ios/App" -maxdepth 2 -name "*.xcworkspace" -type d 2>/dev/null | sort)
  fi

  while IFS= read -r path; do
    [[ " ${candidates[*]} " == *" $path "* ]] && continue
    candidates+=("$path")
  done < <(find "$PROJECT_ROOT/ios" -maxdepth 3 -name "*.xcworkspace" -type d 2>/dev/null | sort)

  local workspace=""
  for candidate in "${candidates[@]}"; do
    searched+=("$candidate")
    if [[ -e "$candidate" ]]; then
      workspace="$candidate"
      break
    fi
  done

  if [[ -z "$workspace" ]]; then
    echo "CRITICAL: Could not find Xcode workspace!" >&2
    echo "Searched:" >&2
    for path in "${searched[@]}"; do
      display_path=${path#"$PROJECT_ROOT/"}
      echo "  - ${display_path:-$path}" >&2
    done
    cat >&2 <<'HINT'
Hint: Ensure the Capacitor iOS project exists (npx cap add ios), CocoaPods has generated a workspace (check ios/App/Podfile), and rerun pod install.
HINT
    exit 1
  fi

  echo "$workspace"
}

WORKSPACE_PATH=$(find_workspace "$XCODE_WORKSPACE")

if [[ ! -e "$WORKSPACE_PATH" ]]; then
  echo "❌ Workspace not found at $WORKSPACE_PATH" >&2
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
