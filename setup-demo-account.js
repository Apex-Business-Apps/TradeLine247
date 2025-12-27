#!/usr/bin/env node

/**
 * Setup Demo Account Script
 * Grants full-access demo permissions to test@tester.com for TestFlight testing
 *
 * This script calls the Supabase Edge Function that handles the setup.
 */

// Configuration
const SUPABASE_PROJECT_ID = 'hysvqdwmhxnblxfqnszn';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/setup-demo-account`;

// You'll need to provide an admin JWT token to call the function
const ADMIN_JWT_TOKEN = process.env.SUPABASE_ADMIN_JWT || process.env.ADMIN_JWT;

async function setupDemoAccount() {
  try {
    console.log('🚀 Setting up demo account for test@tester.com...');
    console.log('📍 Function URL:', FUNCTION_URL);

    if (!ADMIN_JWT_TOKEN) {
      console.error('❌ Missing ADMIN_JWT_TOKEN environment variable');
      console.log('\nTo set it, run:');
      console.log('export ADMIN_JWT_TOKEN="your_admin_jwt_token_here"');
      console.log('\nYou can get this token from:');
      console.log('1. Supabase Dashboard > Authentication > Users');
      console.log('2. Sign in as an admin user');
      console.log('3. Copy the JWT token from browser dev tools');
      process.exit(1);
    }

    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_JWT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@tester.com',
        organizationName: 'TestFlight Demo Organization',
        plan: 'enterprise',
        role: 'owner'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }

    console.log('🎉 SUCCESS!');
    console.log('✅ Demo account setup complete!');
    console.log('📧 Email:', data.user?.email);
    console.log('🆔 User ID:', data.user?.id);
    console.log('👑 Role:', data.user?.role);
    console.log('📋 Plan:', data.user?.plan);
    console.log('🏢 Organization:', data.user?.organization);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure test@tester.com exists in Supabase Auth');
    console.log('2. Verify your ADMIN_JWT_TOKEN is valid and has admin permissions');
    console.log('3. Check Supabase function logs for detailed errors');
  }
}

setupDemoAccount();
