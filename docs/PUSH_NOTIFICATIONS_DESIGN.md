# Push Notifications Architecture Design

**Date:** January 6, 2025  
**Status:** Design Phase  
**Repository:** TradeLine247

---

## 1. Provider Choice & High-Level Design

### Stack Selection
- **Client:** `@capacitor/push-notifications` (official Capacitor plugin)
- **Cross-Platform Provider:** Firebase Cloud Messaging (FCM)
- **iOS:** APNs via FCM (APNs key/cert configured in Firebase Console, not in code)
- **Android:** FCM directly

### Rationale
- Capacitor plugin provides unified API for iOS/Android
- FCM is industry standard, free, reliable
- Single provider simplifies backend implementation
- APNs handled by Firebase eliminates need for separate APNs certificate management

---

## 2. Data Model (Supabase)

### Table: `device_push_tokens`

```sql
CREATE TABLE public.device_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_token TEXT NOT NULL,
  fcm_token TEXT, -- FCM registration token (same as device_token for Android, different for iOS)
  app_version TEXT,
  device_info JSONB, -- Optional: device model, OS version, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

-- Indexes
CREATE INDEX idx_device_push_tokens_user_id ON public.device_push_tokens(user_id);
CREATE INDEX idx_device_push_tokens_active ON public.device_push_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_device_push_tokens_platform ON public.device_push_tokens(platform);

-- RLS Policies
ALTER TABLE public.device_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own device tokens"
  ON public.device_push_tokens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
```

---

## 3. Backend API Surface

### Endpoints (Express server)

#### `POST /api/push/register`
- **Auth:** Required (authenticated users only)
- **Body:**
  ```typescript
  {
    platform: 'ios' | 'android',
    token: string, // Device/FCM token
    appVersion?: string,
    deviceInfo?: Record<string, unknown>
  }
  ```
- **Response:** `{ success: boolean, deviceId?: string }`
- **Behavior:** Upserts device record for current user

#### `POST /api/push/unregister`
- **Auth:** Required
- **Body:**
  ```typescript
  {
    token: string // Device token to unregister
  }
  ```
- **Response:** `{ success: boolean }`
- **Behavior:** Soft delete (sets `is_active = false`) or hard delete

#### `POST /api/push/test` (Admin/Internal)
- **Auth:** Required + admin/internal role check
- **Body:**
  ```typescript
  {
    userId?: string, // Target user ID (defaults to current user)
    deviceId?: string, // Target specific device
    title: string,
    body: string,
    data?: Record<string, unknown> // Custom data payload
  }
  ```
- **Response:** `{ success: boolean, messageId?: string }`
- **Behavior:** Sends test push notification via FCM

---

## 4. Frontend Flows & UX

### Permission & Registration Flow

1. **Trigger Point:** After user authentication, in dashboard or settings
   - NOT on first app open (non-intrusive)
   - Suggested: After onboarding completion or from settings toggle

2. **Permission Request:**
   - Use Capacitor PushNotifications.requestPermissions()
   - Handle gracefully if denied (no crashes, show status in settings)

3. **Token Registration:**
   - On permission grant, obtain token via Capacitor plugin
   - Register with backend via `/api/push/register`
   - Store registration state in local storage/Zustand

4. **Token Refresh Handling:**
   - Listen for token refresh events
   - Auto-update backend when token changes

### Settings UI

**Location:** Existing settings/preferences area (SettingsDashboard or similar)

**UI Component:**
- Toggle: "Enable Push Notifications"
- Status text: "Enabled" / "Disabled" / "Device not registered" / "Permission denied"
- Uses existing design tokens (no new styles)

**State Management:**
- Local state for UI toggle
- Backend sync on toggle change
- Graceful error handling with toast notifications

### Error Handling

- Network errors: Show toast using existing `sonner` toast system
- Permission denied: Show status, don't retry automatically
- Registration failures: Log error, show user-friendly message
- No new modal styles or global error handlers

---

## 5. Implementation Structure

### Client-Side Files

```
src/
├── lib/
│   └── push/
│       └── client.ts          # Capacitor push client (framework-agnostic)
├── hooks/
│   └── usePushNotifications.ts # React hook for push notifications
└── components/
    └── settings/
        └── PushNotificationToggle.tsx # Settings UI component
```

### Backend Files

```
server/
├── push/
│   ├── fcm.ts                # FCM client module
│   └── routes.ts             # Express routes for push APIs
└── middleware/
    └── adminAuth.ts          # Admin auth middleware (if needed)
```

### Database

```
supabase/migrations/
└── YYYYMMDDHHMMSS_add_device_push_tokens.sql
```

---

## 6. Configuration & Environment Variables

### Required Environment Variables

```bash
# Push Provider
PUSH_PROVIDER=fcm

# Firebase Cloud Messaging
FCM_PROJECT_ID=your-project-id
FCM_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FCM_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# OR
FCM_CREDENTIALS_JSON={"type":"service_account",...} # Single JSON env var alternative
```

### Capacitor Config

```typescript
// capacitor.config.ts additions (if needed by plugin)
{
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
}
```

### iOS Native Configuration

**Required (via repo changes):**
- `ios/App/App/Info.plist` - Add push notification capability (if not auto-added)
- `ios/App/App/AppDelegate.swift` - No changes needed (Capacitor handles)

**Required (via Apple Developer Console):**
- APNs Key (.p8) uploaded to Firebase Console
- Push Notifications capability enabled in App ID

### Android Native Configuration

**Required (via repo changes):**
- `android/app/build.gradle` - Add Firebase dependencies (if not auto-added)
- `android/app/google-services.json` - Add to repo (or generate via Firebase)

**Required (via Firebase Console):**
- Android app registered in Firebase project
- `google-services.json` downloaded and placed in `android/app/`

---

## 7. Security Considerations

- **Authentication:** All endpoints require authenticated user
- **RLS:** Database table protected by Row Level Security
- **Rate Limiting:** Push registration endpoints use existing rate limiter
- **Token Storage:** Device tokens stored securely, never exposed to client unnecessarily
- **Admin Endpoint:** Test endpoint requires admin/internal role check

---

## 8. Testing Strategy

### Unit Tests
- Push client utility functions
- Hook logic (mocked Capacitor plugin)
- Backend route handlers

### E2E Tests
- Settings toggle interaction
- Registration flow (mocked backend)
- Error handling scenarios

### Manual Testing Checklist
1. Install Android build
2. Log in
3. Navigate to settings
4. Enable push notifications
5. Verify permission prompt appears
6. Grant permission
7. Verify token registered in database
8. Trigger `/api/push/test` endpoint
9. Verify push arrives on device
10. Repeat for iOS via TestFlight

---

## 9. Non-Destructive Guarantees

✅ **Will NOT change:**
- Hero section layout, overlays, masks, opacity
- Brand colors, typography, global spacing
- Signing strategy, bundle IDs, CI structure
- Existing GOODBUILD workflows

✅ **Will only add:**
- New files for push functionality
- New database table (migration)
- New API endpoints
- Settings UI component using existing design tokens
- Environment variable documentation

---

**Next Steps:** Proceed to Phase 2 - Implementation

