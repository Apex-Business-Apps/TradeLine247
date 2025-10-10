import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3?target=deno&bundle&dts";

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

    const { fieldEncryptionData } = await req.json();

    if (!fieldEncryptionData) {
      throw new Error('Missing fieldEncryptionData');
    }

    // Store in custom encryption_keys table
    // fieldEncryptionData contains: { fieldName: { key, iv }, ... }
    const { data: keyData, error: insertError } = await supabaseClient
      .from('encryption_keys')
      .insert({
        user_id: user.id,
        key_encrypted: JSON.stringify(fieldEncryptionData), // Store all field keys/IVs as JSON
        iv: '', // Not used in this approach
        purpose: 'credit_application_encryption',
        metadata: {
          created_by: user.email,
          field_count: Object.keys(fieldEncryptionData).length,
          timestamp: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('Key storage error:', insertError);
      throw new Error('Failed to store encryption key');
    }

    // Log audit event
    await supabaseClient.from('audit_events').insert({
      user_id: user.id,
      action: 'CREATE',
      resource_type: 'encryption_key',
      resource_id: keyData.id,
      event_type: 'key_creation',
      metadata: {
        purpose: 'credit_application_encryption',
        field_count: Object.keys(fieldEncryptionData).length,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`✅ Encryption keys stored: ${keyData.id} (${Object.keys(fieldEncryptionData).length} fields)`);

    return new Response(
      JSON.stringify({ keyId: keyData.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error storing encryption key:', error);
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
