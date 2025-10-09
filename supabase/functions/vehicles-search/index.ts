import { createClient } from "supabase";
import { z } from "zod";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: 60 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  
  if (limit.count >= 60) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Validation schema
const searchSchema = z.object({
  q: z.string().max(200).optional(),
  province: z.string().length(2).toUpperCase().optional(),
  engine: z.string().transform(val => val.split(',')).optional(),
  seatsMin: z.coerce.number().int().min(1).max(20).optional(),
  seatsMax: z.coerce.number().int().min(1).max(20).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(1000).optional(),
  sort: z.enum(['relevance', 'price_asc', 'price_desc', 'year_desc', 'distance_asc']).default('relevance'),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Maximum 60 requests per minute.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse and validate query parameters
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    
    const validated = searchSchema.safeParse(params);
    
    if (!validated.success) {
      console.error('Validation error:', validated.error.format());
      return new Response(
        JSON.stringify({ 
          error: 'Invalid query parameters', 
          details: validated.error.format() 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const searchParams = validated.data;

    // Create Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Call the RPC function
    const startTime = performance.now();
    
    const { data, error } = await supabase.rpc('vehicles_search', {
      p_q: searchParams.q || null,
      p_province: searchParams.province || null,
      p_engine: searchParams.engine || null,
      p_seats_min: searchParams.seatsMin || null,
      p_seats_max: searchParams.seatsMax || null,
      p_lat: searchParams.lat || null,
      p_lng: searchParams.lng || null,
      p_radius_km: searchParams.radiusKm || null,
      p_sort: searchParams.sort,
      p_offset: searchParams.offset,
      p_limit: searchParams.limit,
    });

    const queryTime = Math.round(performance.now() - startTime);

    if (error) {
      console.error('RPC error:', error);
      return new Response(
        JSON.stringify({ error: 'Database query failed', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate next offset for pagination
    const nextOffset = data.length === searchParams.limit 
      ? searchParams.offset + searchParams.limit 
      : null;

    console.log(`Search completed: ${data.length} results in ${queryTime}ms for IP ${clientIP}`);

    return new Response(
      JSON.stringify({
        items: data,
        nextOffset,
        count: data.length,
        queryTime,
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Query-Time-Ms': queryTime.toString(),
        },
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
