#!/usr/bin/env bash
set -euo pipefail

# Default to 1.0.1 if not set in environment
APP_VERSION="${APP_VERSION:-1.0.1}"
# Default to a timestamp for local builds if BUILD_NUMBER not set
BUILD_NUMBER="${BUILD_NUMBER:-$(date +%s)}"

echo "🤖 Building Android: v$APP_VERSION ($BUILD_NUMBER)"

# Ensure web assets are fresh
npm run build
npx cap sync android

cd android
./gradlew bundleRelease \
  -Pandroid.injected.version.code=$BUILD_NUMBER \
  -Pandroid.injected.version.name=$APP_VERSION

echo "✅ Artifact: android/app/build/outputs/bundle/release/app-release.aab"

