# Setup Demo Account for test@tester.com

This guide explains how to grant full-access demo permissions to `test@tester.com` for TestFlight testing.

## Option 1: Run SQL Migration in Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/hysvqdwmhxnblxfqnszn
2. Navigate to **SQL Editor**
3. Run this SQL script:

```sql
-- Setup TestFlight Demo Account for test@tester.com
DO $$
DECLARE
    test_user_id UUID;
    demo_org_id UUID;
BEGIN
    -- Find the user by email
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'test@tester.com';

    -- If user doesn't exist, skip silently (they may need to be created manually)
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'User test@tester.com not found. Please ensure this user exists in auth.users before running this migration.';
        RETURN;
    END IF;

    RAISE NOTICE 'Found user test@tester.com with ID: %', test_user_id;

    -- Create or get demo organization
    INSERT INTO organizations (name, description)
    VALUES ('TestFlight Demo Organization', 'Full-access demo organization for TestFlight testers')
    ON CONFLICT (name) DO NOTHING;

    SELECT id INTO demo_org_id
    FROM organizations
    WHERE name = 'TestFlight Demo Organization';

    RAISE NOTICE 'Demo organization ID: %', demo_org_id;

    -- Add user to organization with owner role (full access)
    INSERT INTO organization_members (org_id, user_id, role)
    VALUES (demo_org_id, test_user_id, 'owner')
    ON CONFLICT (org_id, user_id) DO UPDATE SET
        role = 'owner';

    -- Update user profile
    INSERT INTO profiles (id, plan, status)
    VALUES (test_user_id, 'enterprise', 'active')
    ON CONFLICT (id) DO UPDATE SET
        plan = 'enterprise',
        status = 'active';

    -- Audit log
    INSERT INTO audit_logs (user_id, org_id, action, payload)
    VALUES (
        test_user_id,
        demo_org_id,
        'demo_account_setup',
        jsonb_build_object(
            'setup_type', 'testflight_demo',
            'granted_permissions', 'full_access',
            'plan', 'enterprise',
            'role', 'owner',
            'organization_name', 'TestFlight Demo Organization',
            'setup_timestamp', NOW()
        )
    );

    RAISE NOTICE '✅ Demo account setup complete for test@tester.com!';
    RAISE NOTICE 'User now has:';
    RAISE NOTICE '- Organization: TestFlight Demo Organization';
    RAISE NOTICE '- Role: owner (full access)';
    RAISE NOTICE '- Plan: enterprise';
    RAISE NOTICE '- Status: active';

END $$;
```

## Option 2: Use Supabase Edge Function

If you prefer to use the Edge Function approach:

1. Deploy the `setup-demo-account` function (created in `supabase/functions/setup-demo-account/index.ts`)
2. Call it with an admin JWT token:

```bash
curl -X POST "https://hysvqdwmhxnblxfqnszn.supabase.co/functions/v1/setup-demo-account" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@tester.com",
    "organizationName": "TestFlight Demo Organization",
    "plan": "enterprise",
    "role": "owner"
  }'
```

## What This Setup Does

✅ **Creates Demo Organization**: "TestFlight Demo Organization" with full description
✅ **Grants Owner Role**: User gets `owner` role (highest level of access)
✅ **Sets Enterprise Plan**: User gets `enterprise` plan for full feature access
✅ **Activates Account**: Sets status to `active`
✅ **Audit Logging**: Records the setup action for compliance

## Verification

After running the setup, verify that `test@tester.com`:

1. Can log in to the application
2. Has access to all features (owner permissions)
3. Is associated with the "TestFlight Demo Organization"
4. Has enterprise plan status

## Files Created

- `supabase/migrations/20251227000000_setup_testflight_demo_account.sql` - SQL migration
- `supabase/functions/setup-demo-account/index.ts` - Edge function (alternative approach)
- `setup-demo-account.js` - Node.js script (alternative approach)
- `SETUP_DEMO_ACCOUNT_README.md` - This documentation

## Next Steps

1. Run the SQL script in your Supabase dashboard
2. Test the account by logging in as `test@tester.com`
3. Verify all features are accessible
4. Distribute to TestFlight testers
