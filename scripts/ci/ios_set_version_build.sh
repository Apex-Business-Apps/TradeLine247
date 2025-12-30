#!/bin/bash
set -euo pipefail

echo "🚀 Starting iOS Versioning & Build Number Update..."

PLIST_PATH="ios/App/App/Info.plist"
: "${EXPECTED_IOS_VERSION:?EXPECTED_IOS_VERSION is not set}"
if [[ ! -f "$PLIST_PATH" ]]; then
  echo "❌ Info.plist not found at: $PLIST_PATH"
  exit 1
fi

# Determine build number
LATEST_BUILD=""
if [[ -n "${APP_STORE_ID:-}" && "${APP_STORE_ID}" =~ ^[0-9]+$ ]]; then
  echo "🔍 Fetching latest TestFlight build (APP_STORE_ID=$APP_STORE_ID)..."
  set +e
  LATEST_BUILD="$(app-store-connect get-latest-testflight-build-number "$APP_STORE_ID" 2>/dev/null)"
  set -e
fi

if [[ "${LATEST_BUILD}" =~ ^[0-9]+$ ]]; then
  BUILD_NUMBER="$((LATEST_BUILD + 1))"
  echo "✅ Latest build: $LATEST_BUILD → using: $BUILD_NUMBER"
else
  BUILD_NUMBER="$(python3 - <<'PY'
import time
print(int(time.time()*1000))
PY
)"
  echo "⚠️ ASC lookup unavailable → using ms-epoch build: $BUILD_NUMBER"
fi

echo "📝 Setting version=$EXPECTED_IOS_VERSION build=$BUILD_NUMBER ..."
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $EXPECTED_IOS_VERSION" "$PLIST_PATH"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" "$PLIST_PATH"

# Read-back assertions
ACTUAL_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$PLIST_PATH")
ACTUAL_BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$PLIST_PATH")
if [[ "$ACTUAL_VERSION" != "$EXPECTED_IOS_VERSION" ]]; then
  echo "❌ Version mismatch: expected=$EXPECTED_IOS_VERSION actual=$ACTUAL_VERSION"
  exit 1
fi
if [[ ! "$ACTUAL_BUILD" =~ ^[0-9]+$ ]]; then
  echo "❌ Build is not numeric: $ACTUAL_BUILD"
  exit 1
fi

echo "✅ SUCCESS: Info.plist updated."
echo "   Version: $ACTUAL_VERSION"
echo "   Build:   $ACTUAL_BUILD"

# Export for later steps
echo "BUILD_NUMBER=$BUILD_NUMBER" >> "$CM_ENV"
echo "PLIST_PATH=$PLIST_PATH" >> "$CM_ENV"
echo "📤 Exported BUILD_NUMBER and PLIST_PATH to Codemagic env."
