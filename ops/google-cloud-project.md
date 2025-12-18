# Google Cloud Project - TradeLine 247

## Quick Reference

**Project Details:**
- **Project Name:** TradeLine 247
- **Project Number:** 734793959452
- **Project ID:** `project-c86459e7-415b-4a36-a25`
- **Organization:** apexbusiness-systems-ltd-org

**Console Links:**
- [GCP Dashboard](https://console.cloud.google.com/home/dashboard?project=project-c86459e7-415b-4a36-a25)
- [IAM & Admin](https://console.cloud.google.com/iam-admin?project=project-c86459e7-415b-4a36-a25)
- [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=project-c86459e7-415b-4a36-a25)

## Service Accounts

### For Google Play Publishing (Codemagic)
- **Service Account Email:** `codemagic-play-publisher@project-c86459e7-415b-4a36-a25.iam.gserviceaccount.com`
- **Purpose:** Upload Android builds to Google Play Internal track
- **Codemagic Variable:** `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`
- **Setup:** See [Google Cloud Credentials Guide](../docs/google-cloud-credentials.md)

### For Firebase Cloud Messaging (FCM)
- **Service Account:** Created via Firebase Console
- **Purpose:** Send push notifications to iOS/Android devices
- **Environment Variables:** `FCM_PROJECT_ID`, `FCM_CREDENTIALS_JSON` (or `FCM_CLIENT_EMAIL` + `FCM_PRIVATE_KEY`)
- **Setup:** See [Push Notifications Setup](../docs/PUSH_NOTIFICATIONS_SETUP.md)

## Current Status

✅ Project created and active  
✅ Billing enabled (CAD $0.00 current charges)  
⚠️ Service accounts need to be created and configured (see docs)

---

**Last Updated:** 2025-01-XX  
**Maintained By:** DevOps Team
