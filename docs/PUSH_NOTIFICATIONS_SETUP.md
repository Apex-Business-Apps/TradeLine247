# Push Notifications Setup Guide

**Date:** January 6, 2025  
**Status:** Implementation Complete  
**Repository:** TradeLine247

---

## Summary of Changes

### Files Created

1. **Database Migration**
   - `supabase/migrations/20250106120000_add_device_push_tokens.sql`
   - Creates `device_push_tokens` table with RLS policies

2. **Client-Side**
   - `src/lib/push/client.ts` - Capacitor push client (framework-agnostic)
   - `src/hooks/usePushNotifications.ts` - React hook for push notifications
   - `src/components/settings/PushNotificationToggle.tsx` - Settings UI component

3. **Backend**
   - `server/push/fcm.ts` - Firebase Cloud Messaging client module
   - `server/push/routes.ts` - Express API routes for push registration/testing
   - `server/supabase/client.ts` - Server-side Supabase client

4. **Documentation**
   - `docs/PUSH_NOTIFICATIONS_DESIGN.md` - Architecture design document
   - `docs/PUSH_NOTIFICATIONS_SETUP.md` - This setup guide

### Files Modified

1. **Dependencies**
   - `package.json` - Added `@capacitor/push-notifications` and `firebase-admin`

2. **Configuration**
   - `capacitor.config.ts` - Added PushNotifications plugin configuration
   - `server.mjs` - Integrated push routes and FCM initialization

3. **UI Components**
   - `src/components/dashboard/DashboardSettingsDialog.tsx` - Added PushNotificationToggle component

---

## Configuration Instructions

### Environment Variables

Add these environment variables to your deployment environments (Vercel, Codemagic, local):

#### Required for Push Notifications

```bash
# Push Provider (default: fcm)
PUSH_PROVIDER=fcm

# Firebase Cloud Messaging - Option 1: Individual variables
FCM_PROJECT_ID=your-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OR Option 2: Single JSON variable (alternative)
FCM_CREDENTIALS_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# Supabase (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Where to Set

- **Vercel:** Project Settings → Environment Variables
- **Codemagic:** App Settings → Environment Variables
- **Local Development:** `.env` file (not committed to repo)

---

## Firebase Console Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Note your Project ID

### Step 2: Add iOS App to Firebase

1. In Firebase Console → Project Settings → Your apps
2. Click "Add app" → iOS
3. Enter Bundle ID: `com.apex.tradeline`
4. Download `GoogleService-Info.plist`
5. **Upload APNs Key:**
   - Go to Project Settings → Cloud Messaging → Apple app configuration
   - Upload your APNs Authentication Key (.p8 file)
   - Enter Key ID and Team ID (from Apple Developer account)

### Step 3: Add Android App to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **TradeLine 247** (`project-c86459e7-415b-4a36-a25`)
3. In Firebase Console → Project Settings → Your apps
4. Click "Add app" → Android
5. Enter Package name: `com.apex.tradeline`
6. Download `google-services.json`
7. Place in `android/app/google-services.json` (commit to repo)

> **Note:** See [Android Setup Guide](./android-setup.md) for complete Android configuration steps.

### Step 4: Generate Service Account Key

1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Extract values for environment variables:
   - `project_id` → `FCM_PROJECT_ID` = `project-c86459e7-415b-4a36-a25`
   - `client_email` → `FCM_CLIENT_EMAIL`
   - `private_key` → `FCM_PRIVATE_KEY` (keep newlines as `\n`)

> **Google Cloud Project:** TradeLine 247 (`project-c86459e7-415b-4a36-a25`) - See [Android Setup Guide](./android-setup.md) for details.

---

## Apple Developer Console Setup

### Step 1: Enable Push Notifications Capability

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Certificates, Identifiers & Profiles → Identifiers
3. Select App ID: `com.apex.tradeline`
4. Enable "Push Notifications" capability
5. Save

### Step 2: Create APNs Key

1. Apple Developer Portal → Keys
2. Click "+" to create new key
3. Name: "TradeLine247 Push Notifications"
4. Enable "Apple Push Notifications service (APNs)"
5. Continue → Register
6. Download `.p8` key file (only downloadable once!)
7. Note Key ID and Team ID

### Step 3: Upload to Firebase

1. Firebase Console → Project Settings → Cloud Messaging
2. Under "Apple app configuration"
3. Upload `.p8` file
4. Enter Key ID and Team ID

---

## Native Project Configuration

### iOS (Automatic via Capacitor)

The Capacitor plugin should automatically configure:
- Push Notifications capability in Xcode
- APNs entitlement

**Manual verification (if needed):**
- Open `ios/App/App.xcworkspace` in Xcode
- Check Signing & Capabilities → Push Notifications enabled

### Android (Manual Step Required)

1. Place `google-services.json` in `android/app/`
2. Ensure `android/app/build.gradle` includes:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```
3. Ensure `android/build.gradle` includes:
   ```gradle
   dependencies {
     classpath 'com.google.gms:google-services:4.4.0'
   }
   ```

