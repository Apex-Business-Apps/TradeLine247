/**
 * Supabase Edge Function (Deno)
 * Purpose: RAG search with rate limiting and optional language filter.
 * Security: Server-side rate limiting, input validation, audit logging
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, preflight } from '../_shared/cors.ts';

type AnyRecord = Record<string, unknown>;

function normalizeRecord(input: unknown): AnyRecord {
  return input && typeof input === "object" ? (input as AnyRecord) : {};
}

/** Safe own-property check (ESLint-friendly, no prototype calls on user objects) */
function hasOwn(obj: AnyRecord, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** Rate limiting check using database RPC */
async function checkRateLimit(
  supabase: any,
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const { data, error } = await supabase.rpc('secure_rate_limit', {
      identifier,
      max_requests: maxRequests,
      window_seconds: windowSeconds
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail closed - deny on error
      return { allowed: false, remaining: 0 };
    }

    const result = data as { allowed: boolean; remaining: number; limit: number };
    return {
      allowed: result?.allowed ?? false,
      remaining: result?.remaining ?? 0
    };
  } catch (err) {
    console.error('Rate limit exception:', err);
    // Fail closed - deny on error
    return { allowed: false, remaining: 0 };
  }
}

async function handleRagSearch(req: Request): Promise<Response> {
  const pf = preflight(req);
  if (pf) return pf;

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed. Use POST.' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client identifier for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const rateLimitKey = `rag-search:${clientIP}`;

    // Check rate limit: 60 requests per minute
    const rateLimitResult = await checkRateLimit(supabase, rateLimitKey, 60, 60);
    
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for RAG search: ${clientIP}`);
      
      // Log security event
      await supabase.from('analytics_events').insert({
        event_type: 'rate_limit_exceeded',
        event_data: { 
          endpoint: 'rag-search',
          ip: clientIP,
          remaining: rateLimitResult.remaining
        },
        ip_address: clientIP
      });

      return new Response(
        JSON.stringify({ 
          ok: false, 
          error: 'Rate limit exceeded. Please try again later.',
          remaining: rateLimitResult.remaining
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const bodyRaw = await req.json().catch(() => ({}));
    const body: AnyRecord = normalizeRecord(bodyRaw);

    const filters = normalizeRecord(body.filters);
    const queryLang = typeof body.queryLang === "string" ? body.queryLang.trim() : undefined;
    const autoLang = typeof body.autoLang === "boolean" ? body.autoLang : undefined;

    // If caller didn't provide filters.lang but provided queryLang,
    // add it automatically unless autoLang === false
    if (!hasOwn(filters, "lang") && queryLang && autoLang !== false) {
      (filters as AnyRecord).lang = queryLang;
    }

    // TODO: Integrate with your actual search pipeline here
    // This is a placeholder implementation
    const payload = {
      ok: true,
      filters,
      results: [] as unknown[],
      remaining: rateLimitResult.remaining - 1
    };

    // Log successful request
    await supabase.from('analytics_events').insert({
      event_type: 'rag_search_request',
      event_data: { 
        filters,
        ip: clientIP,
        remaining: rateLimitResult.remaining - 1
      },
      ip_address: clientIP
    });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "content-type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error('RAG search error:', err);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

/** Deno / Supabase Edge entrypoint */
Deno.serve((req: Request) => handleRagSearch(req));
