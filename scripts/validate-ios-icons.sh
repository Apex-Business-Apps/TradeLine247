#!/bin/bash
set -eo pipefail

ASSETS_DIR="ios/App/App/Assets.xcassets"
APPICON_DIR="$ASSETS_DIR/AppIcon.appiconset"
CONTENTS_FILE="$APPICON_DIR/Contents.json"

echo "🔍 Validating iOS app icons..."

# Check Assets.xcassets exists
if [[ ! -d "$ASSETS_DIR" ]]; then
  echo "❌ ERROR: Assets.xcassets directory missing!"
  exit 1
fi

# Check AppIcon.appiconset exists
if [[ ! -d "$APPICON_DIR" ]]; then
  echo "❌ ERROR: AppIcon.appiconset directory missing!"
  exit 1
fi

# Check Contents.json exists
if [[ ! -f "$CONTENTS_FILE" ]]; then
  echo "❌ ERROR: Contents.json missing in AppIcon.appiconset!"
  exit 1
fi

# Count icon files
ICON_COUNT=$(find "$APPICON_DIR" -name "*.png" | wc -l)

if [[ $ICON_COUNT -lt 1 ]]; then
  echo "❌ ERROR: No PNG icons found in AppIcon.appiconset!"
  echo "Directory contents:"
  ls -la "$APPICON_DIR"
  exit 1
fi

echo "✅ Found $ICON_COUNT icon file(s)"

# Validate Contents.json has icon references
ICON_REFS=$(grep -c '"filename"' "$CONTENTS_FILE" || true)

if [[ $ICON_REFS -lt 1 ]]; then
  echo "❌ ERROR: Contents.json has no icon filename references!"
  exit 1
fi

echo "✅ Contents.json references $ICON_REFS icon(s)"

# Verify each referenced icon exists
echo "🔍 Verifying icon file references..."
MISSING=0

while IFS= read -r filename; do
  if [[ -n "$filename" && ! -f "$APPICON_DIR/$filename" ]]; then
    echo "❌ Missing: $filename"
    MISSING=$((MISSING + 1))
  fi
done < <(grep -o '"filename" *: *"[^"]*"' "$CONTENTS_FILE" | sed 's/.*: *"\([^"]*\)"/\1/')

if [[ $MISSING -gt 0 ]]; then
  echo "❌ ERROR: $MISSING icon file(s) referenced but missing!"
  exit 1
fi

echo "✅ All referenced icons exist"
echo "✅ iOS icon validation PASSED"
