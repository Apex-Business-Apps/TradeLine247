#!/usr/bin/env bash
set -euo pipefail

# Required environment variables
if [[ -z "${APP_VERSION:-}" ]]; then
  echo "❌ APP_VERSION environment variable is required"
  exit 1
fi

# Determine build number from Codemagic env vars
BUILD_NUM="${PROJECT_BUILD_NUMBER:-${BUILD_NUMBER:-}}"
if [[ -z "$BUILD_NUM" ]]; then
  echo "❌ Neither PROJECT_BUILD_NUMBER nor BUILD_NUMBER environment variables are set"
  exit 1
fi

# Validate build number is integer
if ! [[ "$BUILD_NUM" =~ ^[0-9]+$ ]]; then
  echo "❌ BUILD_NUM must be an integer, got: $BUILD_NUM"
  exit 1
fi

echo "🔢 Setting iOS version: $APP_VERSION (build $BUILD_NUM)"

# Change to iOS project directory
cd ios/App

PLIST_PATH="App/Info.plist"

# Function to set plist value (add if missing, set if exists)
set_plist() {
  local key="$1"
  local type="$2"
  local value="$3"
  if /usr/libexec/PlistBuddy -c "Print :$key" "$PLIST_PATH" >/dev/null 2>&1; then
    /usr/libexec/PlistBuddy -c "Set :$key $value" "$PLIST_PATH"
  else
    /usr/libexec/PlistBuddy -c "Add :$key $type $value" "$PLIST_PATH"
  fi
}

# Try agvtool first (cleanest approach)
if xcrun agvtool what-marketing-version >/dev/null 2>&1; then
  echo "🎯 Using agvtool for version management"
  xcrun agvtool new-marketing-version "$APP_VERSION"
  xcrun agvtool new-version -all "$BUILD_NUM"
  echo "✅ agvtool version set successfully"
else
  echo "📝 agvtool not configured, using PlistBuddy to patch Info.plist"
  # Ensure Info.plist exists
  if [[ ! -f "$PLIST_PATH" ]]; then
    echo "❌ Info.plist not found at $PLIST_PATH"
    exit 1
  fi

  # Set version values using PlistBuddy
  set_plist CFBundleShortVersionString string "$APP_VERSION"
  set_plist CFBundleVersion string "$BUILD_NUM"
  echo "✅ Info.plist patched successfully"
fi

# HARD FAIL PRECHECK: Read back and validate values
echo "🔍 Running preflight validation..."

# Read values back from plist
ACTUAL_MARKETING_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$PLIST_PATH" 2>/dev/null || echo "")
ACTUAL_BUILD_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$PLIST_PATH" 2>/dev/null || echo "")

echo "📱 Marketing Version: $ACTUAL_MARKETING_VERSION"
echo "🔢 Build Version: $ACTUAL_BUILD_VERSION"

# Validate marketing version
if [[ "$ACTUAL_MARKETING_VERSION" != "$APP_VERSION" ]]; then
  echo "❌ CRITICAL: Marketing version mismatch! Expected: $APP_VERSION, Got: $ACTUAL_MARKETING_VERSION"
  exit 1
fi

# Validate build version is integer
if ! [[ "$ACTUAL_BUILD_VERSION" =~ ^[0-9]+$ ]]; then
  echo "❌ CRITICAL: Build version is not an integer! Got: $ACTUAL_BUILD_VERSION"
  exit 1
fi

echo "✅ Preflight validation passed - ready for build"