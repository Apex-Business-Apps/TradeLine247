#!/usr/bin/env bash
set -euo pipefail

TARGET_PATH="${1:-android/keystore.jks}"

if [[ -z "${ANDROID_KEYSTORE_BASE64:-}" ]]; then
  echo "[decode-keystore] ANDROID_KEYSTORE_BASE64 is not set. Configure it in Codemagic." >&2
  exit 1
fi

mkdir -p "$(dirname "$TARGET_PATH")"
echo "$ANDROID_KEYSTORE_BASE64" | base64 --decode > "$TARGET_PATH"
chmod 600 "$TARGET_PATH"

echo "[decode-keystore] Keystore written to $TARGET_PATH"

