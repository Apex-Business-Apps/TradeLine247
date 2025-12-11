# PLAYBOOK – Android Public Play Store Launch (TradeLine 24/7)

- **When to use**: Preparing a production Play Store release (AAB) via Codemagic.
- **Goal / DoD**: Signed AAB uploaded to Play Console with versionName/versionCode > current, passing Goodbuild gates; rollout configured to desired track.
- **Preconditions**
  - Google Play Console access with app record ready.
  - Keystore credentials available as environment variables (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`).
  - Version targets chosen (e.g., versionName 1.0.1, versionCode 10001+).
  - Core tests green: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:e2e:smoke`, `npm run build`.
- **Owner**: Release Engineer / Mobile DevOps.
- **Steps**
  1. Bump version inputs: set `ANDROID_VERSION_NAME` and `ANDROID_VERSION_CODE` in Codemagic (or workflow variables) to values > Play Console.
  2. Ensure signing secrets are present in Codemagic `android_signing` group.
  3. Trigger Codemagic workflow `android-capacitor-play-v2`.
  4. Verify job passes all steps and produces `android/app/build/outputs/bundle/release/*.aab`.
  5. Download/inspect AAB (optional): confirm `applicationId com.apex.tradeline`, versionName/versionCode, and signing cert.
  6. Upload AAB to Play Console (internal/closed/open/production track as planned).
  7. Complete Play listing metadata (descriptions, screenshots, Data Safety, privacy URLs).
  8. Start rollout; monitor crash/ANR and vitals.
- **Links / Artifacts**
  - Codemagic workflow: `android-capacitor-play-v2` in `codemagic.yaml`.
  - Artifact: `android/app/build/outputs/bundle/release/*.aab`.
- **Gotchas**
  - Play rejects duplicate or lower `versionCode`; keep monotonic.
  - Ensure signing env vars are set; otherwise build is debug-signed (not Play-acceptable).
  - Keep `applicationId` stable: `com.apex.tradeline`.





