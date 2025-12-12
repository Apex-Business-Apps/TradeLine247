 
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InvalidateRequest {
  pattern?: string;      // SQL LIKE pattern (e.g., 'dashboard%')
  tags?: string[];       // Array of tags to match
  cache_type?: string;   // Specific cache type
  keys?: string[];       // Specific cache keys to delete
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
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

  try {
    const body: InvalidateRequest = await req.json().catch(() => ({}));

    console.log('🗑️  Cache invalidation request:', body);

    let totalDeleted = 0;

    // Handle specific keys
    if (body.keys && body.keys.length > 0) {
      for (const key of body.keys) {
        const { error } = await supabase
          .from('api_cache')
          .delete()
          .eq('cache_key', key);

        if (!error) {
          totalDeleted++;
        } else {
          console.warn(`Failed to delete key ${key}:`, error.message);
        }
      }
      console.log(`✅ Deleted ${totalDeleted} specific cache entries`);
    }

    // Handle pattern/tag-based invalidation
    if (body.pattern || body.tags || body.cache_type) {
      const { data: deleted, error } = await supabase.rpc('invalidate_cache', {
        p_pattern: body.pattern || null,
        p_tags: body.tags || null,
        p_cache_type: body.cache_type || null
      });

      if (error) {
        throw new Error(`Invalidation failed: ${error.message}`);
      }

      totalDeleted += (deleted || 0);
      console.log(`✅ Invalidated ${deleted || 0} cache entries by pattern/tags`);
    }

    // If no specific criteria, cleanup expired
    if (!body.keys && !body.pattern && !body.tags && !body.cache_type) {
      const { data: cleaned, error } = await supabase.rpc('cleanup_expired_cache');
      
      if (error) {
        console.warn('Cleanup warning:', error.message);
      } else {
        totalDeleted = cleaned || 0;
        console.log(`🧹 Cleaned up ${totalDeleted} expired entries`);
      }
    }

    const duration = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        deleted: totalDeleted,
        duration_ms: duration,
        criteria: {
          pattern: body.pattern,
          tags: body.tags,
          cache_type: body.cache_type,
          keys: body.keys?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Cache invalidation error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});