#!/usr/bin/env bash
set -euo pipefail

PLIST="ios/App/App/Info.plist"

# Fail early if plist is missing
if [ ! -f "$PLIST" ]; then
  echo "❌ Info.plist not found at $PLIST"
  exit 1
fi

# Inputs (with safe defaults)
: "${BUNDLE_ID:=com.apex.tradeline}"
: "${APP_NAME:=TradeLine 24/7}"
: "${MARKETING_VERSION:=1.0.0}"      # e.g., 1.0.3
: "${BUILD_NUMBER:=1}"               # integer only

# Helper: set-or-add key
set_plist() {
  local key="$1"; shift
  local type="$1"; shift
  local value="$*"
  if /usr/libexec/PlistBuddy -c "Print :$key" "$PLIST" >/dev/null 2>&1; then
    /usr/libexec/PlistBuddy -c "Set :$key $value" "$PLIST"
  else
    /usr/libexec/PlistBuddy -c "Add :$key $type $value" "$PLIST"
  fi
}

echo "🔧 Patching $PLIST"
set_plist CFBundleIdentifier string "$BUNDLE_ID"
set_plist CFBundleDisplayName string "$APP_NAME"
set_plist CFBundleName string "$APP_NAME"
set_plist CFBundleShortVersionString string "$MARKETING_VERSION"
set_plist CFBundleVersion string "$BUILD_NUMBER"

# Sanity print
/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "$PLIST" || true
/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$PLIST" || true
/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$PLIST" || true
echo "✅ Info.plist patched."
