## TradeLine 24/7 — Production Audit (2025-12-10)

### CI/CD & Release
- ✅ GitHub Actions covers build, lint, typecheck, unit tests, smoke/full e2e, a11y, Lighthouse.
- ✅ Codemagic GOODBUILD (`ios-capacitor-testflight`) matches spec: npm ci, web build, verify scripts, cap sync ios, pods, archive, Fastlane upload.
- ⚠️ P0: No Android Codemagic workflow; added `android-capacitor-play-v2` to produce signed AABs.
- ⚠️ P1: iOS GOODBUILD APP_VERSION was 1.0.0 (risk of marketing version drift); set to 1.0.5.

### iOS (App Store) readiness
- ✅ Xcode workspace/scheme present; provisioning handled in GOODBUILD.
- ✅ Build number uses timestamp; monotonic vs App Store build 218.
- ⚠️ P1: Ensure App Store Connect metadata/privacy kept in sync; not in repo.

### Android (Play Store) readiness
- ⚠️ P0: Android project absent; restored Capacitor android project and versioning (1.0.1 / code 10001).
- ⚠️ P0: Added Codemagic workflow to bundle AAB; requires signing env vars (`ANDROID_KEYSTORE_*`).
- ⚠️ P1: Play Console metadata (Data Safety, screenshots) not in repo—assumed managed in console.

### App Quality & Observability
- ✅ Web build passes verify scripts; no console violations.
- ⚠️ P1: Crash/error reporting setup not verified for mobile binaries; ensure mobile error forwarding aligns with web errorReporter.

### Compliance / Policy surface
- ⚠️ P1: Privacy/terms URLs not audited inside native shells; confirm in App Store/Play listings.
- ⚠️ P2: Permissions minimal; no additional manifest usage declared; confirm matches feature set.

### Risks & Unknowns
- P0: Android signing secrets must be present in Codemagic `android_signing` group; otherwise release signed with debug (not Play-ready).
- P1: Store metadata (screenshots, descriptions, privacy) tracked outside repo.
- P2: Performance/startup metrics not captured here; rely on future telemetry passes.





