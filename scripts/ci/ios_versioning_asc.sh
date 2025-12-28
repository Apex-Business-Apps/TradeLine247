#!/usr/bin/env bash
set -euo pipefail

# Fixed app version for this release
APP_VERSION="1.0.7"

# Require App Store Connect app ID
if [[ -z "${APP_STORE_ID:-}" ]]; then
  echo "❌ APP_STORE_ID environment variable is required"
  exit 1
fi

echo "🔍 Fetching latest build number for app $APP_STORE_ID version $APP_VERSION..."

# Get latest build number for this exact app store version
# Use || true to handle case where no builds exist yet
LATEST="$(app-store-connect get-latest-app-store-build-number "$APP_STORE_ID" --app-store-version "$APP_VERSION" 2>/dev/null || true)"

# Handle empty or non-numeric response
if [[ -z "$LATEST" ]] || ! [[ "$LATEST" =~ ^[0-9]+$ ]]; then
  echo "📝 No existing builds found for version $APP_VERSION, starting at 0"
  LATEST=0
else
  echo "📊 Found latest build: $LATEST"
fi

# Calculate next build number
NEXT=$((LATEST + 1))
echo "🎯 Will use build number: $NEXT"

# Change to iOS project directory
cd ios/App

# Apply version numbers using agvtool
echo "🔧 Setting iOS version: $APP_VERSION (build $NEXT)"
xcrun agvtool new-marketing-version "$APP_VERSION"
xcrun agvtool new-version -all "$NEXT"

# Verify immediately
echo "🔍 Verifying version settings..."
ACTUAL_MARKETING=$(xcrun agvtool what-marketing-version | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "")
ACTUAL_BUILD=$(xcrun agvtool what-version | grep -o '[0-9]\+$' || echo "")

if [[ "$ACTUAL_MARKETING" != "$APP_VERSION" ]]; then
  echo "❌ Marketing version verification failed: expected $APP_VERSION, got $ACTUAL_MARKETING"
  exit 1
fi

if [[ "$ACTUAL_BUILD" != "$NEXT" ]]; then
  echo "❌ Build version verification failed: expected $NEXT, got $ACTUAL_BUILD"
  exit 1
fi

# Export NEXT for IPA verification
echo "$NEXT" > /tmp/ios_build_number.txt

# Safe proof (no secrets)
echo "✅ Set marketing version=$APP_VERSION build=$NEXT (latest was $LATEST)"