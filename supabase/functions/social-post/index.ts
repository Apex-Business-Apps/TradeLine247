import { createClient } from "supabase";
import { createHmac } from "std/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PostRequest {
  provider: 'x' | 'facebook' | 'instagram';
  message: string;
  organizationId: string;
}

// X (Twitter) OAuth helpers
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const signatureBaseString = `${method}&${encodeURIComponent(
    url
  )}&${encodeURIComponent(
    Object.entries(params)
      .sort()
      .map(([k, v]) => `${k}=${v}`)
      .join("&")
  )}`;
  const signingKey = `${encodeURIComponent(
    consumerSecret
  )}&${encodeURIComponent(tokenSecret)}`;
  const hmacSha1 = createHmac("sha1", signingKey);
  const signature = hmacSha1.update(signatureBaseString).digest("base64");
  return signature;
}

function generateOAuthHeader(
  method: string,
  url: string,
  apiKey: string,
  apiSecret: string,
  accessToken: string,
  accessTokenSecret: string
): string {
  const oauthParams = {
    oauth_consumer_key: apiKey,
    oauth_nonce: Math.random().toString(36).substring(2),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    apiSecret,
    accessTokenSecret
  );

  const signedOAuthParams = {
    ...oauthParams,
    oauth_signature: signature,
  };

  const entries = Object.entries(signedOAuthParams).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    "OAuth " +
    entries
      .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
      .join(", ")
  );
}

async function postToX(message: string, credentials: any): Promise<any> {
  const url = 'https://api.x.com/2/tweets';
  const method = 'POST';
  
  const oauthHeader = generateOAuthHeader(
    method,
    url,
    credentials.consumer_key,
    credentials.consumer_secret,
    credentials.access_token,
    credentials.access_token_secret
  );

  const response = await fetch(url, {
    method: method,
    headers: {
      Authorization: oauthHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: message }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`X API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function postToFacebook(message: string, credentials: any): Promise<any> {
  const url = `https://graph.facebook.com/v18.0/${credentials.page_id}/feed`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message,
      access_token: credentials.access_token,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Facebook API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const body: PostRequest = await req.json();
    console.log('Posting to social media:', body);

    // Get integration credentials
    const { data: integration, error: integrationError } = await supabaseClient
      .from('integrations')
      .select('config')
      .eq('organization_id', body.organizationId)
      .eq('provider', body.provider)
      .eq('active', true)
      .single();

    if (integrationError || !integration) {
      throw new Error(`Integration not found for ${body.provider}`);
    }

    let result;
    switch (body.provider) {
      case 'x':
        result = await postToX(body.message, integration.config);
        break;
      case 'facebook':
        result = await postToFacebook(body.message, integration.config);
        break;
      default:
        throw new Error(`Provider ${body.provider} not yet implemented`);
    }

    console.log('Post successful:', result);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error posting to social media:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
