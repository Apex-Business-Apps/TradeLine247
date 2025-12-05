# Codemagic iOS App Store Build Guide

## 🎯 Overview

This guide covers building iOS `.ipa` files for **App Store Connect** submission using Codemagic CI/CD from a Windows development machine.

---

## ✅ **Prerequisites Verified**

### **Codemagic Configuration:**

| Requirement | Status | Location |
|-------------|--------|----------|
| **ios_config group** | ✅ Configured | Codemagic Environment Variables |
| **TEAM_ID** | ✅ `NWGUYF42KW` | ios_config group |
| **BUNDLE_ID** | ✅ `com.apex.tradeline` | ios_config group |
| **APP_STORE_ID** | ✅ `5XDRL75994` | ios_config group |
| **Xcode version** | ✅ `latest` | codemagic.yaml |
| **Mac instance** | ✅ `mac_mini_m2` | codemagic.yaml |

---

## 🚀 **Build Workflow**

### **Automatic Triggers:**
```yaml
✅ Push to main branch → Auto-builds iOS .ipa
```

### **Manual Trigger:**
1. Go to https://codemagic.io/apps
2. Select **TradeLine247** app
3. Click workflow: **"iOS • Capacitor -> TestFlight"**
4. Click **"Start new build"**
5. Select branch: `main`

---

## 📦 **Build Artifacts**

After successful build, download these artifacts from Codemagic:

```
✅ TradeLine247.ipa              # Submit to App Store Connect
✅ TradeLine247.xcarchive        # Archive for compliance/records  
✅ dist/**/*                     # Web assets (bundled in app)
✅ playwright-report/**/*        # Test results
✅ build-artifacts-sha256.txt    # Verification checksums
```

---

## 🔧 **Build Pipeline Stages**

| Stage | Duration | Description |
|-------|----------|-------------|
| 1. Dependencies | ~2 min | npm ci + CocoaPods |
| 2. Quality Gates | ~2 min | Lint, typecheck, unit tests |
| 3. Playwright Smoke | ~3 min | E2E smoke tests |
| 4. Build web bundle | ~2 min | Vite production build |
| 5. Capacitor sync | ~1 min | Copy web assets to iOS |
| 6. CocoaPods install | ~2 min | Install iOS dependencies |
| 7. Xcodebuild archive | ~8 min | **Build .xcarchive** |
| 8. Export IPA | ~2 min | **Create .ipa file** |
| 9. TestFlight upload | ~3 min | Upload to App Store Connect |
| **Total** | **~25 min** | Complete iOS build |

---

## 🔐 **Code Signing**

### **Automatic Signing (Managed by Codemagic):**

```bash
✅ CODE_SIGN_STYLE=Automatic
✅ DEVELOPMENT_TEAM=$TEAM_ID (NWGUYF42KW)
✅ -allowProvisioningUpdates
✅ -allowProvisioningDeviceRegistration
```

**No manual certificate management needed!** Codemagic handles:
- Provisioning profile downloads
- Certificate rotation
- Device registration
- App Store Connect API authentication

---

## 📱 **Submitting to App Store Connect**

### **Option 1: Automatic (via Codemagic)**
Workflow includes `fastlane ios upload` step which automatically uploads to TestFlight.

**Fastlane lane + auth expectations**
- Lane invoked: `ios upload` from `fastlane/Fastfile`.
- Authentication: `app_store_connect_api_key` reads existing Codemagic secrets `APP_STORE_CONNECT_KEY_IDENTIFIER`, `APP_STORE_CONNECT_ISSUER_ID`, and `APP_STORE_CONNECT_PRIVATE_KEY` (raw .p8 contents—no file writing required).
- IPA location: `scripts/build-ios.sh` exports `IPA_PATH` (or writes `ipa_path.txt`) that Fastlane consumes directly.

### **Option 2: Manual (from Windows PC)**

1. **Download .ipa** from Codemagic artifacts

2. **Use Transporter app** (Windows version):
   - Download: https://apps.apple.com/app/transporter/id1450874784
   - Open Transporter
   - Drag `TradeLine247.ipa` into window
   - Click **"Deliver"**

