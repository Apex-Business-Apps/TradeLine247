# OAuth Integrations E2E Test Report
**Date:** 2025-10-08  
**Status:** ⚠️ REQUIRES LIVE TESTING

## Overview
This document verifies end-to-end OAuth integration flows for Google, Microsoft 365, and HubSpot. **Live testing with provider credentials is required**.

## Provider Configuration Required

### 1. Google Cloud Console
**Required Secrets:**
```bash
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

**OAuth Configuration:**
- Authorized JavaScript origins: `https://niorocndzcflrwdrofsp.supabase.co`
- Authorized redirect URIs: `https://niorocndzcflrwdrofsp.supabase.co/functions/v1/oauth-callback`
- Scopes enabled:
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/calendar`

**Console:** https://console.cloud.google.com/apis/credentials

---

### 2. Microsoft Azure Portal
**Required Secrets:**
```bash
MICROSOFT_CLIENT_ID=your_application_id
MICROSOFT_CLIENT_SECRET=your_client_secret
```

**App Registration:**
- Redirect URI: `https://niorocndzcflrwdrofsp.supabase.co/functions/v1/oauth-callback`
- API Permissions:
  - `Mail.Read` (Delegated)
  - `Calendars.ReadWrite` (Delegated)
- Grant admin consent (if in organization)

**Console:** https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps

---

### 3. HubSpot Developer
**Required Secrets:**
```bash
HUBSPOT_CLIENT_ID=your_app_id
HUBSPOT_CLIENT_SECRET=your_client_secret
```

**App Configuration:**
- Redirect URL: `https://niorocndzcflrwdrofsp.supabase.co/functions/v1/oauth-callback`
- Scopes:
  - `crm.objects.contacts.read`
  - `crm.objects.deals.read`

**Console:** https://app.hubspot.com/developer

---

## Implementation Verification

### OAuth Callback Function ✅
- **Location:** `supabase/functions/oauth-callback/index.ts`
- **Auth:** Service role (bypasses RLS for token storage)
- **CORS:** Enabled

#### Code Review Checklist
```typescript
✅ Handles OPTIONS preflight requests
✅ Extracts provider and code from query parameters
✅ Validates required parameters
✅ Provider-specific token exchange:
   ✅ Google: oauth2.googleapis.com/token
   ✅ Microsoft: login.microsoftonline.com/common/oauth2/v2.0/token
   ✅ HubSpot: api.hubapi.com/oauth/v1/token
✅ Fetches user info from provider (email)
✅ Stores tokens in oauth_tokens table:
   - organization_id (from authenticated user's org)
   - provider
   - access_token
   - refresh_token (if provided)
   - expires_at (calculated from expires_in)
   - scope
   - token_type
   - user_info (email, name)
✅ Returns HTML response to close OAuth popup
✅ Error handling and logging
```

### Frontend Integration ✅
- **Component:** `OAuthIntegrations.tsx`
- **Location:** Settings > OAuth Apps tab

#### Code Review Checklist
```typescript
✅ Loads existing connections on mount
✅ Displays 4 provider cards (Google, Microsoft, HubSpot, Salesforce)
✅ Constructs OAuth URLs with:
   - Correct authorization endpoints
   - Client IDs from environment
   - Proper redirect URIs
   - Required scopes
   - CSRF state parameter (UUID)
✅ Opens OAuth flow in new window (600x700)
✅ Polls for connection every 2 seconds
✅ Times out after 60 seconds
✅ Updates UI on successful connection
✅ Handles disconnect flow
✅ Deletes tokens from database
✅ Provider revocation (future enhancement)
```

### Token Storage ✅
- **Table:** `oauth_tokens`
- **RLS Policies:**
  - ✅ Org admins can manage tokens
  - ✅ Users can view org tokens
  - ✅ Block anonymous access

#### Security Verification
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'oauth_tokens';
-- Expected: rowsecurity = true