---

## Testing Instructions

### Local Development

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Type check:**
   ```bash
   npm run typecheck
   ```

3. **Lint:**
   ```bash
   npm run lint
   ```

4. **Build:**
   ```bash
   npm run build
   ```

### Manual Testing Checklist

#### Android

1. Build Android app:
   ```bash
   npm run build:android
   ```

2. Install on device or emulator

3. Log in to app

4. Navigate to Dashboard → Settings

5. Find "Push Notifications" toggle

6. Enable toggle → Grant permission when prompted

7. Verify token registered:
   - Check Supabase `device_push_tokens` table
   - Should see record with `platform='android'` and `is_active=true`

8. Send test push:
   ```bash
   curl -X POST http://localhost:3000/api/push/test \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
     -d '{
       "title": "Test Notification",
       "body": "This is a test push notification"
     }'
   ```

9. Verify push arrives on device

#### iOS

1. Build iOS app:
   ```bash
   npm run build:ios
   ```

2. Deploy to TestFlight via Codemagic

3. Install from TestFlight

4. Log in to app

5. Navigate to Dashboard → Settings

6. Enable push notifications

7. Verify token registered in database

8. Send test push (same as Android)

9. Verify push arrives on device

---

## API Endpoints

### POST /api/push/register

Register a device token for push notifications.

**Auth:** Required (Bearer token)

**Request:**
```json
{
  "platform": "ios" | "android",
  "token": "string",
  "appVersion": "string (optional)",
  "deviceInfo": {} (optional)
}
```

**Response:**
```json
{
  "success": true,
  "deviceId": "uuid"
}
```

### POST /api/push/unregister

Unregister a device token.

**Auth:** Required

**Request:**
```json
{
  "token": "string"
}
```

**Response:**
```json
{
  "success": true
}
```

### POST /api/push/test

Send a test push notification (admin/internal).

**Auth:** Required

**Request:**
```json
{
  "userId": "uuid (optional, defaults to current user)",
  "deviceId": "uuid (optional)",
  "title": "string",
  "body": "string",
  "data": {} (optional)
}
```

**Response:**
```json
{
  "success": true,
  "sent": 1,
  "total": 1,
  "results": [...]
}
```

---

## Troubleshooting

### FCM Not Initialized

**Error:** `FCM not initialized`

**Solution:** Check environment variables are set correctly. Server will log warning but continue running (push endpoints will fail gracefully).

### Token Registration Fails

**Error:** `Failed to register token with backend`

**Solutions:**
1. Check user is authenticated (session exists)
2. Check API endpoint is accessible (`/api/push/register`)
3. Check server logs for detailed error
4. Verify Supabase RLS policies allow insert

### Push Not Received

**Checklist:**
1. Device token registered in database (`is_active=true`)
2. FCM credentials configured correctly
3. APNs key uploaded to Firebase (iOS)
4. `google-services.json` in Android project (Android)
5. App has notification permissions granted
6. Device has internet connection
7. Check FCM console for delivery status

### Permission Denied

**Error:** `Permission denied - enable in device settings`

**Solution:** User must enable notifications in device Settings → TradeLine 24/7 → Notifications

---

## Safety Confirmation

✅ **Did NOT change:**
- Hero section layout, overlays, masks, opacity
- Brand colors, typography, global spacing
- Signing strategy, bundle IDs, CI structure
- Existing GOODBUILD workflows

✅ **Only added:**
- New files for push functionality
- New database table (migration)
- New API endpoints
- Settings UI component using existing design tokens
- Environment variable documentation

✅ **All existing tests/builds still pass:**
- TypeScript compilation: ✅ Passing
- ESLint: ✅ Passing
- Build: ✅ Successful

---

## Next Steps

1. **Configure Firebase:**
   - Create Firebase project
   - Add iOS and Android apps
   - Generate service account key
   - Upload APNs key (iOS)

2. **Set Environment Variables:**
   - Add FCM credentials to Vercel
   - Add FCM credentials to Codemagic
   - Add `SUPABASE_SERVICE_ROLE_KEY` to server environments

3. **Run Migration:**
   - Apply database migration to Supabase
   - Verify `device_push_tokens` table created

4. **Test End-to-End:**
   - Build Android app
   - Build iOS app (via Codemagic)
   - Test registration flow
   - Test push delivery

5. **Monitor:**
   - Check server logs for FCM initialization
   - Monitor database for token registrations
   - Test push delivery regularly

---

**Implementation Status:** ✅ Complete  
**Ready for:** Firebase configuration and testing

