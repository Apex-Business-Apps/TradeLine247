// Requires standard JWT auth via supabase-js when invoked from the app.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { preflight, corsHeaders } from '../_shared/cors.ts';
import { secureHeaders, mergeHeaders } from '../_shared/secure_headers.ts';

serve(async (req) => {
  const pf = preflight(req);
  if (pf) return pf;

  const { ANALYTICS_WRITE_KEY } = Deno.env.toObject()
  if (!ANALYTICS_WRITE_KEY) {
    return new Response(null, { 
      status: 204, 
      headers: mergeHeaders(corsHeaders, secureHeaders) 
    }) // gated no-op
  }
  if (req.method !== 'POST') {
    return new Response(null, { 
      status: 405, 
      headers: mergeHeaders(corsHeaders, secureHeaders) 
    })
  }
  // accept and drop (or forward to your sink)
  return new Response(null, { 
    status: 202, 
    headers: mergeHeaders(corsHeaders, secureHeaders) 
  })
})