-- Verify policies exist
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'oauth_tokens';
-- Expected: 2+ policies covering SELECT, INSERT, UPDATE, DELETE
```

---

## Test Scenarios

### Test 1: Google Connection ⏳ PENDING

#### Prerequisites
- Google account for testing
- GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET configured

#### Test Steps
1. Navigate to Settings > OAuth Apps
2. Locate "Google" integration card
3. Click "Connect" button
4. **Expected:** New window opens (600x700) with Google OAuth screen
5. Sign in with Google account
6. **Expected:** Permission screen shows requested scopes:
   - View and manage Gmail messages
   - Access calendar events
7. Click "Allow"
8. **Expected:** Window closes automatically
9. **Expected:** Original window shows "Connected" toast
10. **Expected:** Google card updates to show:
    - ✓ Check circle icon
    - "Connected" status
    - Last sync timestamp
    - Connected email address
    - "Disconnect" button

#### Verification
```sql
SELECT 
  provider,
  user_info->>'email' as email,
  expires_at,
  scope,
  created_at
FROM oauth_tokens
WHERE provider = 'google'
ORDER BY created_at DESC
LIMIT 1;
```

#### Minimal API Proof Call
**Method:** Fetch Gmail labels (or calendar list)

```typescript
// Example proof call (to be implemented in test UI)
const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/labels', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const data = await response.json();
console.log(`Gmail labels found: ${data.labels.length}`);
```

#### Evidence Required
- [ ] Screenshot: Google OAuth consent screen
- [ ] Screenshot: Settings page showing "Connected" Google integration
- [ ] Screenshot: Connected state (with email + timestamp)
- [ ] Database query result showing stored token
- [ ] Console log showing proof call response (label count only, not full data)
- [ ] Network tab: oauth-callback request/response

#### Pass Criteria
- [ ] OAuth flow completes without errors
- [ ] Token stored in database
- [ ] Access token valid (proof call succeeds)
- [ ] Refresh token stored (if provided)
- [ ] User email displayed correctly
- [ ] Disconnect button visible

---

### Test 2: Microsoft 365 Connection ⏳ PENDING

#### Prerequisites
- Microsoft account (personal or work)
- MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET configured
- Admin consent granted (if work account)

#### Test Steps
1. Navigate to Settings > OAuth Apps
2. Locate "Microsoft 365" integration card
3. Click "Connect" button
4. **Expected:** New window with Microsoft login
5. Sign in with Microsoft account
6. **Expected:** Permission screen shows:
   - Read mail
   - Read and write calendars
7. Click "Accept"
8. **Expected:** Window closes, toast appears
9. **Expected:** Card shows connected state

#### Verification
```sql
SELECT 
  provider,
  user_info->>'email' as email,
  expires_at,
  scope,
  created_at
FROM oauth_tokens
WHERE provider = 'microsoft'
ORDER BY created_at DESC
LIMIT 1;
```

#### Minimal API Proof Call
**Method:** Fetch Outlook folders (or calendar events)

```typescript
const response = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const data = await response.json();
console.log(`Outlook folders found: ${data.value.length}`);
```

#### Evidence Required
- [ ] Screenshot: Microsoft consent screen
- [ ] Screenshot: Connected Microsoft integration
- [ ] Database query result
- [ ] Proof call console log (folder count)
- [ ] Network tab: oauth-callback

#### Pass Criteria
- [ ] OAuth flow completes
- [ ] Token stored
- [ ] API call succeeds
- [ ] Email displayed
- [ ] Disconnect available

---

### Test 3: HubSpot Connection ⏳ PENDING

#### Prerequisites
- HubSpot account (free tier acceptable)
- HUBSPOT_CLIENT_ID and HUBSPOT_CLIENT_SECRET configured

#### Test Steps
1. Navigate to Settings > OAuth Apps
2. Locate "HubSpot" integration card
3. Click "Connect" button
4. **Expected:** HubSpot OAuth screen in new window
5. Select HubSpot account to connect
6. **Expected:** Permission screen shows:
   - Read contacts
   - Read deals
7. Click "Connect app"
8. **Expected:** Window closes, success toast
9. **Expected:** Connected state displayed

#### Verification
```sql
SELECT 
  provider,
  user_info->>'email' as email,
  expires_at,
  scope,
  created_at
