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

    const { key, iv } = await req.json();

    if (!key || !iv) {
      throw new Error('Missing key or iv');
    }

    // Generate unique key ID
    const keyId = `key_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store in Supabase Vault
    const { error: vaultError } = await supabaseClient
      .from('vault.secrets')
      .insert({
        name: keyId,
        secret: JSON.stringify({ key, iv, user_id: user.id }),
        description: 'Credit application encryption key',
      });

    if (vaultError) {
      console.error('Vault storage error:', vaultError);
      throw new Error('Failed to store encryption key');
    }

    // Log audit event
    await supabaseClient.from('audit_events').insert({
      user_id: user.id,
      action: 'CREATE',
      resource_type: 'encryption_key',
      resource_id: keyId,
      event_type: 'key_creation',
      metadata: {
        purpose: 'credit_application_encryption',
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({ keyId }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error storing encryption key:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
