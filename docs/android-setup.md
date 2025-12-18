# Android Setup Guide - TradeLine 24/7

This guide covers setting up the Android development environment, configuring Firebase/Google Cloud services, and preparing the app for Google Play publishing.

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20.x | Install via [nvm-windows](https://github.com/coreybutler/nvm-windows) |
| npm | ≥ 10 | Ships with Node 20 |
| Java | 17 | Required for Gradle/Android builds |
| Android Studio | Latest | [Download](https://developer.android.com/studio) |
| Android SDK | API 34+ | Installed via Android Studio |
| Capacitor CLI | Latest | `npm install -g @capacitor/cli` |

---

## Google Cloud Project Information

**Project Details:**
- **Project Name:** TradeLine 247
- **Project Number:** 734793959452
- **Project ID:** `project-c86459e7-415b-4a36-a25`
- **Organization:** apexbusiness-systems-ltd-org

**Console Links:**
- [GCP Dashboard](https://console.cloud.google.com/home/dashboard?project=project-c86459e7-415b-4a36-a25)
- [Firebase Console](https://console.firebase.google.com/project/project-c86459e7-415b-4a36-a25)
- [Google Play Console](https://play.google.com/console/)

---

## Initial Setup

### 1. Initialize Android Project

If the Android project doesn't exist yet:

```bash
# Add Android platform to Capacitor
npx cap add android

# Sync web assets to native project
npx cap sync android
```

### 2. Open in Android Studio

```bash
# Open Android project
npx cap open android
```

Or manually:
- Open Android Studio
- File → Open → Select `android/` folder

---

## Firebase Configuration

### Step 1: Add Android App to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **TradeLine 247** (`project-c86459e7-415b-4a36-a25`)
3. Click **Add app** → **Android**
4. Enter details:
   - **Package name:** `com.apex.tradeline`
   - **App nickname:** `TradeLine 24/7 Android` (optional)
   - **Debug signing certificate SHA-1:** (optional, for Firebase Auth)
5. Click **Register app**
6. Download `google-services.json`
7. Place file in: `android/app/google-services.json`

### Step 2: Configure Gradle Files

**File: `android/build.gradle`**

Ensure the Google Services plugin is in the classpath:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
        // ... other dependencies
    }
}
```

**File: `android/app/build.gradle`**

Add at the bottom of the file:

```gradle
apply plugin: 'com.google.gms.google-services'
```

### Step 3: Verify Configuration

After adding `google-services.json`, sync Gradle:
- In Android Studio: **File** → **Sync Project with Gradle Files**

Verify the file is recognized:
- Check `android/app/google-services.json` exists
- Build should complete without errors

---

## App Configuration

### Version Management

**File: `android/app/build.gradle`**

```gradle
android {
    defaultConfig {
        applicationId "com.apex.tradeline"
        versionCode 2
        versionName "1.0.0"
        // ... other config
    }
}
```

**Version Rules:**
- `versionCode`: Must increment with each release (currently: 2)
- `versionName`: User-visible version (currently: 1.0.0)

### App Icons and Assets

Icons should be placed in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- Multiple densities: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi

Splash screen configuration:
- `android/app/src/main/res/values/styles.xml`

### Permissions

**File: `android/app/src/main/AndroidManifest.xml`**

Required permissions (already configured):
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<!-- Add others as needed -->
```

---

## Push Notifications (FCM) Setup

### Step 1: Firebase Cloud Messaging

1. Firebase Console → **Project Settings** → **Cloud Messaging**
2. Under **Android app configuration**, verify:
   - Package name: `com.apex.tradeline`
   - Server key is available (for server-side sending)

### Step 2: Service Account for Server-Side FCM

1. Firebase Console → **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Download JSON file
4. Extract values for environment variables:
   - `project_id` → `FCM_PROJECT_ID` = `project-c86459e7-415b-4a36-a25`
   - `client_email` → `FCM_CLIENT_EMAIL`
   - `private_key` → `FCM_PRIVATE_KEY` (keep `\n` as literal `\n`)

Or use entire JSON as `FCM_CREDENTIALS_JSON`.

**Set in deployment platform:**
- Vercel: Project Settings → Environment Variables
- Supabase Edge Functions: Secrets

---

## Google Play Publishing Setup

### Step 1: Create Service Account for Google Play

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **TradeLine 247** (`project-c86459e7-415b-4a36-a25`)
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **+ CREATE SERVICE ACCOUNT**
5. Fill in:
   - **Name:** `google-play-publisher`
   - **Description:** `Service account for uploading Android builds to Google Play`
6. Click **CREATE AND CONTINUE**
7. Skip role assignment (permissions granted in Play Console)
8. Click **DONE**

### Step 2: Create Service Account Key

1. Click on the service account: `google-play-publisher@project-c86459e7-415b-4a36-a25.iam.gserviceaccount.com`
2. Go to **KEYS** tab
3. Click **ADD KEY** → **Create new key**
4. Select **JSON** format
5. Click **CREATE** (downloads automatically)
6. **Save securely** - needed for CI/CD

### Step 3: Link to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console/)
2. Select app: **TradeLine 24/7**
3. Navigate to **Setup** → **API access**
4. Under **Service accounts**, click **Link service account**
5. Enter email: `google-play-publisher@project-c86459e7-415b-4a36-a25.iam.gserviceaccount.com`
6. Click **LINK**
7. Grant permissions:
   - ✅ **Release apps to testing tracks** (Internal, Alpha, Beta)
   - ✅ **View app information and download bulk reports**
8. Click **INVITE USER**

### Step 4: Configure in CI/CD (Codemagic)

For automated publishing, add to Codemagic environment variables:
- **Variable:** `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
- **Value:** Entire contents of JSON key file
- **Group:** `google_play_publishing`

See [Codemagic Setup Guide](./codemagic-setup.md) for details.

---

## Building the App

### Development Build

```bash
# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Build debug APK (in Android Studio)
# Build → Make Project (Ctrl+F9)
```

### Release Build (Signed)

**Prerequisites:**
- Keystore file (`upload-keystore.jks`)
- Keystore password
- Key alias and password

**Using Script:**
```bash
# Set environment variables
export ANDROID_KEYSTORE_PASSWORD="your-keystore-password"
export ANDROID_KEY_ALIAS="tradeline247-release"
export ANDROID_KEY_PASSWORD="your-key-password"

# Build signed AAB
bash scripts/build-android.sh
```

**Output:**
- `android/app/build/outputs/bundle/release/app-release.aab`

**Manual Build (Android Studio):**
1. Build → **Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Choose keystore and enter passwords
4. Select **release** build variant
5. Click **Finish**

---

## Testing

### Local Testing

1. **Connect device or start emulator:**
   ```bash
   # List devices
   adb devices
   
   # Install debug build
   npx cap run android
   ```

2. **Run on emulator:**
   - Android Studio → **Tools** → **Device Manager**
   - Create/start emulator
   - Run app from Android Studio

### Testing Checklist

- [ ] App launches successfully
- [ ] Push notifications work (if configured)
- [ ] Firebase services initialized
- [ ] Network requests succeed
- [ ] App icons display correctly
- [ ] Splash screen shows
- [ ] Permissions requested properly

---

## Troubleshooting

### Build Errors

**Error:** "google-services.json not found"
- **Fix:** Ensure `google-services.json` is in `android/app/`
- Run `npx cap sync android`

**Error:** "Gradle sync failed"
- **Fix:** Check `android/build.gradle` has Google Services classpath
- Check `android/app/build.gradle` applies the plugin
- File → Invalidate Caches / Restart in Android Studio

**Error:** "Signing config not found"
- **Fix:** Configure signing in `android/app/build.gradle`:
  ```gradle
  android {
      signingConfigs {
          release {
              storeFile file('path/to/keystore.jks')
              storePassword 'password'
              keyAlias 'alias'
              keyPassword 'password'
          }
      }
  }
  ```

### Firebase Issues

**Error:** "FirebaseApp not initialized"
- **Fix:** Verify `google-services.json` is correct and in right location
- Check package name matches Firebase project

**Error:** "FCM token not generated"
- **Fix:** Ensure Firebase Cloud Messaging is enabled in Firebase Console
- Check app has internet permission

### Google Play Upload Issues

**Error:** "Service account does not have permission"
- **Fix:** Verify service account is linked in Google Play Console → API access
- Ensure "Release apps to testing tracks" permission is granted

---

## Version Management

### Current Versions

- **versionCode:** 2
- **versionName:** 1.0.0

### Updating Versions

**For each release:**
1. Increment `versionCode` (must be higher than previous)
2. Update `versionName` if needed (user-visible version)
3. Update in `android/app/build.gradle`

**Example:**
```gradle
defaultConfig {
    versionCode 3        // Increment this
    versionName "1.0.1"  // Update if needed
}
```

---

## Related Documentation

- [Google Cloud Credentials Guide](./google-cloud-credentials.md)
- [Push Notifications Setup](./PUSH_NOTIFICATIONS_SETUP.md)
- [Codemagic Setup Guide](./codemagic-setup.md)
- [Mobile Deployment Guide](./archive/ci-cd/MOBILE_DEPLOYMENT_GUIDE.md)

---

## Quick Reference

**Project ID:** `project-c86459e7-415b-4a36-a25`  
**Package Name:** `com.apex.tradeline`  
**Firebase Project:** TradeLine 247  
**Google Play Console:** [Link](https://play.google.com/console/)

**Key Files:**
- `android/app/build.gradle` - App configuration
- `android/app/google-services.json` - Firebase config
- `android/app/src/main/AndroidManifest.xml` - Permissions & metadata