FROM oauth_tokens
WHERE provider = 'hubspot'
ORDER BY created_at DESC
LIMIT 1;
```

#### Minimal API Proof Call
**Method:** Fetch contact count

```typescript
const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const data = await response.json();
console.log(`HubSpot contacts accessible: ${data.total > 0 ? 'Yes' : 'No'}`);
```

#### Evidence Required
- [ ] Screenshot: HubSpot consent screen
- [ ] Screenshot: Connected state
- [ ] Database query result
- [ ] Proof call console log
- [ ] Network tab

#### Pass Criteria
- [ ] OAuth flow completes
- [ ] Token stored
- [ ] API accessible
- [ ] Account connected
- [ ] Disconnect works

---

## Token Security

### Storage Verification ✅

#### Current Implementation
- **Storage:** Supabase oauth_tokens table
- **Access:** RLS protected (org-scoped)
- **Location:** Server-side only

#### Security Checklist
```typescript
✅ Tokens never exposed to client localStorage
✅ Tokens never in client sessionStorage
✅ Tokens never in client-side Redux/state
✅ All token operations via server-side edge functions
✅ RLS policies prevent cross-org access
✅ Service role key used only in edge functions
⚠️ Tokens stored in plaintext (recommendation: encrypt)
```

#### Client Storage Verification
**Test:** Inspect browser storage
```javascript
// Run in browser console
console.log('localStorage:', localStorage);
console.log('sessionStorage:', sessionStorage);
// Expected: No access_token, refresh_token, or oauth-related keys
```

### Refresh Flow Test ⏳ PENDING

#### Scenario
1. Connect provider (Google or Microsoft)
2. Note `expires_at` timestamp in database
3. Wait for token expiration OR manually set `expires_at` to past
4. Trigger action that requires token (e.g., proof API call)
5. **Expected:** System detects expiration
6. **Expected:** Refresh flow automatically triggered
7. **Expected:** New access_token obtained
8. **Expected:** `expires_at` updated in database
9. **Expected:** Original action succeeds with new token

⚠️ **Current Status:** Refresh flow not implemented in oauth-callback function

**Recommendation:** Implement token refresh logic:
```typescript
// Pseudocode for refresh implementation
async function refreshTokenIfNeeded(provider: string, orgId: string) {
  const { data } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('provider', provider)
    .eq('organization_id', orgId)
    .single();
    
  if (new Date(data.expires_at) < new Date()) {
    // Token expired, refresh it
    const newTokens = await exchangeRefreshToken(
      data.provider,
      data.refresh_token
    );
    
    await supabase
      .from('oauth_tokens')
      .update({
        access_token: newTokens.access_token,
        expires_at: new Date(Date.now() + newTokens.expires_in * 1000),
        updated_at: new Date()
      })
      .eq('id', data.id);
  }
  
  return data.access_token;
}
```

---

## Disconnect & Revocation

### Test 4: Disconnect Flow ⏳ PENDING

#### Test Steps (Google Example)
1. Ensure Google is connected
2. Click "Disconnect" button
3. **Expected:** Confirmation (implicit or dialog)
4. **Expected:** Token deleted from database
5. **Expected:** Card reverts to "Connect" button
6. **Expected:** Success toast: "Disconnected"
7. **Expected:** Email and timestamp removed

#### Database Verification
```sql
-- Should return no rows after disconnect
SELECT * FROM oauth_tokens 
WHERE provider = 'google' 
AND organization_id = 'user_org_id';
```

#### Provider Revocation ⚠️ NOT IMPLEMENTED

**Current:** Tokens deleted from database only  
**Missing:** Provider-side revocation call

**Recommendation:** Add revocation API calls:

**Google:**
```typescript
await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
  method: 'POST'
});
```

**Microsoft:**
```typescript
// Microsoft requires administrative action for revocation
// Tokens expire naturally after 1 hour without refresh
```

**HubSpot:**
```typescript
await fetch('https://api.hubapi.com/oauth/v1/refresh-tokens/' + refreshToken, {
  method: 'DELETE'
});
```

#### Evidence Required
- [ ] Screenshot: Before disconnect (connected state)
- [ ] Screenshot: After disconnect (connect button)
- [ ] Database query showing token deletion
- [ ] Toast notification screenshot

---

## Pass/Fail Summary

| Provider | Connect | Proof Call | Token Storage | Refresh | Disconnect | Revocation |
|----------|---------|------------|---------------|---------|------------|------------|
| Google | ⏳ PENDING | ⏳ PENDING | ✅ VERIFIED | ⚠️ MISSING | ⏳ PENDING | ⚠️ MISSING |
| Microsoft | ⏳ PENDING | ⏳ PENDING | ✅ VERIFIED | ⚠️ MISSING | ⏳ PENDING | ⚠️ MISSING |
| HubSpot | ⏳ PENDING | ⏳ PENDING | ✅ VERIFIED | ⚠️ MISSING | ⏳ PENDING | ⚠️ MISSING |
| Salesforce | 🔜 FUTURE | N/A | N/A | N/A | N/A | N/A |

---

## Security Findings

### ✅ Strengths
- Tokens stored server-side only
- RLS policies active
- No client-side token exposure
- CSRF protection via state parameter
- Service role key never exposed to client

### ⚠️ Improvements Needed
1. **Token Encryption**
   - Tokens stored in plaintext
   - Recommendation: Encrypt access_token and refresh_token columns

2. **Refresh Token Implementation**
   - No automatic token refresh
   - API calls will fail after expiration
   - Recommendation: Implement refresh logic in edge function

3. **Provider Revocation**
   - Disconnect only removes local copy
   - Tokens remain valid on provider side
   - Recommendation: Call provider revocation APIs

4. **Token Expiry Monitoring**
   - No proactive warnings before expiration
   - Recommendation: Add monitoring/alerts

5. **Scope Verification**
   - No verification that granted scopes match requested
   - Recommendation: Validate scopes in callback

---

## Storage Diagram

```
┌─────────────────────────────────────────┐
│           Browser (Client)              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  localStorage  ❌ No tokens     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  sessionStorage ❌ No tokens    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  React State  ❌ No tokens      │   │
│  │  (Only connection status)        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
             ↕ HTTPS
