# Android Local Build Guide - Cost-Effective Approach

This guide shows you how to build Android releases locally using Android Studio, avoiding Codemagic costs while maintaining full control over your builds.

---

## 🎯 Why Build Locally?

- **💰 Cost Savings**: No Codemagic build minutes used
- **⚡ Faster Iteration**: Build and test immediately
- **🔍 Better Debugging**: See errors in real-time
- **🎛️ Full Control**: Customize build process as needed

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Android Studio** | Latest | [Download](https://developer.android.com/studio) |
| **Java** | 17 | Included with Android Studio |
| **Node.js** | 20.x | For building web assets |
| **npm** | ≥ 10 | Ships with Node 20 |

---

## Setup Steps

### 1. Install Android Studio

1. Download from [developer.android.com/studio](https://developer.android.com/studio)
2. Install with default settings
3. Open Android Studio → **More Actions** → **SDK Manager**
4. Install:
   - Android SDK Platform 34
   - Android SDK Build-Tools
   - Android Emulator (optional, for testing)

### 2. Prepare Your Keystore

You'll need a signing keystore for release builds. If you don't have one:

**Create a new keystore:**
```bash
keytool -genkey -v -keystore upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias tradeline247-release
```

**Store securely:**
- Keep `upload-keystore.jks` in a safe location (NOT in git)
- Remember your passwords (keystore password + key password)
- Back it up securely

---

## Build Process

### Step 1: Build Web Assets

```bash
# In your project root
npm ci
npm run build
```

This creates the `dist/` folder with your web app.

### Step 2: Sync Capacitor

```bash
# Sync web assets to Android project
npx cap sync android
```

This updates the `android/` folder with your latest web build.

### Step 3: Open in Android Studio

```bash
# Option 1: Command line
npx cap open android

# Option 2: Manual
# Open Android Studio → File → Open → Select android/ folder
```

### Step 4: Configure Signing (First Time Only)

1. In Android Studio, go to **File** → **Project Structure** → **Modules** → **app**
2. Click **Signing Configs** tab
3. Click **+** to add a new config
4. Fill in:
   - **Name**: `release`
   - **Store File**: Browse to your `upload-keystore.jks`
   - **Store Password**: Your keystore password
   - **Key Alias**: `tradeline247-release` (or your alias)
   - **Key Password**: Your key password
5. Click **OK**

**Or manually edit `android/app/build.gradle`:**

```gradle
android {
    signingConfigs {
        release {
            storeFile file('/path/to/upload-keystore.jks')
            storePassword 'your-keystore-password'
            keyAlias 'tradeline247-release'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### Step 5: Set Version Numbers

**Edit `android/app/build.gradle`:**

```gradle
android {
    defaultConfig {
        versionCode 2        // Increment for each release
        versionName "1.0.0"  // User-visible version
        // ... other config
    }
}
```

### Step 6: Build Release AAB

**In Android Studio:**
1. **Build** → **Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Click **Next**
4. Select your keystore and enter passwords
5. Click **Next**
6. Select **release** build variant
7. Click **Finish**

**Output location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Alternative: Command Line Build

If you prefer command line (faster, no GUI):

### Using the Build Script

```bash
# Set environment variables (PowerShell)
$env:ANDROID_KEYSTORE_PASSWORD = "your-keystore-password"
$env:ANDROID_KEY_ALIAS = "tradeline247-release"
$env:ANDROID_KEY_PASSWORD = "your-key-password"

# Place your keystore at: android/keystore.jks
# (or update the path in scripts/build-android.sh)

# Build
bash scripts/build-android.sh
```

### Manual Gradle Build

```bash
# 1. Build web assets
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Build AAB
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Uploading to Google Play

### Option 1: Google Play Console (Manual)

1. Go to [Google Play Console](https://play.google.com/console/)
2. Select your app: **TradeLine 24/7**
3. Go to **Production** or **Internal testing**
4. Click **Create new release**
5. Upload your `app-release.aab` file
6. Fill in release notes
7. Click **Save** → **Review release** → **Start rollout**

### Option 2: Use Codemagic (Manual Trigger Only)

If you want to use Codemagic's automatic upload feature (but only when you manually trigger it):

1. Go to [Codemagic](https://codemagic.io/)
2. Select your app
3. Click **android-capacitor-release** workflow
4. Click **Start new build** (manual trigger)
5. Codemagic will build AND upload automatically

**Note:** The workflow is configured to NOT auto-trigger, so it won't run on every push.

---

## Version Management

### Current Versions

- **versionCode**: `2` (must increment each release)
- **versionName**: `1.0.0` (user-visible version)

### For Each Release

1. **Increment versionCode** in `android/app/build.gradle`:
   ```gradle
   versionCode 3  // Was 2, now 3
   ```

2. **Update versionName** if needed:
   ```gradle
   versionName "1.0.1"  // Optional: update user-visible version
   ```

3. **Build and upload** the new AAB

---

## Troubleshooting

### "android/ folder not found"

**Fix:**
```bash
npx cap sync android
```

### "Keystore not found"

**Fix:**
- Ensure `upload-keystore.jks` exists
- Check path in `build.gradle` or Android Studio signing config
- Use absolute path if relative path doesn't work

### "Gradle sync failed"

**Fix:**
- File → **Invalidate Caches / Restart** in Android Studio
- Check internet connection (Gradle downloads dependencies)
- Verify `android/build.gradle` has correct repositories

### "Build failed: signing config not found"

**Fix:**
- Ensure signing config is set in `android/app/build.gradle`
- Verify keystore file exists and passwords are correct
- Check that `release` build type uses the signing config

---

## Cost Comparison

| Method | Cost | Speed | Automation |
|--------|------|-------|------------|
| **Android Studio (Local)** | $0 | Fast | Manual |
| **Codemagic (Auto)** | ~$0.08/min | Medium | Automatic |
| **Codemagic (Manual)** | ~$0.08/min | Medium | On-demand |

**Recommendation:** Use Android Studio for regular builds, Codemagic only when you need automated uploads or don't have Android Studio available.

---

## Quick Reference

**Build Command:**
```bash
npm run build && npx cap sync android && cd android && ./gradlew bundleRelease
```

**Output:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

**Upload:**
- Google Play Console → Internal testing → Create release → Upload AAB

---

## Related Documentation

- [Android Setup Guide](./android-setup.md) - Complete Android configuration
- [Codemagic Setup](./codemagic-setup.md) - CI/CD setup (optional)
- [Google Cloud Credentials](./google-cloud-credentials.md) - Service account setup
