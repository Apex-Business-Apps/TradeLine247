#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

: "${ANDROID_KEYSTORE_PASSWORD:?ANDROID_KEYSTORE_PASSWORD is required}"
: "${ANDROID_KEY_ALIAS:?ANDROID_KEY_ALIAS is required}"
: "${ANDROID_KEY_PASSWORD:?ANDROID_KEY_PASSWORD is required}"

KEYSTORE_PATH="$ROOT/android/keystore.jks"
bash "$ROOT/scripts/decode-keystore.sh" "$KEYSTORE_PATH"

GRADLE_PROPS_DIR="$HOME/.gradle"
GRADLE_PROPS_FILE="$GRADLE_PROPS_DIR/gradle.properties"
mkdir -p "$GRADLE_PROPS_DIR"

cat > "$GRADLE_PROPS_FILE" <<EOF
MY_STORE_FILE=$KEYSTORE_PATH
MY_STORE_PASSWORD=$ANDROID_KEYSTORE_PASSWORD
MY_KEY_ALIAS=$ANDROID_KEY_ALIAS
MY_KEY_PASSWORD=$ANDROID_KEY_PASSWORD
org.gradle.jvmargs=-Xmx2048m
EOF

echo "[build-android] Wrote signing config to $GRADLE_PROPS_FILE"

echo "[build-android] Building web assets"
npm run build:web

echo "[build-android] Syncing Capacitor Android project"
npx cap sync android

pushd android >/dev/null
echo "[build-android] Running Gradle bundleRelease"
./gradlew --stacktrace --warning-mode all clean bundleRelease
popd >/dev/null

AAB_PATH="$ROOT/android/app/build/outputs/bundle/release/app-release.aab"
if [[ -f "$AAB_PATH" ]]; then
  echo "[build-android] Success. Artifact at $AAB_PATH"
else
  echo "[build-android] ERROR: app-release.aab not found" >&2
  exit 1
fi