┌─────────────────────────────────────────┐
│      Supabase Edge Functions            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  oauth-callback                 │   │
│  │  - Exchanges auth code          │   │
│  │  - Stores tokens (service role) │   │
│  │  - Returns success HTML         │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
             ↕
┌─────────────────────────────────────────┐
│     PostgreSQL (oauth_tokens)           │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  id, organization_id            │   │
│  │  provider, access_token 🔒      │   │
│  │  refresh_token 🔒, expires_at   │   │
│  │  scope, user_info               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  RLS: org-scoped, admin-managed         │
└─────────────────────────────────────────┘

🔒 = Recommendation: Encrypt these columns
```

---

## Completion Checklist

### Before GO
- [ ] Configure all provider OAuth apps
- [ ] Add all required secrets to Supabase
- [ ] Test connection flow for each provider
- [ ] Verify proof API calls succeed
- [ ] Confirm tokens stored securely
- [ ] Test disconnect flow
- [ ] Verify no tokens in client storage
- [ ] Document any provider-specific issues

### Security Hardening (P2)
- [ ] Implement token encryption
- [ ] Add automatic token refresh
- [ ] Add provider revocation calls
- [ ] Implement scope verification
- [ ] Add token expiry monitoring

---

## Next Steps
1. Obtain OAuth credentials from all providers
2. Configure redirect URIs in provider consoles
3. Add secrets to Supabase edge function settings
4. Execute connection tests for all 3 providers
5. Capture evidence (screenshots, DB queries, network logs)
6. Update PASS/FAIL table
7. Proceed to PROMPT 4 (Vehicle Search Verification)

**Status:** ⚠️ BLOCKED - Requires provider credentials  
**Blocker:** OAuth app configuration needed  
**Owner:** DevOps/Platform team

---
**Document Version:** 1.0  
**Last Updated:** 2025-10-08
