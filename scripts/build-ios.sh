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

log() {
  echo "[build-ios] $*"
}

echo "[build-ios] Working directory: $(pwd)"

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

  if [[ -z "$workspace_input" ]]; then
    echo ""
    return
  fi

  # Strip leading ios/ if provided and make it relative to ios/
  workspace_input="${workspace_input#ios/}"
  workspace_input="${workspace_input#./}"

  if [[ "$workspace_input" == /* ]]; then
    echo "$workspace_input"
  else
    echo "ios/${workspace_input}"
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

  if [[ -d "ios/App" ]]; then
    while IFS= read -r path; do
      candidates+=("$path")
    done < <(find ios/App -maxdepth 2 -name "*.xcworkspace" -type f 2>/dev/null | sort)
  fi

  while IFS= read -r path; do
    # Avoid duplicates
    [[ " ${candidates[*]} " == *" $path "* ]] && continue
    candidates+=("$path")
  done < <(find ios -maxdepth 2 -name "*.xcworkspace" -type f 2>/dev/null | sort)

  local workspace=""
  for candidate in "${candidates[@]}"; do
    searched+=("$candidate")
    if [[ -f "$candidate" ]]; then
      workspace="$candidate"
      break
    fi
  done

  if [[ -z "$workspace" ]]; then
    echo ""
    echo "CRITICAL: Could not find Xcode workspace file!" >&2
    echo "Searched:" >&2
    printf '  - %s\n' "${searched[@]}" >&2
    cat >&2 <<'HINT'
Hint: Ensure Capacitor iOS project exists (npx cap add ios) and that CocoaPods generated an .xcworkspace (check ios/App/Podfile).
HINT
    exit 1
  fi

  echo "$workspace"
}

WORKSPACE_PATH=$(find_workspace "$XCODE_WORKSPACE")

if [[ ! -f "$EXPORT_OPTIONS_PLIST" ]]; then
  echo "❌ Export options plist missing at $EXPORT_OPTIONS_PLIST" >&2
  exit 1
fi

mkdir -p "$(dirname "$ARCHIVE_PATH")" "$EXPORT_PATH"

cat <<INFO
==============================================
🏗️  TradeLine 24/7 iOS Build
==============================================
CWD:       $(pwd)
Workspace: ${WORKSPACE_PATH}
Scheme:    ${XCODE_SCHEME}
Config:    ${CONFIGURATION}
Archive:   ${ARCHIVE_PATH}
Export:    ${EXPORT_PATH}
==============================================
INFO

log "Archiving app..."
xcodebuild archive \
  -workspace "${WORKSPACE_PATH}" \
  -scheme "${XCODE_SCHEME}" \
  -configuration "${CONFIGURATION}" \
  -destination "generic/platform=iOS" \
  -archivePath "${ARCHIVE_PATH}" \
  -allowProvisioningUpdates \
  clean archive

log "Exporting IPA..."
xcodebuild -exportArchive \
  -archivePath "${ARCHIVE_PATH}" \
  -exportOptionsPlist "${EXPORT_OPTIONS_PLIST}" \
  -exportPath "${EXPORT_PATH}" \
  -allowProvisioningUpdates

IPA_PATH=$(find "${EXPORT_PATH}" -maxdepth 1 -name "*.ipa" -print0 | xargs -0 ls -t 2>/dev/null | head -1 || true)

if [[ -z "${IPA_PATH}" || ! -f "${IPA_PATH}" ]]; then
  echo "❌ IPA not found in ${EXPORT_PATH}" >&2
  exit 70
fi

export IPA_PATH
printf "%s" "${IPA_PATH}" > "${EXPORT_PATH}/ipa_path.txt"

cat <<SUCCESS
==============================================
✅ BUILD SUCCESSFUL
Archive: ${ARCHIVE_PATH}
IPA:     ${IPA_PATH}
==============================================
SUCCESS
