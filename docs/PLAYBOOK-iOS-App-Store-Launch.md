# PLAYBOOK – iOS Public App Store Launch via Codemagic (TradeLine 24/7)

- **When to use**: Shipping a new iOS build to App Store Connect/TestFlight using the GOODBUILD Codemagic workflow.
- **Goal / DoD**: IPA archived and uploaded to App Store Connect with marketing version/build > existing, passing Goodbuild gates; ready for submission/release.
- **Preconditions**
  - App Store Connect app record exists for `com.apex.tradeline`.
  - Codemagic iOS GOODBUILD credentials configured (`ios_config`, `appstore_credentials`).
  - Target versions set: marketing version 1.0.5, build number > 218 (or latest ASC build).
  - Core tests green: `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:e2e:smoke`, `npm run build`.
- **Owner**: Release Engineer / Mobile DevOps.
- **Steps**
  1. Set `APP_VERSION` (marketing) and ensure build numbering is monotonic (timestamp already in GOODBUILD). For 1.0.5, no duplicate build numbers (<current).
  2. Trigger Codemagic workflow `ios-capacitor-testflight` (GOODBUILD).
  3. Confirm steps: `npm ci`, web build, verify scripts, `cap sync ios`, pods install, Info.plist set, archive, export IPA, Fastlane upload.
  4. Verify Codemagic artifacts and TestFlight upload succeeded.
  5. In App Store Connect, attach build to the new version, fill metadata/privacy, and submit for review or release.
  6. Monitor processing; ensure no ITMS errors (build number uniqueness, bundle id).
- **Links / Artifacts**
  - Codemagic workflow: `ios-capacitor-testflight` in `codemagic.yaml`.
  - Artifact: exported IPA in Codemagic artifacts; build appears in TestFlight/ASC.
- **Gotchas**
  - Build number must be > last ASC build (218 shown); timestamp-based APP_BUILD in GOODBUILD satisfies this.
  - Do not alter GOODBUILD structure; if experimenting, clone to `*-v2`.
  - Ensure icons and provisioning match GOODBUILD; do not swap bundle id.





