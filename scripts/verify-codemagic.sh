#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARTIFACTS=()
OUTPUT_FILE="$ROOT/build-artifacts-sha256.txt"
: > "$OUTPUT_FILE"

android_aab="$ROOT/android/app/build/outputs/bundle/release/app-release.aab"
ios_ipa="$ROOT/ios/build/export/TradeLine247.ipa"
web_dist="$ROOT/dist"

if [[ -f "$android_aab" ]]; then
  ARTIFACTS+=("$android_aab")
else
  echo "[verify-codemagic] Android bundle missing at $android_aab"
fi

if [[ -f "$ios_ipa" ]]; then
  ARTIFACTS+=("$ios_ipa")
else
  echo "[verify-codemagic] iOS IPA missing at $ios_ipa"
fi

if [[ -d "$web_dist" ]]; then
  ARTIFACTS+=("$web_dist")
else
  echo "[verify-codemagic] Web dist folder missing at $web_dist"
fi

if [[ ${#ARTIFACTS[@]} -eq 0 ]]; then
  echo "[verify-codemagic] No artifacts found. Did the build run?" >&2
  exit 1
fi

echo "[verify-codemagic] Computing SHA256 checksums"
for path in "${ARTIFACTS[@]}"; do
  if [[ -d "$path" ]]; then
    tarball="$path.tar.gz"
    tar -czf "$tarball" -C "$(dirname "$path")" "$(basename "$path")"
    shasum -a 256 "$tarball" | tee -a "$OUTPUT_FILE"
  else
    shasum -a 256 "$path" | tee -a "$OUTPUT_FILE"
  fi
done

echo "[verify-codemagic] Checksums written to $OUTPUT_FILE"

