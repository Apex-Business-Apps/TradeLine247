#!/usr/bin/env bash
set -euo pipefail

EXPECTED_IOS_VERSION="${EXPECTED_IOS_VERSION:?EXPECTED_IOS_VERSION missing}"
NEXT_BUILD_NUMBER="${NEXT_BUILD_NUMBER:?NEXT_BUILD_NUMBER missing}"

IPA="$(ls -1 build/ios/ipa/*.ipa | head -n1 || true)"
if [[ -z "$IPA" ]]; then
  echo "❌ No IPA found at build/ios/ipa/*.ipa"
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
unzip -q "$IPA" -d "$TMP"

PLIST_IN_IPA="$(find "$TMP/Payload" -maxdepth 4 -name Info.plist | head -n1 || true)"
if [[ -z "$PLIST_IN_IPA" ]]; then
  echo "❌ Could not find Info.plist in IPA"
  echo "🔎 Listing Payload:"
  find "$TMP/Payload" -maxdepth 3 -print || true
  exit 1
fi

V=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$PLIST_IN_IPA")
B=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$PLIST_IN_IPA")

echo "✅ IPA Version: $V"
echo "✅ IPA Build:   $B"

if [[ "$V" != "$EXPECTED_IOS_VERSION" ]]; then
  echo "❌ Version mismatch: expected $EXPECTED_IOS_VERSION got $V"
  exit 1
fi
if [[ "$B" != "$NEXT_BUILD_NUMBER" ]]; then
  echo "❌ Build mismatch: expected $NEXT_BUILD_NUMBER got $B"
  exit 1
fi

echo "✅ IPA version/build verified. Safe to publish."