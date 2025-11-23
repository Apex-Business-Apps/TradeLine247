#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE_PATH="$ROOT/ios/build/TradeLine247.xcarchive"
IPA_GLOB="$ROOT/ios/build/export/*.ipa"
OUTPUT_FILE="$ROOT/build-artifacts-sha256.txt"

shopt -s nullglob
ipas=( $IPA_GLOB )

if [[ ! -d "$ARCHIVE_PATH" ]]; then
  echo "❌ Archive missing at $ARCHIVE_PATH" >&2
  exit 1
fi

if [[ ${#ipas[@]} -eq 0 ]]; then
  echo "❌ No IPA found at $IPA_GLOB" >&2
  exit 1
fi

: > "$OUTPUT_FILE"

echo "[verify-codemagic] Computing SHA256 checksums" >&2
shasum -a 256 "$ARCHIVE_PATH" | tee -a "$OUTPUT_FILE"
for ipa in "${ipas[@]}"; do
  shasum -a 256 "$ipa" | tee -a "$OUTPUT_FILE"
done

echo "[verify-codemagic] Checksums written to $OUTPUT_FILE" >&2
