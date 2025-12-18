# Google Cloud Platform Credentials Configuration

This document outlines the Google Cloud Platform project details and how to configure service account credentials for Google Play publishing and Firebase Cloud Messaging (FCM).

---

## Project Information

**Project Details:**
- **Project Name:** TradeLine 247
- **Project Number:** 734793959452
- **Project ID:** `project-c86459e7-415b-4a36-a25`
- **Organization:** apexbusiness-systems-ltd-org

**GCP Console:** https://console.cloud.google.com/home/dashboard?project=project-c86459e7-415b-4a36-a25

---

## Service Account Setup for Google Play Publishing

The `android-capacitor-release` workflow in Codemagic requires a Google Cloud service account with permissions to upload to Google Play Console.

### Step 1: Create Service Account in Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: **TradeLine 247** (`project-c86459e7-415b-4a36-a25`)
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **+ CREATE SERVICE ACCOUNT**
5. Fill in details:
   - **Service account name:** `codemagic-play-publisher`
   - **Service account ID:** `codemagic-play-publisher` (auto-generated)
   - **Description:** `Service account for Codemagic to upload Android builds to Google Play Internal track`
6. Click **CREATE AND CONTINUE**
7. Skip role assignment (we'll grant permissions in Google Play Console)
8. Click **DONE**

### Step 2: Create and Download Service Account Key

1. In the Service Accounts list, click on `codemagic-play-publisher@project-c86459e7-415b-4a36-a25.iam.gserviceaccount.com`
2. Go to **KEYS** tab
3. Click **ADD KEY** → **Create new key**
4. Select **JSON** format
5. Click **CREATE** (key downloads automatically)
6. **Save this JSON file securely** - you'll need it for Codemagic

### Step 3: Link Service Account to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console/)
2. Select your app: **TradeLine 24/7**
3. Navigate to **Setup** → **API access**
4. Under **Service accounts**, click **Link service account**
5. Enter the service account email: `codemagic-play-publisher@project-c86459e7-415b-4a36-a25.iam.gserviceaccount.com`
6. Click **LINK**
7. Grant permissions:
   - ✅ **Release apps to testing tracks** (Internal, Alpha, Beta)
   - ✅ **View app information and download bulk reports**
8. Click **INVITE USER**

### Step 4: Configure in Codemagic

1. Go to [Codemagic](https://codemagic.io/)
2. Navigate to your app: **TradeLine247**
3. Go to **Settings** → **Environment variables**
4. Create or update environment variable:
   - **Variable name:** `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
   - **Variable value:** Paste the **entire contents** of the JSON key file downloaded in Step 2
   - **Group:** Create a new group `google_play_publishing` or add to existing group
5. Attach this environment group to the `android-capacitor-release` workflow

**Important:** The JSON should be a single-line string or properly escaped JSON. Codemagic will parse it automatically.

---

## Firebase Cloud Messaging (FCM) Configuration

FCM is used for push notifications. The project uses the same Google Cloud project.

### Environment Variables Required

Set these in your deployment platform (Vercel, Supabase Edge Functions, etc.):

```bash
# Option 1: Single JSON credential (recommended)
FCM_CREDENTIALS_JSON='{"type":"service_account","project_id":"project-c86459e7-415b-4a36-a25",...}'

# Option 2: Individual fields
FCM_PROJECT_ID=project-c86459e7-415b-4a36-a25
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@project-c86459e7-415b-4a36-a25.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### Creating FCM Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **TradeLine 247**
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate new private key**
5. Download the JSON file
6. Extract values:
   - `project_id` → `FCM_PROJECT_ID`
   - `client_email` → `FCM_CLIENT_EMAIL`
   - `private_key` → `FCM_PRIVATE_KEY` (keep `\n` newlines as literal `\n`)

Or use the entire JSON as `FCM_CREDENTIALS_JSON`.

---

## Verification

### Verify Google Play Service Account

1. In Codemagic, trigger a build of `android-capacitor-release` workflow
2. Check build logs for the "Google Play" publishing step
3. Verify it shows: "Uploading to Google Play Internal track"
4. Check Google Play Console → **Testing** → **Internal testing** → New build should appear

### Verify FCM Service Account

1. Check server logs when sending push notifications
2. Should see: `[FCM] Initialized successfully`
3. No errors about missing credentials

---

## Security Notes

- **Never commit service account JSON files to the repository**
- Store credentials only in:
  - Codemagic environment variables (encrypted)
  - Vercel environment variables (encrypted)
  - Supabase Edge Function secrets (encrypted)
  - Local `.env.local` (gitignored)
- Rotate service account keys quarterly or when team members leave
- Use least-privilege permissions (only grant what's needed)

---

## Troubleshooting

### Google Play Upload Fails

**Error:** "Service account does not have permission"
- **Fix:** Verify service account is linked in Google Play Console → API access
- Ensure "Release apps to testing tracks" permission is granted

**Error:** "Invalid credentials"
- **Fix:** Verify `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` contains valid JSON
- Check for extra whitespace or line breaks
- Re-download service account key if expired

### FCM Initialization Fails

**Error:** "FCM_PROJECT_ID environment variable is required"
- **Fix:** Set `FCM_PROJECT_ID` or `FCM_CREDENTIALS_JSON` in environment variables
- Verify project ID matches: `project-c86459e7-415b-4a36-a25`

**Error:** "Invalid FCM_CREDENTIALS_JSON format"
- **Fix:** Ensure JSON is valid and properly escaped
- Use single-line JSON or properly escaped multi-line

---

## Related Documentation

- [Codemagic Setup Guide](./codemagic-setup.md)
- [Push Notifications Setup](./PUSH_NOTIFICATIONS_SETUP.md)
- [Environment Variables Example](../env.example)
