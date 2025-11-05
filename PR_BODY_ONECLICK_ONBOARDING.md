# One-Click Number Onboarding — Server-Derived Tenant, Admin-Only Panels

## Summary

Implements one-click number onboarding with server-derived tenant mapping, admin-only Trust/Billing panels, and idempotent Edge Functions for telephony provisioning, Trust Hub/A2P setup, and billing mapping.

**Key Changes:**
- ✅ Server derives tenant from JWT (never typed/pasted)
- ✅ Client users never see/administer Trust & Reputation or Billing Mapping
- ✅ Backend creates/uses Twilio subaccount per tenant
- ✅ Idempotent functions: telephony-provision, trust-setup, billing-map
- ✅ RLS enforced with `auth.uid()` membership
- ✅ No UI drift; existing tests preserved

## Repo Audit (Before/After)

### Before
- ❌ Tenant ID manually entered in form
- ❌ Trust & Billing cards visible to all users
- ❌ `telephony-onboard` used `org_id` from client
- ❌ No unified `public.numbers` table
- ❌ RLS on `telephony_numbers` only (read-only, no tenant membership check)

### After
- ✅ Tenant ID loaded from `profiles.organization_id` (read-only)
- ✅ Trust & Billing cards hidden for non-admins (`profile.role === 'admin'`)
- ✅ `telephony-provision` derives tenant from JWT
- ✅ `public.numbers` table with tenant_id, phone_sid, e164, status
- ✅ RLS on `numbers` enforces tenant membership via `auth.uid()` + profile join

## Files Changed

### Frontend
- `src/pages/ops/ClientNumberOnboarding.tsx`
  - Load tenant_id from profile on mount
  - Make tenant_id field read-only/disabled
  - Conditionally render Trust & Billing cards (admin only)
  - Update function calls to omit tenant_id from body

### Database
- `supabase/migrations/20251105_oneclick_onboarding.sql`
  - Create `public.numbers` table
  - RLS policies: `tenant_insert_numbers`, `tenant_read_numbers`
  - Service role policy for Edge Functions

### Edge Functions
- `supabase/functions/telephony-provision/index.ts` (NEW)
  - Server-derived tenant via JWT
  - Twilio subaccount creation/retrieval (idempotent)
  - Number purchase/attach
  - Fire-and-forget admin jobs (trust-setup, billing-map)
  
- `supabase/functions/trust-setup/index.ts` (NEW)
  - Admin-only verification
  - Idempotent Trust Hub Business Profile
  - Idempotent A2P 10DLC Brand/Campaign
  - Optional STIR/SHAKEN, CNAM setup

- `supabase/functions/billing-map/index.ts` (NEW)
  - Admin-only verification
  - Idempotent number-to-tenant mapping
  - Usage counter initialization

### Shared Helpers
- `supabase/functions/_shared/twilio.ts`
  - Added `twilioClient()` helper (npm:twilio@4)

### Environment
- `.env.example` (documented in ENVIRONMENT_VARIABLES.md)
  - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
  - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SUBACCOUNT_PREFIX

## Manual Verification Checklist

### Client Flow (Non-Admin)
- [ ] Navigate to `/numbers/new`
- [ ] Tenant ID field shows user's organization_id (read-only)
- [ ] Trust & Reputation card **not visible**
- [ ] Billing & Usage Mapping card **not visible**
- [ ] Click "Add Number (One-Click)" → succeeds
- [ ] Number appears in `public.numbers` with correct `tenant_id`

### Admin Flow
- [ ] Navigate to `/numbers/new` as admin
- [ ] Tenant ID field shows organization_id (read-only)
- [ ] Trust & Reputation card **visible**
- [ ] Billing & Usage Mapping card **visible**
- [ ] Click "Add Number (One-Click)" → succeeds
- [ ] Trust-setup and billing-map jobs triggered (fire-and-forget)
- [ ] Number mapped with usage counters initialized

### Security
- [ ] RLS on `numbers` table prevents cross-tenant access
- [ ] Server derives tenant_id (never from client body)
- [ ] Admin checks enforced server-side (Edge Functions)
- [ ] JWT validated in all Edge Functions

### Idempotency
- [ ] Re-run telephony-provision → no duplicate subaccounts
- [ ] Re-run trust-setup → no duplicate brands/campaigns
- [ ] Re-run billing-map → no duplicate mappings

### Database
- [ ] `public.numbers` table created with RLS enabled
- [ ] RLS policies use `auth.uid()` + profile membership
- [ ] Service role can manage all numbers (for Edge Functions)

## Testing Notes

- **No new tests added** (per requirements)
- **Existing CI preserved** — no changes to test structure
- **Manual verification required** for end-to-end flow

## Environment Setup

### Supabase Edge Function Secrets
```bash
supabase secrets set SUPABASE_URL=<your-url>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-key>
supabase secrets set TWILIO_ACCOUNT_SID=<your-sid>
supabase secrets set TWILIO_AUTH_TOKEN=<your-token>
```

### Frontend .env (Vercel/local)
```bash
VITE_SUPABASE_URL=<your-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

## Deployment

1. **Run migration:**
   ```bash
   supabase migration up
   ```

2. **Deploy Edge Functions:**
   ```bash
   supabase functions deploy telephony-provision
   supabase functions deploy trust-setup
   supabase functions deploy billing-map
   ```

3. **Set secrets** (see Environment Setup above)

4. **Verify:**
   - Client flow works without typing tenant_id
   - Admin panels gated correctly
   - RLS enforces tenant boundaries
   - Idempotency verified

## Breaking Changes

None — fully backward compatible. Existing `telephony-onboard` function remains untouched.

## Notes

- `telephony-provision` returns `202 Accepted` for admins (async jobs triggered), `200 OK` for clients
- Trust/Billing jobs are fire-and-forget (non-blocking)
- Subaccount naming: `TL247_{tenant_id}`
- Numbers table uses `phone_sid` as unique constraint for upsert

