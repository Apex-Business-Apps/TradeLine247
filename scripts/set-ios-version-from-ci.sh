#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Defaults: APP_VERSION falls back to 1.0.6 for this release; BUILD_NUMBER derives from CI.
APP_VERSION="${APP_VERSION:-1.0.6}"
BUILD_NUMBER="${PROJECT_BUILD_NUMBER:-${CM_BUILD_NUMBER:-${BUILD_NUMBER:-1}}}"

find_info_plist() {
  mapfile -t plist_candidates < <(find "$ROOT/ios" -name "Info.plist" -maxdepth 5 2>/dev/null || true)

  if [[ ${#plist_candidates[@]} -eq 0 ]]; then
    echo "Error: No Info.plist found under ios/. Aborting." >&2
    exit 1
  fi

  # Prefer the Capacitor app path if present.
  local preferred=""
  for plist in "${plist_candidates[@]}"; do
    if [[ "$plist" == *"/App/App/Info.plist" ]]; then
      preferred="$plist"
      break
    fi
  done

  if [[ -n "$preferred" ]]; then
    echo "$preferred"
  else
    echo "${plist_candidates[0]}"
  fi
}

PLIST_PATH="$(find_info_plist)"

if [[ ! -f "$PLIST_PATH" ]]; then
  echo "Error: Info.plist not found at $PLIST_PATH" >&2
  exit 1
fi

set_plist_value() {
  local key="$1"
  local value="$2"
  /usr/libexec/PlistBuddy -c "Set :$key $value" "$PLIST_PATH" 2>/dev/null || \
    /usr/libexec/PlistBuddy -c "Add :$key string $value" "$PLIST_PATH"
}

echo "Setting CFBundleShortVersionString to $APP_VERSION"
set_plist_value "CFBundleShortVersionString" "$APP_VERSION"

echo "Setting CFBundleVersion to $BUILD_NUMBER"
set_plist_value "CFBundleVersion" "$BUILD_NUMBER"

echo "Updated Info.plist: $PLIST_PATH"