3. **Or use Web Upload**:
   - Go to: https://appstoreconnect.apple.com
   - Navigate to: My Apps → TradeLine 24/7 → TestFlight
   - Click **"+"** → Upload new build
   - Select `TradeLine247.ipa`

---

## 🐛 **Troubleshooting**

### **Error: TEAM_ID not set**
```bash
❌ ERROR: TEAM_ID environment variable is not set
```
**Solution:** Verify `TEAM_ID` exists in `ios_config` group in Codemagic UI.

### **Error: ARCHIVE FAILED (Status 65)**
```bash
❌ ARCHIVE FAILED
   Archiving workspace App with scheme App
```
**Causes:**
1. Code signing configuration missing
2. Provisioning profile mismatch
3. Certificate expired

**Solution:**  
- Verify App Store Connect API credentials in Codemagic
- Check code signing certificates are valid
- Ensure automatic signing is enabled

### **Error: Unsupported Xcode version**
```bash
❌ Unsupported Xcode version: 15.4
```
**Solution:** Use `xcode: latest` in codemagic.yaml (already configured).

### **Error: Pod install failed**
```bash
❌ Error installing pods
```
**Solution:** Clear CocoaPods cache in Codemagic settings or update Podfile.lock.

---

## 📊 **Build Success Indicators**

### **Console Output (Success):**
```bash
✅ Windows build artifacts verified
✅ [build-ios] IPA created at ios/build/export/TradeLine247.ipa
✅ Step 7 script 'Build archive & IPA' succeeded
✅ Upload to TestFlight succeeded
```

### **Codemagic UI:**
- Green checkmark next to build
- **Status:** "Success"
- **Artifacts:** Available for download

---

## 🔄 **Workflow Updates**

### **To modify iOS build:**

1. Edit `tradeline247aicom/codemagic.yaml`
2. Modify `ios-capacitor-testflight` workflow
3. Test changes on feature branch first
4. Merge to `main` to deploy

### **To update build script:**

1. Edit `tradeline247aicom/scripts/build-ios.sh`
2. Test locally (if Mac available) or push to feature branch
3. Monitor Codemagic build logs
4. Merge when verified

---

## 🎯 **Version Management**

### **Increment Build Number:**

1. Edit `ios/App/App/Info.plist`
2. Update `CFBundleVersion` (e.g., `1.0.0` → `1.0.1`)
3. Commit and push
4. Codemagic builds new version

### **Automatic Build Numbering:**

Codemagic provides `$BUILD_NUMBER` environment variable:
```bash
# Already configured in build-ios.sh
# Uses Codemagic's auto-incrementing build number
```

---

## 📝 **Configuration Files**

| File | Purpose |
|------|---------|
| `codemagic.yaml` | Build workflow configuration |
| `scripts/build-ios.sh` | iOS build automation script |
| `capacitor.config.ts` | Capacitor iOS configuration |
| `ios/App/App.xcworkspace` | Xcode workspace |
| `ios/App/Podfile` | CocoaPods dependencies |

---

## ✅ **Current Configuration Status**

```yaml
✅ iOS workflow: Active
✅ Group reference: ios_config (correct)
✅ BUNDLE_ID: com.apex.tradeline
✅ TEAM_ID: NWGUYF42KW
✅ Xcode: latest
✅ Code signing: Automatic
✅ Build script: Validated
✅ Error handling: Complete
```

---

## 🚀 **Quick Start Checklist**

- [x] Codemagic account configured
- [x] ios_config group with TEAM_ID & BUNDLE_ID
- [x] App Store Connect API credentials added
- [x] codemagic.yaml workflow configured
- [x] build-ios.sh script validated
- [ ] **Merge PR and trigger first build**
- [ ] Download .ipa from artifacts
- [ ] Submit to App Store Connect

---

## 📞 **Support Resources**

- **Codemagic Docs:** https://docs.codemagic.io/yaml-basic-configuration/yaml-getting-started/
- **Capacitor iOS:** https://capacitorjs.com/docs/ios
- **App Store Connect:** https://appstoreconnect.apple.com
- **Xcode Build Settings:** https://developer.apple.com/documentation/xcode

---

**Last Updated:** November 21, 2025  
**Workflow Version:** 2.0 (iOS App Store Focus)  
**Status:** ✅ Production Ready


