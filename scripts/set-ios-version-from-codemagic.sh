#!/usr/bin/env bash
set -eo pipefail

echo "▶️ Setting iOS CFBundleShortVersionString and CFBundleVersion from Codemagic env"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFO_PLIST="$ROOT_DIR/ios/App/App/Info.plist"

if [ ! -f "$INFO_PLIST" ]; then
  echo "❌ Info.plist not found at $INFO_PLIST"
  exit 1
fi

# 1) Marketing version (what users see)
if [ -z "${APP_VERSION:-}" ]; then
  echo "⚠️ APP_VERSION is not set, defaulting to 1.0.1"
  APP_VERSION="1.0.1"
fi

# 2) Build number (must be strictly > previously used 2)
RAW_BUILD_NUMBER="${PROJECT_BUILD_NUMBER:-1}"

if ! [[ "$RAW_BUILD_NUMBER" =~ ^[0-9]+$ ]]; then
  echo "⚠️ PROJECT_BUILD_NUMBER is not numeric ('$RAW_BUILD_NUMBER'), defaulting to 3"
  RAW_BUILD_NUMBER=3
fi

# Guarantee we never go back to 1 or 2
if [ "$RAW_BUILD_NUMBER" -le 2 ]; then
  IOS_BUILD_NUMBER=3
else
  IOS_BUILD_NUMBER="$RAW_BUILD_NUMBER"
fi

echo "Using APP_VERSION=$APP_VERSION, IOS_BUILD_NUMBER=$IOS_BUILD_NUMBER"

plist_set() {
  local key="$1"
  local value="$2"

  if /usr/libexec/PlistBuddy -c "Print :$key" "$INFO_PLIST" > /dev/null 2>&1; then
    /usr/libexec/PlistBuddy -c "Set :$key $value" "$INFO_PLIST"
  else
    /usr/libexec/PlistBuddy -c "Add :$key string $value" "$INFO_PLIST"
  fi
}

plist_set "CFBundleShortVersionString" "$APP_VERSION"
plist_set "CFBundleVersion" "$IOS_BUILD_NUMBER"

echo "✅ Updated Info.plist:"
/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$INFO_PLIST"
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$INFO_PLIST"
