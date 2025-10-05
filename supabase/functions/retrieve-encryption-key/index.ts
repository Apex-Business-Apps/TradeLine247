import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { keyId } = await req.json();

    if (!keyId) {
      throw new Error('Missing keyId');
    }

    // Retrieve from Supabase Vault
    const { data: vaultData, error: vaultError } = await supabaseClient
      .from('vault.secrets')
      .select('secret')
      .eq('name', keyId)
      .single();

    if (vaultError || !vaultData) {
      console.error('Vault retrieval error:', vaultError);
      throw new Error('Encryption key not found');
    }

    const secretData = JSON.parse(vaultData.secret);

    // Verify the key belongs to the requesting user
    if (secretData.user_id !== user.id) {
      // Check if user has admin role for accessing other users' keys
      const { data: roles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['super_admin', 'org_admin']);

      if (!roles || roles.length === 0) {
        throw new Error('Unauthorized: Cannot access other users encryption keys');
      }
    }

    // Log audit event
    await supabaseClient.from('audit_events').insert({
      user_id: user.id,
      action: 'READ',
      resource_type: 'encryption_key',
      resource_id: keyId,
      event_type: 'key_retrieval',
      metadata: {
        purpose: 'credit_application_decryption',
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({ 
        key: secretData.key, 
        iv: secretData.iv 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error retrieving encryption key:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
