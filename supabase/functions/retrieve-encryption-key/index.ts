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

    // Check rate limit
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseClient
      .rpc('check_key_retrieval_rate_limit', { p_user_id: user.id });

    if (rateLimitError || !rateLimitCheck) {
      console.error('Rate limit check failed:', rateLimitError);
      throw new Error('Rate limit exceeded. Too many key retrieval attempts.');
    }

    // Retrieve from encryption_keys table
    const { data: keyData, error: retrieveError } = await supabaseClient
      .from('encryption_keys')
      .select('*')
      .eq('id', keyId)
      .single();

    if (retrieveError || !keyData) {
      console.error('Key retrieval error:', retrieveError);
      
      // Log failed attempt
      await supabaseClient.from('key_retrieval_attempts').insert({
        user_id: user.id,
        key_id: keyId,
        success: false,
      });
      
      throw new Error('Encryption key not found');
    }

    // Verify authorization
    if (keyData.user_id !== user.id) {
      const { data: roles } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['super_admin', 'org_admin']);

      if (!roles || roles.length === 0) {
        throw new Error('Unauthorized: Cannot access other users encryption keys');
      }
    }

    // Update access tracking
    await supabaseClient
      .from('encryption_keys')
      .update({
        access_count: (keyData.access_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', keyId);

    // Log successful attempt
    await supabaseClient.from('key_retrieval_attempts').insert({
      user_id: user.id,
      key_id: keyId,
      success: true,
    });

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

    console.log(`✅ Encryption keys retrieved: ${keyId} (access count: ${(keyData.access_count || 0) + 1})`);

    return new Response(
      JSON.stringify({ 
        fieldEncryptionData: JSON.parse(keyData.key_encrypted)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error retrieving encryption key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
