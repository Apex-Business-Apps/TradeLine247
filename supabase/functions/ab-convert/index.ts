import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';
import { preflight, jsonResponse, unexpectedErrorResponse, withCors } from '../_shared/cors.ts';
import { secureHeaders } from '../_shared/secure_headers.ts';

interface ConvertRequest {
  testName: string;
  conversionValue?: number;
}

serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
    }

    const { testName, conversionValue }: ConvertRequest = await req.json();
    
    if (!testName) {
      return jsonResponse({ error: 'Test name required' }, { status: 400 });
    }

    // Verify signed cookie integrity
    const cookies = req.headers.get('cookie') || '';
    const anonIdCookie = cookies.match(/anon_id=([^;]+)/);
    const integrityCookie = cookies.match(new RegExp(`exp_${testName}=([^;]+)`));

    if (!anonIdCookie || !integrityCookie) {
      console.log('Missing required cookies for conversion');
      return jsonResponse({ error: 'Invalid cohort' }, { status: 400 });
    }

    const anonymousId = anonIdCookie[1];
    const integrityValue = integrityCookie[1];
    const [variant, signature] = integrityValue.split('.');

    if (!variant || !signature) {
      console.log('Invalid integrity cookie format');
      return jsonResponse({ error: 'Invalid cohort' }, { status: 400 });
    }

    // Verify HMAC signature
    const secret = Deno.env.get('AB_TEST_SECRET') || 'default-secret';
    const encoder = new TextEncoder();
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureData = encoder.encode(`${testName}:${variant}:${anonymousId}`);
    
    try {
      const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
      const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, signatureData);
      
      if (!isValid) {
        console.log('Invalid HMAC signature for conversion');
        return jsonResponse({ error: 'Invalid cohort' }, { status: 400 });
      }
    } catch (error) {
      console.log('HMAC verification error:', error);
      return jsonResponse({ error: 'Invalid cohort' }, { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Mark conversion (only if not already converted and belongs to this session)
    const { error } = await supabase
      .from('ab_test_assignments')
      .update({ converted: true })
      .eq('test_name', testName)
      .eq('user_session', anonymousId)
      .eq('variant', variant)
      .eq('converted', false);

    if (error) {
      console.error('Conversion update error:', error);
      return jsonResponse({ error: 'Error updating conversion' }, { status: 500 });
    }

    // Track conversion in analytics (server-side only)
    await supabase.from('analytics_events').insert({
      event_type: 'ab_test_conversion',
      event_data: { 
        test_name: testName, 
        variant, 
        conversion_value: conversionValue 
      },
      user_session: anonymousId
    });

    console.log(`Conversion tracked: ${testName} -> ${variant}`);

    return new Response(null, { status: 204, headers: withCors(secureHeaders) });

  } catch (error) {
    return unexpectedErrorResponse(error, 'ab-convert');
  }
});
