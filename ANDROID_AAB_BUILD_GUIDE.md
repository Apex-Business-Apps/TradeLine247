# Android AAB Production Build - Deployment Guide

## ✅ Completed Configuration

### Package Name Update
- **Old:** `com.apex.tradeline`
- **New:** `com.tradeline247ai.app`
- ✅ Updated in `capacitor.config.ts`
- ✅ Automatically applied to `android/app/build.gradle`

### Signing Configuration
- ✅ Build.gradle configured to read from `keystore.properties`
- ✅ Signing config added with conditional application
- ✅ Gitignore updated to exclude sensitive keystore files

---

## 🔐 Keystore Setup Required

The build configuration is ready, but you need to provide the **production keystore** to complete the build.

### Expected Keystore Details
```
Keystore File: upload-keystore.jks
Key Alias: tradeline247-release
SHA1 Fingerprint: 9C:F2:CA:96:A5:FB:50:68:DD:64:4F:E6:E0:71:49:5D:95:75:04:39
Passwords: Admin143!
```

---

## 📋 Option 1: Local Windows Build (Your Original Plan)

If you're building on your **Windows 11 machine** where the keystore exists at `C:\Users\sinyo\.android\upload-keystore.jks`:

### Step 1: Copy Keystore
```powershell
# Copy keystore to project
Copy-Item "C:\Users\sinyo\.android\upload-keystore.jks" "android\upload-keystore.jks"
```

### Step 2: Create keystore.properties
```powershell
# Create android\keystore.properties with this content:
@"
storePassword=Admin143!
keyPassword=Admin143!
keyAlias=tradeline247-release
storeFile=upload-keystore.jks
"@ | Out-File -FilePath android\keystore.properties -Encoding ASCII
```

### Step 3: Build AAB
```powershell
# Run the build
npm run build:android

# Or manual steps:
npm run build
npx cap sync android
cd android
.\gradlew bundleRelease
```

### Step 4: Verify AAB
```powershell
# Check AAB exists
Get-Item android\app\build\outputs\bundle\release\app-release.aab

# Verify signature with keytool
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -printcert -jarfile android\app\build\outputs\bundle\release\app-release.aab | Select-String "SHA1"
# Expected: SHA1: 9C:F2:CA:96:A5:FB:50:68:DD:64:4F:E6:E0:71:49:5D:95:75:04:39
```

---

## 📋 Option 2: Linux/CI Build (This Environment)

If you're building in a **Linux environment** (like this one or CI/CD):

### Step 1: Provide Keystore as Base64

On your Windows machine, encode the keystore:
```powershell
# Encode keystore to base64
$bytes = [System.IO.File]::ReadAllBytes("C:\Users\sinyo\.android\upload-keystore.jks")
$base64 = [System.Convert]::ToBase64String($bytes)
$base64 | Out-File keystore_base64.txt
```

### Step 2: Set Environment Variable

In this Linux environment:
```bash
# Set the base64-encoded keystore
export ANDROID_KEYSTORE_BASE64="<paste-base64-content-here>"

# Decode keystore
echo "$ANDROID_KEYSTORE_BASE64" | base64 --decode > android/upload-keystore.jks
chmod 600 android/upload-keystore.jks
```

Or use the provided script:
```bash
export ANDROID_KEYSTORE_BASE64="<paste-base64-content-here>"
bash scripts/decode-keystore.sh android/upload-keystore.jks
```

### Step 3: Create keystore.properties
```bash
cat > android/keystore.properties << 'EOF'
storePassword=Admin143!
keyPassword=Admin143!
keyAlias=tradeline247-release
storeFile=upload-keystore.jks
EOF
```

### Step 4: Build AAB
```bash
npm run build:android

# Or manual:
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

### Step 5: Verify Signature
```bash
# Check AAB exists
ls -lh android/app/build/outputs/bundle/release/app-release.aab

