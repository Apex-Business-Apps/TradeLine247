-- Setup TestFlight Demo Account for test@tester.com
-- This migration grants full-access demo permissions for TestFlight testing

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
