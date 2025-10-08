# One-Click OAuth Integrations

## Overview
Production-ready OAuth 2.0 integrations with major platforms using pre-configured flows.

## Supported Integrations

### 1. Google (Gmail + Calendar)
- **Status**: Available
- **Scopes**: 
  - `gmail.readonly` - Read Gmail messages
  - `calendar` - Full calendar access
- **Post-connect test**: Fetch user profile
- **Token storage**: Encrypted in `oauth_tokens` table
- **Refresh**: Automatic using refresh token

### 2. Microsoft 365 (Outlook)
- **Status**: Available
- **Scopes**:
  - `Mail.Read` - Read Outlook mail
  - `Calendars.ReadWrite` - Manage calendars
- **Post-connect test**: Fetch user profile
- **Token storage**: Encrypted in `oauth_tokens` table
- **Refresh**: Automatic using refresh token

### 3. HubSpot CRM
- **Status**: Available
- **Scopes**:
  - `crm.objects.contacts.read` - Read contacts
  - `crm.objects.deals.read` - Read deals
- **Post-connect test**: List first contact
- **Token storage**: Encrypted in `oauth_tokens` table
- **Refresh**: Automatic using refresh token

### 4. Salesforce
- **Status**: Coming Soon
- **Target**: Q1 2025

## Configuration

### Required Supabase Secrets

#### Google
```
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret
```

#### Microsoft
```
MICROSOFT_CLIENT_ID=your_application_id
MICROSOFT_CLIENT_SECRET=your_client_secret
```

#### HubSpot
```
HUBSPOT_CLIENT_ID=your_client_id
HUBSPOT_CLIENT_SECRET=your_secret
```

### OAuth App Setup

#### Google Cloud Console
1. Create project at console.cloud.google.com
2. Enable Gmail API and Google Calendar API
3. Create OAuth 2.0 credentials
4. Add redirect URI: `https://[project].supabase.co/functions/v1/oauth-callback?provider=google`
5. Configure OAuth consent screen

#### Microsoft Azure
1. Register app at portal.azure.com
2. Add redirect URI: `https://[project].supabase.co/functions/v1/oauth-callback?provider=microsoft`
3. Add API permissions (Mail.Read, Calendars.ReadWrite)
4. Create client secret

#### HubSpot
1. Create app at developers.hubspot.com
2. Add redirect URI: `https://[project].supabase.co/functions/v1/oauth-callback?provider=hubspot`
3. Add required scopes
4. Get client ID and secret

## User Flow

### Connection Flow
1. User clicks "Connect" button
2. OAuth popup opens with provider login
3. User grants permissions
4. Callback stores tokens securely
5. UI updates to "Connected" state
6. Last sync time displayed

### Disconnection Flow
1. User clicks "Disconnect"
2. Confirmation dialog appears
3. Tokens deleted from database
4. UI reverts to "Connect" state

## Security

### Token Storage
- All tokens encrypted at rest
- Stored in `oauth_tokens` table with RLS
- Service-role key required for decryption
- No client-side token exposure

### Refresh Mechanism
- Automatic token refresh before expiry
- Refresh token rotation supported
- Failed refresh triggers re-authorization

### Scope Verification
- Minimal scopes requested
- User can review permissions before granting
- Scope changes require re-authorization

## Database Schema

### oauth_tokens table
```sql
- id: uuid (primary key)
- user_id: uuid (foreign key to auth.users)
- provider: text (google, microsoft, hubspot)
- access_token: text (encrypted)
- refresh_token: text (encrypted)
- expires_at: timestamp
- scope: text
- last_sync_at: timestamp
- created_at: timestamp
- updated_at: timestamp
```

## Testing

### Pre-Connection Tests
✅ Connect button visible and enabled  
✅ Coming soon badge for Salesforce  
✅ Provider icons and descriptions display  

### Connection Tests
✅ OAuth popup opens correctly  
✅ Tokens stored after authorization  
✅ UI updates to Connected state  
✅ Last sync time displays  
✅ Post-connect API call succeeds  

### Post-Connection Tests
✅ Disconnect button functional  
✅ Tokens deleted on disconnect  
✅ UI reverts to Connect state  
✅ Re-connection works after disconnect  

### Security Tests
✅ Tokens never exposed client-side  
✅ RLS policies prevent cross-user access  
✅ Service-role key required for token access  
✅ OAuth state parameter prevents CSRF  

## Performance
- OAuth popup opens: <500ms
- Token exchange: <1s
- Post-connect test: <2s
- Total connection time: <30s

## Pass Criteria
✅ Each integration connects in <30s  
✅ Post-connect API call succeeds  
✅ Tokens stored securely server-side  
✅ Disconnect works correctly  
✅ No token exposure in client code  
✅ RLS policies enforced  

## Future Enhancements
- Two-way calendar sync
- Email template insertion
- Contact auto-import
- Deal pipeline sync
- Webhook support for real-time updates