# Verify signature (if keytool is available)
keytool -printcert -jarfile android/app/build/outputs/bundle/release/app-release.aab | grep SHA1
# Expected: SHA1: 9C:F2:CA:96:A5:FB:50:68:DD:64:4F:E6:E0:71:49:5D:95:75:04:39
```

---

## 📋 Option 3: CI/CD (CodeMagic/GitHub Actions)

For automated builds, set these **environment variables** in your CI:

```bash
ANDROID_KEYSTORE_BASE64="<base64-encoded-keystore>"
ANDROID_KEYSTORE_PASSWORD="Admin143!"
ANDROID_KEY_ALIAS="tradeline247-release"
ANDROID_KEY_PASSWORD="Admin143!"
```

**CodeMagic Configuration:**

Add to `codemagic.yaml`:
```yaml
workflows:
  android-capacitor-release:
    name: Android • Capacitor → Play Console
    instance_type: linux_x2
    environment:
      groups:
        - android_signing  # Contains the env vars above
      vars:
        PACKAGE_NAME: "com.tradeline247ai.app"
      java: 17
      node: 20.19.0
    scripts:
      - name: Decode keystore
        script: |
          echo "$ANDROID_KEYSTORE_BASE64" | base64 --decode > android/upload-keystore.jks
          cat > android/keystore.properties << EOF
          storePassword=$ANDROID_KEYSTORE_PASSWORD
          keyPassword=$ANDROID_KEY_PASSWORD
          keyAlias=$ANDROID_KEY_ALIAS
          storeFile=upload-keystore.jks
          EOF
      - name: Build release AAB
        script: npm run build:android
    artifacts:
      - android/app/build/outputs/bundle/release/*.aab
```

---

## ⚠️ Critical Package Name Warning

### ❗ IMPORTANT: Verify Play Console Configuration

The package name has been changed from `com.apex.tradeline` to `com.tradeline247ai.app`.

**Before uploading the AAB:**

1. **Check Play Console** at https://play.google.com/console/
2. Verify which package name is registered:
   - If `com.tradeline247ai.app` exists → ✅ Proceed with upload
   - If `com.apex.tradeline` exists → ⚠️ **STOP!** This creates a NEW app

**Impact of Package Name Change:**

| Scenario | Impact |
|----------|--------|
| **Existing app is `com.apex.tradeline`** | Users won't receive updates. This is a NEW app. |
| **Existing app is `com.tradeline247ai.app`** | Safe to upload. This is an update. |
| **No existing app** | Safe to upload. This is initial release. |

**If you need to keep `com.apex.tradeline`:**

Revert the package name change:
```bash
# Edit capacitor.config.ts
sed -i "s/com.tradeline247ai.app/com.apex.tradeline/g" capacitor.config.ts

# Regenerate Android project
npx cap sync android
```

---

## 🧪 Pre-Upload Verification Checklist

Before uploading to Play Console, verify:

```bash
# ✅ 1. AAB exists
[ -f "android/app/build/outputs/bundle/release/app-release.aab" ] && echo "✅ AAB found" || echo "❌ AAB missing"

# ✅ 2. Package name correct
grep "com.tradeline247ai.app" android/app/build.gradle && echo "✅ Package name correct"

# ✅ 3. Signing config present
grep -A 5 "signingConfigs" android/app/build.gradle && echo "✅ Signing configured"

# ✅ 4. Version code set
grep "versionCode" android/app/build.gradle
```

Expected version: **versionCode 1** (increment for each release)

---

## 🚀 Upload to Play Console

### Manual Upload
1. Go to [Google Play Console](https://play.google.com/console/)
2. Select app: **TradeLine 24/7**
3. Navigate to **Internal testing** (or **Production**)
4. Click **Create new release**
5. Upload `android/app/build/outputs/bundle/release/app-release.aab`
6. Fill in release notes
7. **Review** → **Start rollout**

### Automated Upload (CodeMagic)
Add to `codemagic.yaml`:
```yaml
publishing:
  google_play:
    credentials: $GCLOUD_SERVICE_ACCOUNT_CREDENTIALS
    track: internal  # or: alpha, beta, production
    submit_as_draft: true
```

---

## 📊 Build Output Verification

After successful build, you should see:

```
✅ BUILD SUCCESSFUL in Xs

AAB Location: android/app/build/outputs/bundle/release/app-release.aab
Expected Size: 20-35 MB
Package Name: com.tradeline247ai.app
Version Code: 1
Version Name: 1.0
SHA1: 9C:F2:CA:96:A5:FB:50:68:DD:64:4F:E6:E0:71:49:5D:95:75:04:39
```

---

## 🔧 Troubleshooting

### Build fails with "Keystore not found"
**Fix:** Ensure `android/upload-keystore.jks` exists and `android/keystore.properties` points to it

### Build fails with "Wrong password"
**Fix:** Verify passwords in `keystore.properties` match the keystore. Note: `!` must be escaped in some environments.

### SHA1 mismatch after build
**Fix:** You may be using the wrong keystore. Verify with:
```bash
keytool -list -v -keystore android/upload-keystore.jks -alias tradeline247-release
```

### Package name doesn't match Play Console
**Fix:** Verify in Play Console which package name is registered, then update `capacitor.config.ts` accordingly.

---

## 📚 Related Documentation

- [Android Setup Guide](docs/android-setup.md) - Complete Android configuration
- [Android Local Build Guide](docs/android-local-build-guide.md) - Detailed build instructions
- [Google Cloud Credentials](docs/google-cloud-credentials.md) - Service account setup

---

## 🎯 Next Steps

1. **Choose your build environment** (Windows local, Linux CI, or CodeMagic)
2. **Set up the keystore** using one of the options above
3. **Run the build** following the steps for your environment
4. **Verify the AAB** signature matches expected SHA1
5. **Check package name** in Play Console before upload
6. **Upload to Play Console** for internal testing first
7. **Test thoroughly** before production release

---

## 📝 Quick Command Reference

### Windows (PowerShell)
```powershell
# Full build pipeline
Copy-Item "C:\Users\sinyo\.android\upload-keystore.jks" "android\upload-keystore.jks"
# Create keystore.properties (see Step 2 above)
npm run build:android
```

### Linux (Bash)
```bash
# Full build pipeline
export ANDROID_KEYSTORE_BASE64="<your-base64-keystore>"
bash scripts/decode-keystore.sh android/upload-keystore.jks
# Create keystore.properties (see Step 3 above)
npm run build:android
```

---

**Build configuration complete. Ready to build once keystore is provided.**
