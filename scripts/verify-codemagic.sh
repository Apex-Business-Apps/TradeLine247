#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ARCHIVE_PATH="${ARCHIVE_PATH:-$ROOT/ios/build/TradeLine247.xcarchive}"
EXPORT_PATH="${EXPORT_PATH:-$ROOT/ios/build/export}"
OUTPUT_FILE="${OUTPUT_FILE:-$ROOT/build-artifacts-sha256.txt}"

cd "$ROOT"

if [[ ! -d "$ARCHIVE_PATH" ]]; then
  echo "❌ Archive missing at $ARCHIVE_PATH" >&2
  exit 1
fi

shopt -s nullglob
ipas=("${EXPORT_PATH}"/*.ipa)

if [[ ${#ipas[@]} -eq 0 ]]; then
  echo "❌ No IPA found in ${EXPORT_PATH}" >&2
  exit 1
fi

: > "$OUTPUT_FILE"
echo "[verify-codemagic] Computing SHA256 checksums" >&2

archive_dir=$(dirname "$ARCHIVE_PATH")
archive_name=$(basename "$ARCHIVE_PATH")
archive_checksum=$( (cd "$archive_dir" && tar -cf - "$archive_name") | shasum -a 256 | awk '{print $1}' )
printf "%s  %s\n" "$archive_checksum" "$ARCHIVE_PATH" | tee -a "$OUTPUT_FILE"

for ipa in "${ipas[@]}"; do
  shasum -a 256 "$ipa" | tee -a "$OUTPUT_FILE"
done

echo "[verify-codemagic] Checksums written to $OUTPUT_FILE" >&2
