import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Secure OAuth Credentials Storage
 * 
 * SECURITY: Uses AES-256-GCM encryption with unique keys per organization
 * Keys stored in Supabase Vault, never in database alongside encrypted data
 * 
 * CRITICAL FIX: Replaces weak btoa() encoding with proper encryption
 */

interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
}

/**
 * Generate AES-256-GCM key for organization
 */
async function generateEncryptionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt credentials with AES-256-GCM
 */
async function encryptCredentials(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: 128 },
    key,
    encoder.encode(plaintext)
  );

  // Split authentication tag from ciphertext
  const ciphertextArray = new Uint8Array(ciphertext);
  const tag = ciphertextArray.slice(-16); // Last 16 bytes
  const actualCiphertext = ciphertextArray.slice(0, -16);

  return {
    ciphertext: btoa(String.fromCharCode(...actualCiphertext)),
    iv: btoa(String.fromCharCode(...iv)),
    tag: btoa(String.fromCharCode(...tag)),
  };
}

/**
 * Store encryption key in Supabase Vault
 * SECURITY: Keys stored separately from encrypted data
 */
async function storeKeyInVault(
  supabase: any,
  organizationId: string,
  provider: string,
  key: CryptoKey
): Promise<string> {
  // Export key to JWK format for storage
  const exportedKey = await crypto.subtle.exportKey('jwk', key);
  const keyId = `integration_key_${provider}_${organizationId}_${crypto.randomUUID()}`;

  // Store in Supabase Vault (encrypted at rest by Supabase)
  const { error } = await supabase
    .from('vault.secrets')
    .insert({
      name: keyId,
      secret: JSON.stringify(exportedKey),
      description: `AES-256-GCM key for ${provider} integration (org: ${organizationId})`,
    });

  if (error) {
    console.error('Vault storage error:', error);
    throw new Error('Failed to store encryption key in vault');
  }

  return keyId;
}

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

    // Generate encryption key
    const encryptionKey = await generateEncryptionKey();

    // Encrypt credentials
    const encrypted = await encryptCredentials(
      JSON.stringify(credentials),
      encryptionKey
    );

    // Store encryption key in Vault (separate from encrypted data)
    const keyId = await storeKeyInVault(
      supabase,
      organization_id,
      provider,
      encryptionKey
    );

    // Store encrypted credentials in integrations table
    const { error: insertError } = await supabase
      .from('integrations')
      .update({
        credentials_encrypted: JSON.stringify(encrypted),
      })
      .eq('provider', provider)
      .eq('organization_id', organization_id);

    if (insertError) {
      throw new Error('Failed to store encrypted credentials');
    }

    // Log security event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      organization_id,
      action: 'ENCRYPT_CREDENTIALS',
      resource_type: 'integration',
      event_type: 'security',
      metadata: {
        provider,
        key_id: keyId,
        encryption_algorithm: 'AES-256-GCM',
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`✅ Credentials encrypted for ${provider} (org: ${organization_id})`);
    console.log(`   Key ID: ${keyId}`);
    console.log(`   Algorithm: AES-256-GCM`);
    console.log(`   IV Length: 12 bytes`);
    console.log(`   Tag Length: 16 bytes`);

    return new Response(
      JSON.stringify({
        success: true,
        key_id: keyId,
        encryption_algorithm: 'AES-256-GCM',
        message: 'Credentials encrypted and stored securely',
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
