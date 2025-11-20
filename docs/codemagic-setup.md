# Codemagic Setup — TradeLine 24/7

This guide explains how to configure Codemagic so any Windows developer can trigger reproducible Android/iOS builds and retrieve the resulting artifacts.

---

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20.x (matches `package.json` engines) | Install via [nvm-windows](https://github.com/coreybutler/nvm-windows) and run `nvm use 20` |
| npm   | ≥ 10   | Ships with Node 20 |
| Java  | 17     | Required for Gradle/Android builds |
| Android SDK + NDK | API 34+ | Installed automatically on Codemagic Linux images |
| Xcode | 15.x   | Codemagic `mac_mini_m2` images include 15.x |
| CocoaPods | Latest | `sudo gem install cocoapods` (already present on Codemagic) |
| Fastlane | Latest | `sudo gem install fastlane` (already present on Codemagic) |

Local developers can mirror Codemagic by running the helper scripts:

```powershell
npm ci
npm run lint
npm run typecheck
npm run test:unit
npx playwright install --with-deps chromium
npm run test:e2e:smoke
```

---

## 2. Codemagic project setup

1. **Repository**: `https://github.com/Apex-Business-Apps/TradeLine247`
2. **Working directory**: `tradeline247aicom`
3. **Branch**: `fix/codemagic_build_<date>_america-edmonton` (per release instructions)

### 2.1 Environment groups

Create three environment groups in Codemagic and attach them to the workflows.

#### `shared_ci`
| Variable | Description |
|----------|-------------|
| `NODE_VERSION` | `20.11.1` (optional override) |
| `NPM_VERSION`  | `10` |

#### `android_signing`
| Variable | Format |
|----------|--------|
| `ANDROID_KEYSTORE_BASE64` | Base64 string of `upload-keystore.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | Plain text keystore password |
| `ANDROID_KEY_ALIAS` | e.g. `tradeline247-release` |
| `ANDROID_KEY_PASSWORD` | Alias password |

#### `ios_appstore`
| Variable | Format |
|----------|--------|
| `ASC_API_KEY_ID` | App Store Connect key ID (10 chars) |
| `ASC_API_ISSUER_ID` | Issuer UUID |
| `ASC_API_KEY` | Contents of the `.p8` file (paste entire file) |
| `TEAM_ID` | Apple Developer Team ID |
| `BUNDLE_ID` | `com.apex.tradeline` |
| `PROFILE_NAME` | Name of the distribution provisioning profile used in App Store Connect |

> **Important:** Never paste secrets into source control. Only store them in Codemagic encrypted env groups.

---

## 3. Workflows

`codemagic.yaml` defines three workflows:

| Workflow | Runner | Purpose |
|----------|--------|---------|
| `web-tests-only` | Linux | Lint + typecheck + Vitest + Playwright smoke (no builds) |
| `android-capacitor-release` | Linux x2 | Runs all tests, generates Capacitor Android project, decodes keystore, builds & signs `app-release.aab`, outputs SHA256 |
| `ios-capacitor-testflight` | mac_mini_m2 | Runs tests, syncs iOS, installs Pods, archives & exports IPA, uploads via Fastlane using App Store Connect API key |

Artifacts saved by Codemagic:
- `android/app/build/outputs/bundle/release/app-release.aab`
- `ios/build/export/TradeLine247.ipa`
- `ios/build/TradeLine247.xcarchive`
- Playwright HTML report (`playwright-report`)
- SHA256 checksums (`build-artifacts-sha256.txt`)

---

## 4. Triggering builds from Windows

Use the Codemagic REST API. Replace placeholders (`CM_API_TOKEN`, `workflow_id`, `branch`) before running.

```powershell
$Token = "CM_API_TOKEN"
$AppId = "68f6a9bb2036cf885660ca9f"
$Workflow = "android-capacitor-release"  # or ios-capacitor-testflight / web-tests-only
$Body = @{
    branch = "fix/codemagic_build_20251120_america-edmonton"
    workflow_id = $Workflow
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.codemagic.io/builds" `
  -Headers @{ "x-auth-token" = $Token; "Content-Type" = "application/json" } `
  -Body $Body
```

Codemagic will respond with a `build_id`. Monitor progress at `https://codemagic.io/app/<AppId>/build/<build_id>`.

---

## 5. Local helper scripts

| Script | Description |
|--------|-------------|
| `scripts/decode-keystore.sh` | Decodes `ANDROID_KEYSTORE_BASE64` into `android/keystore.jks` |
| `scripts/build-android.sh` | Builds & signs the Android App Bundle (expects keystore env vars) |
| `scripts/build-ios.sh` | Builds & exports the IPA locally (requires Xcode, Cocoapods) |
| `scripts/verify-codemagic.sh` | Computes SHA256 checksums for generated artifacts |

Example (PowerShell):

```powershell
$env:ANDROID_KEYSTORE_BASE64 = Get-Content .\upload-keystore.jks -Encoding Byte | [System.Convert]::ToBase64String($_)
$env:ANDROID_KEYSTORE_PASSWORD = "******"
$env:ANDROID_KEY_ALIAS = "tradeline247-release"
$env:ANDROID_KEY_PASSWORD = "******"
bash scripts/build-android.sh
bash scripts/verify-codemagic.sh
```

---

## 6. Troubleshooting checklist

| Symptom | Fix |
|---------|-----|
| `android/` folder missing | Run `npx cap sync android` (Codemagic does this automatically in `build-android.sh`) |
| Gradle signing failure | Ensure all four Android signing env vars are populated and Base64 is valid |
| iOS codesign error | Verify provisioning profile name matches `PROFILE_NAME`, Team ID correct, and App Store Connect API key has App Manager rights |
| Playwright can't find browsers | Ensure `npx playwright install --with-deps chromium` step runs before tests |
| `IPA_PATH` missing for Fastlane | `scripts/build-ios.sh` writes `IPA_PATH` into `$CM_ENV`; ensure the script ran before `fastlane ios upload` |

---

## 7. Artifact retrieval & rollback

- Download artifacts from the Codemagic build page under **Artifacts**.
- Verify checksums with `shasum -a 256 <file>`.
- Rollback: redeploy previous successful build or revert Git branch and rerun the workflow.

---

## 8. Security notes

- All secrets live in Codemagic env groups; rotate them quarterly or whenever a team member leaves.
- Never commit keystores, `.p8` keys, or provisioning profiles into the repo.
- `scripts/decode-keystore.sh` ensures keystores are file-mode `600` inside the CI environment.

With these steps every Windows developer can confidently trigger Codemagic builds for Android and iOS, monitor their progress, and download signed artifacts. Use the helper scripts for local verification before running CI to reduce turnaround time.

