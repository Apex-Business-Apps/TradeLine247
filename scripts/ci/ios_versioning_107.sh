#!/usr/bin/env bash
set -euo pipefail

# Fixed app version for this release
APP_VERSION="1.0.7"

# Require App Store Connect app ID
if [[ -z "${APP_STORE_ID:-}" ]]; then
  echo "❌ APP_STORE_ID environment variable is required"
  exit 1
fi

APP_STORE_APPLE_ID="$APP_STORE_ID"
echo "🔍 Fetching build numbers for app $APP_STORE_APPLE_ID version $APP_VERSION..."

# A) Get latest build number for THIS VERSION train (1.0.7)
LATEST_TRAIN="$(app-store-connect get-latest-app-store-build-number "$APP_STORE_APPLE_ID" --app-store-version "$APP_VERSION" 2>/dev/null || true)"

# B) Get latest build number overall (omit version filter) as safety net
LATEST_OVERALL="$(app-store-connect get-latest-app-store-build-number "$APP_STORE_APPLE_ID" 2>/dev/null || true)"

# Handle empty or non-numeric responses (treat as 0)
if [[ -z "$LATEST_TRAIN" ]] || ! [[ "$LATEST_TRAIN" =~ ^[0-9]+$ ]]; then
  echo "📝 No existing builds found for version $APP_VERSION train, using 0"
  LATEST_TRAIN=0
else
  echo "📊 Latest build in 1.0.7 train: $LATEST_TRAIN"
fi

if [[ -z "$LATEST_OVERALL" ]] || ! [[ "$LATEST_OVERALL" =~ ^[0-9]+$ ]]; then
  echo "📝 No existing builds found overall, using 0"
  LATEST_OVERALL=0
else
  echo "📊 Latest build overall: $LATEST_OVERALL"
fi

# NEXT_BUILD = max(LATEST_TRAIN, LATEST_OVERALL) + 1
if [[ $LATEST_TRAIN -gt $LATEST_OVERALL ]]; then
  NEXT_BUILD=$((LATEST_TRAIN + 1))
  echo "🎯 Train build higher, using: $NEXT_BUILD (train=$LATEST_TRAIN, overall=$LATEST_OVERALL)"
else
  NEXT_BUILD=$((LATEST_OVERALL + 1))
  echo "🎯 Overall build higher, using: $NEXT_BUILD (train=$LATEST_TRAIN, overall=$LATEST_OVERALL)"
fi

# Change to iOS project directory
cd ios/App

# Apply version numbers using agvtool
echo "🔧 Setting iOS version: $APP_VERSION (build $NEXT_BUILD)"
xcrun agvtool new-marketing-version "$APP_VERSION"
xcrun agvtool new-version -all "$NEXT_BUILD"

# Verify immediately
echo "🔍 Verifying version settings..."
xcrun agvtool what-marketing-version
xcrun agvtool what-version

# Persist values for later steps (Codemagic requirement)
echo "APP_VERSION=$APP_VERSION" >> "$CM_ENV"
echo "NEXT_BUILD_NUMBER=$NEXT_BUILD" >> "$CM_ENV"
echo "LATEST_TRAIN=$LATEST_TRAIN" >> "$CM_ENV"
echo "LATEST_OVERALL=$LATEST_OVERALL" >> "$CM_ENV"

# Safe proof (no secrets)
echo "✅ Set version=$APP_VERSION build=$NEXT_BUILD (train=$LATEST_TRAIN overall=$LATEST_OVERALL)"