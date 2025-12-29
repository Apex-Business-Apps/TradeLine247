#!/usr/bin/env bash
set -euo pipefail

EXPECTED_IOS_VERSION="${EXPECTED_IOS_VERSION:-1.0.8}"

# Prefer TestFlight latest build + 1; fallback to Codemagic build counter.
APP_STORE_APPLE_ID="${APP_STORE_APPLE_ID:-${APP_STORE_ID:-}}"

LATEST_TF=0
if [[ -n "${APP_STORE_APPLE_ID}" ]]; then
  # This command must exist in your build image already (Codemagic CLI tools).
  # If it fails, we fallback cleanly.
  LATEST_TF="$(app-store-connect get-latest-testflight-build-number "${APP_STORE_APPLE_ID}" 2>/dev/null || true)"
  [[ "${LATEST_TF}" =~ ^[0-9]+$ ]] || LATEST_TF=0
fi

FALLBACK_BUILD="${CM_BUILD_NUMBER:-${BUILD_NUMBER:-0}}"
[[ "${FALLBACK_BUILD}" =~ ^[0-9]+$ ]] || FALLBACK_BUILD=0

NEXT_BUILD_NUMBER=$(( LATEST_TF + 1 ))
# If TF lookup failed (LATEST_TF=0) and fallback is higher, use fallback.
if (( FALLBACK_BUILD > NEXT_BUILD_NUMBER )); then
  NEXT_BUILD_NUMBER="${FALLBACK_BUILD}"
fi
# Ensure > 1 always
if (( NEXT_BUILD_NUMBER < 2 )); then
  NEXT_BUILD_NUMBER=2
fi

echo "✅ Setting iOS version=${EXPECTED_IOS_VERSION} build=${NEXT_BUILD_NUMBER} (latest_tf=${LATEST_TF}, fallback=${FALLBACK_BUILD})"

# Write directly to Info.plist (most reliable for Capacitor setups)
PLIST="ios/App/App/Info.plist"
if [[ ! -f "$PLIST" ]]; then
  echo "❌ Missing Info.plist at $PLIST"
  exit 1
fi

/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString ${EXPECTED_IOS_VERSION}" "$PLIST" \
  || /usr/libexec/PlistBuddy -c "Add :CFBundleShortVersionString string ${EXPECTED_IOS_VERSION}" "$PLIST"

/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${NEXT_BUILD_NUMBER}" "$PLIST" \
  || /usr/libexec/PlistBuddy -c "Add :CFBundleVersion string ${NEXT_BUILD_NUMBER}" "$PLIST"

# Persist across steps
echo "EXPECTED_IOS_VERSION=${EXPECTED_IOS_VERSION}" >> "${CM_ENV}"
echo "NEXT_BUILD_NUMBER=${NEXT_BUILD_NUMBER}" >> "${CM_ENV}"

# Print proof (safe)
V=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$PLIST")
B=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$PLIST")
echo "✅ Info.plist now Version=$V Build=$B"