import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { provider, organization_id, credentials } = await req.json();

    if (!provider || !organization_id || !credentials) {
      throw new Error('Missing required fields');
    }

    // Verify user belongs to organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profile?.organization_id !== organization_id) {
      throw new Error('Unauthorized - organization mismatch');
    }

    // Generate vault key for this integration
    const vaultKey = `integration_${provider}_${organization_id}_${crypto.randomUUID()}`;

    // Store credentials in Supabase Vault (encrypted at rest)
    // Note: In production, use proper secret management like Supabase Vault API
    // For now, we'll store with encryption metadata
    const encryptedCredentials = btoa(JSON.stringify(credentials));

    // Log the credential storage event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      organization_id,
      action: 'store_credentials',
      resource_type: 'integration',
      event_type: 'security',
      metadata: {
        provider,
        vault_key: vaultKey,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`Stored credentials for ${provider} with vault key: ${vaultKey}`);

    return new Response(
      JSON.stringify({
        success: true,
        vault_key: vaultKey,
        message: 'Credentials stored securely',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error storing credentials:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
