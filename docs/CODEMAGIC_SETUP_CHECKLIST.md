# Codemagic Setup Checklist for TradeLine 24/7

This document provides a step-by-step checklist for configuring Codemagic to build and deploy the **TradeLine 24/7** iOS app to TestFlight.

## Prerequisites

- Codemagic account with iOS build capability
- Apple Developer account
- App Store Connect API key (for TestFlight submission)
- iOS distribution certificate and App Store provisioning profile

---

## Step 1: Verify Codebase Readiness

Before configuring Codemagic, run the pre-flight verification script:

```bash
node scripts/verify-codemagic-readiness.mjs
```

This will check that all required files exist and are properly configured.

**Expected Output:** ✅ All checks passed

---

## Step 2: Codemagic App Configuration

### 2.1 Create/Select App in Codemagic

1. Log in to [Codemagic](https://codemagic.io)
2. Create a new app or select existing **TradeLine 24/7** app
3. Connect your repository (GitHub/GitLab/Bitbucket)

### 2.2 Set Working Directory

**CRITICAL:** Since `codemagic.yaml` is in the `tradeline247aicom/` directory:

1. Go to **App Settings** → **Build** → **Working directory**
2. Set working directory to: `tradeline247aicom`
   - OR move `codemagic.yaml` to repository root and leave working directory empty

**Verify:** The build should run from the directory containing `codemagic.yaml`

---

## Step 3: Environment Variables

### 3.1 Create Environment Group

1. Go to **App Settings** → **Environment variables**
2. Create a new group called: `ios_config`
3. Add the following variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `BUNDLE_ID` | `com.apex.tradeline` | **MUST match** Capacitor config bundle ID |
| `TEAM_ID` | `YOUR_TEAM_ID` | Your Apple Developer Team ID (10 characters) |

**Finding Your Team ID:**
- Log in to [Apple Developer Portal](https://developer.apple.com/account)
- Go to **Membership** → Your Team ID is displayed (format: `ABC123DEF4`)

### 3.2 Verify Environment Group Assignment

1. Go to **App Settings** → **Build** → **Environment variables**
2. Ensure `ios_config` group is selected/assigned to your workflow

---

## Step 4: App Store Connect Integration

### 4.1 Create App Store Connect API Key

1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Go to **Users and Access** → **Keys** → **App Store Connect API**
3. Click **Generate API Key**
4. Download the `.p8` key file (you can only download once!)
5. Note the **Key ID** and **Issuer ID**

### 4.2 Configure Integration in Codemagic

1. Go to **App Settings** → **Integrations**
2. Click **App Store Connect**
3. Enter:
   - **Issuer ID**: From App Store Connect
   - **Key ID**: From App Store Connect
   - **Private Key**: Upload the `.p8` file or paste contents
4. Click **Save**

**Verify:** Integration status should show as "Connected" or "Created via API"

---

## Step 5: iOS Code Signing

### 5.1 Upload Distribution Certificate

1. Go to **App Settings** → **Code signing**
2. Under **iOS certificates**, click **Add certificate**
3. Upload your **Apple Distribution** certificate (`.p12` file)
4. Enter the certificate password

**Note:** Certificate must be valid and not expired.

### 5.2 Upload Provisioning Profile

1. In **Code signing** section, under **iOS provisioning profiles**
2. Click **Add provisioning profile**
3. Upload your **App Store** provisioning profile (`.mobileprovision` file)
4. Ensure it matches bundle ID: `com.apex.tradeline`

**Creating Provisioning Profile:**
- Go to [Apple Developer Portal](https://developer.apple.com/account)
- **Certificates, Identifiers & Profiles** → **Profiles**
- Create new **App Store** profile for `com.apex.tradeline`
- Download and upload to Codemagic

---

## Step 6: Verify Workflow Configuration

### 6.1 Check Workflow Selection

1. Go to **App Settings** → **Build** → **Workflows**
2. Ensure `ios_capacitor_testflight` workflow is selected
3. Verify it uses `codemagic.yaml` configuration

### 6.2 Review Build Settings

1. **Instance type**: `mac_mini_m2` (as specified in YAML)
2. **Max build duration**: 60 minutes
3. **Xcode version**: Latest (will use latest available)

---

## Step 7: Pre-Build Verification Checklist

Before triggering a build, verify:

- [ ] `codemagic.yaml` exists in correct location
- [ ] Working directory is set correctly
- [ ] `BUNDLE_ID` environment variable = `com.apex.tradeline`
- [ ] `TEAM_ID` environment variable is set
- [ ] `ios_config` environment group is assigned
- [ ] App Store Connect integration is connected
- [ ] iOS distribution certificate is uploaded
- [ ] App Store provisioning profile is uploaded
- [ ] Provisioning profile matches bundle ID
- [ ] Pre-flight script passes: `node scripts/verify-codemagic-readiness.mjs`

---

## Step 8: Trigger Build

### 8.1 Manual Build

1. Go to **Builds** → **Start new build**
2. Select branch (usually `main` or `master`)
3. Select workflow: `ios_capacitor_testflight`
4. Click **Start new build**

### 8.2 Automatic Builds (Optional)

Configure automatic builds:
1. Go to **App Settings** → **Build** → **Triggers**
2. Enable builds on push to specific branches
3. Configure branch patterns (e.g., `main`, `release/*`)

---

## Step 9: Monitor Build

### 9.1 Build Logs

- Watch build progress in real-time
- Check for errors in each step:
  - ✅ Dependencies installation
  - ✅ Web build
  - ✅ Capacitor sync
  - ✅ CocoaPods installation
  - ✅ Xcode archive
  - ✅ IPA export
  - ✅ TestFlight upload

### 9.2 Common Issues

| Issue | Solution |
|-------|----------|
| `BUNDLE_ID` not found | Verify environment variable is set in `ios_config` group |
| Certificate expired | Upload new certificate in Code signing |
| Provisioning profile mismatch | Ensure profile matches `com.apex.tradeline` |
| Missing icon files | Run `node scripts/verify-codemagic-readiness.mjs` |
| Working directory error | Set working directory to `tradeline247aicom` |

---

## Step 10: Post-Build Verification

After successful build:

1. **Check TestFlight**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Navigate to **TestFlight** → **TradeLine 24/7**
   - Verify build appears in **iOS builds**

2. **Download Artifacts** (Optional)
   - In Codemagic build page, download `.ipa` file
   - Keep for backup or manual distribution

3. **Test Build**
   - Add internal testers in TestFlight
   - Install and test on physical devices

---

## Troubleshooting

### Build Fails at "Detect App Store provisioning profile"

**Error:** `ERROR: No App Store profile for com.apex.tradeline`

**Solution:**
1. Verify `BUNDLE_ID` environment variable matches exactly: `com.apex.tradeline`
2. Ensure provisioning profile is App Store type (not Development/Ad Hoc)
3. Re-upload provisioning profile in Codemagic Code signing

### Build Fails at "Xcode archive"

**Error:** Code signing errors

**Solution:**
1. Verify certificate is valid and not expired
2. Check certificate password is correct
3. Ensure provisioning profile matches certificate
4. Verify Team ID matches certificate

### Build Succeeds but TestFlight Upload Fails

**Error:** App Store Connect API errors

**Solution:**
1. Verify App Store Connect integration is connected
2. Check API key permissions (should have App Manager or Admin role)
3. Ensure app exists in App Store Connect with bundle ID `com.apex.tradeline`

---

## Quick Reference

### Required Environment Variables

```bash
BUNDLE_ID=com.apex.tradeline
TEAM_ID=YOUR_TEAM_ID_HERE
```

### Key File Locations

- `codemagic.yaml` → `tradeline247aicom/codemagic.yaml`
- Capacitor config → `tradeline247aicom/capacitor.config.ts`
- iOS project → `tradeline247aicom/ios/App/`
- Icons → `tradeline247aicom/public/assets/brand/App_Icons/ios/`

### Verification Commands

```bash
# Pre-flight check
node scripts/verify-codemagic-readiness.mjs

# Verify icons
node scripts/verify_icons.mjs

# Verify app build
node scripts/verify-app.cjs
```

---

## Support

If you encounter issues not covered here:

1. Check [Codemagic Documentation](https://docs.codemagic.io)
2. Review build logs for specific error messages
3. Verify all prerequisites are met
4. Ensure environment variables are set correctly

---

**Last Updated:** 2025-01-XX  
**App:** TradeLine 24/7  
**Bundle ID:** `com.apex.tradeline`


