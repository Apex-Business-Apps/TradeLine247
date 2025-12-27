import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, unauthorizedResponse } from '../_shared/authorizationMiddleware.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetupDemoAccountRequest {
  email: string;
  organizationName?: string;
  plan?: string;
  role?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Require admin authorization
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return unauthorizedResponse(authResult);
  }

  try {
    const { email, organizationName = 'TestFlight Demo Organization', plan = 'enterprise', role = 'owner' } = await req.json() as SetupDemoAccountRequest;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`🔍 Looking up user: ${email}`);

    // Get user by email from auth.users
    const { data: authUsers, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
      throw new Error(`Failed to list users: ${userError.message}`);
    }

    const user = authUsers.users.find(u => u.email === email);

    if (!user) {
      return new Response(JSON.stringify({
        error: `User ${email} not found. Available users: ${authUsers.users.slice(0, 5).map(u => u.email).join(', ')}`
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`✅ Found user: ${user.id}`);

    // Create or get organization
    console.log(`🏢 Creating/getting organization: ${organizationName}`);
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        name: organizationName,
        description: `Demo organization for ${email}`
      }, { onConflict: 'name' })
      .select()
      .single();

    if (orgError) {
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    console.log(`✅ Organization ready: ${org.name} (ID: ${org.id})`);

    // Add user to organization with specified role
    console.log(`👑 Granting ${role} permissions...`);
    const { error: memberError } = await supabase
      .from('organization_members')
      .upsert({
        org_id: org.id,
        user_id: user.id,
        role: role
      });

    if (memberError) {
      throw new Error(`Failed to add user to organization: ${memberError.message}`);
    }

    // Update user profile
    console.log(`📝 Updating user profile...`);
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        plan: plan,
        status: 'active'
      });

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    // Audit log
    console.log(`📊 Creating audit log...`);
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      org_id: org.id,
      action: 'demo_account_setup',
      payload: {
        setup_type: 'testflight_demo',
        email: email,
        granted_permissions: 'full_access',
        plan: plan,
        role: role,
        organization_name: organizationName
      }
    });

    console.log(`🎉 SUCCESS! User ${email} now has full demo access.`);

    return new Response(JSON.stringify({
      success: true,
      message: `Demo account setup complete for ${email}`,
      user: {
        id: user.id,
        email: user.email,
        role: role,
        plan: plan,
        organization: org.name
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Setup failed:', errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
