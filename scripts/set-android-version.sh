#!/usr/bin/env bash
set -euo pipefail

echo "▶️ Setting Android versionCode and versionName from APP_VERSION"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_GRADLE="$ROOT_DIR/android/app/build.gradle"

if [ ! -f "$BUILD_GRADLE" ]; then
  echo "⚠️ build.gradle not found at $BUILD_GRADLE"
  echo "⚠️ Android project may not be initialized. Skipping version update."
  exit 0
fi

# 1) Marketing version (what users see) - must match iOS
if [ -z "${APP_VERSION:-}" ]; then
  echo "⚠️ APP_VERSION is not set, defaulting to 1.1.0"
  APP_VERSION="1.1.0"
fi

# 2) Parse version: major.minor.patch (e.g., 1.2.3 → versionCode = 10203)
IFS='.' read -ra VERSION_PARTS <<< "$APP_VERSION"
MAJOR="${VERSION_PARTS[0]:-1}"
MINOR="${VERSION_PARTS[1]:-0}"
PATCH="${VERSION_PARTS[2]:-0}"

# Validate all parts are numeric
if ! [[ "$MAJOR" =~ ^[0-9]+$ ]] || ! [[ "$MINOR" =~ ^[0-9]+$ ]] || ! [[ "$PATCH" =~ ^[0-9]+$ ]]; then
  echo "❌ Invalid APP_VERSION format: $APP_VERSION (expected: major.minor.patch)"
  exit 1
fi

# Calculate versionCode: major * 10000 + minor * 100 + patch
# Example: 1.2.3 → 1*10000 + 2*100 + 3 = 10203
VERSION_CODE=$((MAJOR * 10000 + MINOR * 100 + PATCH))

echo "Using APP_VERSION=$APP_VERSION"
echo "Calculated versionCode=$VERSION_CODE (formula: $MAJOR*10000 + $MINOR*100 + $PATCH)"

# Backup original file
cp "$BUILD_GRADLE" "$BUILD_GRADLE.bak"

# Update versionName and versionCode in build.gradle
# Handle both formats:
# 1) versionName "1.0.0" (quoted string)
# 2) versionName = "1.0.0" (assignment style)
# 3) versionCode 1 (integer)
# 4) versionCode = 1 (assignment style)

# Update versionName (replace existing or add if missing)
if grep -q "versionName" "$BUILD_GRADLE"; then
  # Replace existing versionName (handles both quoted and = styles)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS sed
    sed -i '' "s/versionName\s*=\?\s*[\"'][^\"']*[\"']/versionName \"$APP_VERSION\"/g" "$BUILD_GRADLE"
  else
    # Linux sed
    sed -i "s/versionName\s*=\?\s*[\"'][^\"']*[\"']/versionName \"$APP_VERSION\"/g" "$BUILD_GRADLE"
  fi
else
  # Add versionName if missing (find defaultConfig block and add after it)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS sed
    sed -i '' "/defaultConfig\s*{/a\\
        versionName \"$APP_VERSION\"
" "$BUILD_GRADLE"
  else
    # Linux sed
    sed -i "/defaultConfig\s*{/a\\        versionName \"$APP_VERSION\"" "$BUILD_GRADLE"
  fi
fi

# Update versionCode (replace existing or add if missing)
if grep -q "versionCode" "$BUILD_GRADLE"; then
  # Replace existing versionCode (handles both with and without =)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS sed
    sed -i '' "s/versionCode\s*=\?\s*[0-9]\+/versionCode $VERSION_CODE/g" "$BUILD_GRADLE"
  else
    # Linux sed
    sed -i "s/versionCode\s*=\?\s*[0-9]\+/versionCode $VERSION_CODE/g" "$BUILD_GRADLE"
  fi
else
  # Add versionCode if missing (find defaultConfig block and add after it)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS sed
    sed -i '' "/defaultConfig\s*{/a\\
        versionCode $VERSION_CODE
" "$BUILD_GRADLE"
  else
    # Linux sed
    sed -i "/defaultConfig\s*{/a\\        versionCode $VERSION_CODE" "$BUILD_GRADLE"
  fi
fi

# Verify changes
if grep -q "versionName \"$APP_VERSION\"" "$BUILD_GRADLE" && grep -q "versionCode $VERSION_CODE" "$BUILD_GRADLE"; then
  echo "✅ Updated build.gradle:"
  grep "versionName" "$BUILD_GRADLE" || true
  grep "versionCode" "$BUILD_GRADLE" || true
  rm -f "$BUILD_GRADLE.bak"
else
  echo "❌ Failed to update build.gradle correctly. Restoring backup."
  mv "$BUILD_GRADLE.bak" "$BUILD_GRADLE"
  exit 1
fi

echo "✅ Android version management complete"

