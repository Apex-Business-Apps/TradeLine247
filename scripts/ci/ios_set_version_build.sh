#!/bin/bash
set -e

# ==========================================
# CONFIGURATION
# ==========================================
# Standard Capacitor iOS Info.plist path
PLIST_PATH="ios/App/App/Info.plist"

echo "🚀 Starting iOS Versioning & Build Number Update..."
echo "📍 Target Plist: $PLIST_PATH"

# ==========================================
# PRE-FLIGHT CHECKS
# ==========================================
if [ ! -f "$PLIST_PATH" ]; then
    echo "❌ CRITICAL ERROR: Info.plist not found at $PLIST_PATH"
    echo "📂 Current Directory Layout (ios/):"
    ls -R ios/ | head -n 20
    exit 1
fi

# ==========================================
# CALCULATE BUILD NUMBER
# ==========================================
# Attempt to fetch latest build from TestFlight.
# We use '|| echo 0' to prevent the script from crashing if the API call fails/times out.
echo "🔍 Fetching latest build number from App Store Connect..."
LATEST_BUILD=$(app-store-connect get-latest-testflight-build-number "$BUNDLE_ID" || echo "0")

if [ "$LATEST_BUILD" == "0" ]; then
    echo "⚠️  WARNING: Could not fetch latest build number (or it returned 0)."
    echo "⚙️  Defaulting to safe fallback: 10"
    NEW_BUILD_NUMBER=10
else
    NEW_BUILD_NUMBER=$(($LATEST_BUILD + 1))
    echo "✅ Fetched latest build: $LATEST_BUILD. Incrementing to: $NEW_BUILD_NUMBER"
fi

# ==========================================
# EXECUTE UPDATES (PlistBuddy)
# ==========================================
# We use PlistBuddy as it is the native, safe way to edit Plists on macOS.
# 'Set' assumes the key exists. If keys are missing, we might need 'Add', 
# but standard Capacitor projects have these keys.

echo "📝 Updating CFBundleShortVersionString to $EXPECTED_IOS_VERSION..."
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $EXPECTED_IOS_VERSION" "$PLIST_PATH"

echo "📝 Updating CFBundleVersion to $NEW_BUILD_NUMBER..."
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_BUILD_NUMBER" "$PLIST_PATH"

# ==========================================
# VERIFICATION & EXPORT
# ==========================================
# Read values back to verify success
FINAL_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$PLIST_PATH")
FINAL_BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$PLIST_PATH")

echo "✅ SUCCESS: Info.plist updated."
echo "   Version: $FINAL_VERSION"
echo "   Build:   $FINAL_BUILD"

# Export variable for subsequent Codemagic steps
if [ -n "$CM_ENV" ]; then
    echo "BUILD_NUMBER=$NEW_BUILD_NUMBER" >> $CM_ENV
    echo "📤 Exported BUILD_NUMBER to Codemagic environment."
fi

exit 0
