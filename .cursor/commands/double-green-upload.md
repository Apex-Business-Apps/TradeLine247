# /double-green-upload
Run the "Double Green Upload" sprint:
- Create release branch
- Bump Android versionCode and iOS CFBundleVersion
- Ensure codemagic.yaml:
  - Google Play publishing configured via service account secret env var + track internal
  - App Store Connect publishing configured via API key env vars + internal TestFlight only
  - iOS workflow always detects workspace/project and passes it to xcode-project build-ipa
  - Artifacts include canonical IPA + glob fallback
- Commit in small steps
- Push branch
- Provide final checklist of what to click in Codemagic UI to trigger both workflows (since user has no Mac)
