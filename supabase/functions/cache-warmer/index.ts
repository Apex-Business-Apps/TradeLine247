import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WarmingConfig {
  config_key: string;
  endpoint: string;
  params: Record<string, any>;
  priority: number;
}

interface CacheWarmingResult {
  config_key: string;
  success: boolean;
  cached: boolean;
  duration_ms: number;
  error?: string;
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
    console.log('🔥 Starting cache warming cycle...');

    // Get configs due for warming
    const { data: configs, error: configError } = await supabase
      .rpc('get_warming_due');

    if (configError) {
      throw new Error(`Failed to get warming configs: ${configError.message}`);
    }

    if (!configs || configs.length === 0) {
      console.log('✅ No cache entries due for warming');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No warming needed',
          warmed: 0,
          duration_ms: Date.now() - startTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${configs.length} configs to warm`);

    // Process each warming config
    const results: CacheWarmingResult[] = [];
    
    for (const config of configs as WarmingConfig[]) {
      const warmStart = Date.now();
      let success = false;
      let cached = false;
      let error: string | undefined;

      try {
        console.log(`🔄 Warming: ${config.config_key}`);

        // Determine cache key
        const cacheKey = `warm:${config.config_key}:${JSON.stringify(config.params)}`;

        // Call the endpoint to generate/refresh data
        const response = await supabase.functions.invoke(
          config.endpoint.replace('/functions/v1/', ''),
          { body: config.params }
        );

        if (response.error) {
          throw new Error(response.error.message);
        }

        // Cache the response
        const { error: cacheError } = await supabase.rpc('set_cached_value', {
          p_cache_key: cacheKey,
          p_value: response.data,
          p_ttl_seconds: 300, // 5 minutes default
          p_cache_type: 'warmed',
          p_priority: config.priority,
          p_tags: ['warmed', config.config_key]
        });

        if (cacheError) {
          console.warn(`⚠️  Cache storage failed: ${cacheError.message}`);
        } else {
          cached = true;
        }

        success = true;
        console.log(`✅ Warmed: ${config.config_key} in ${Date.now() - warmStart}ms`);

      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
        console.error(`❌ Failed to warm ${config.config_key}:`, error);
      }

      // Update warming status
      await supabase.rpc('update_warming_status', {
        p_config_key: config.config_key,
        p_success: success,
        p_interval_minutes: 5 // Default interval
      });

      results.push({
        config_key: config.config_key,
        success,
        cached,
        duration_ms: Date.now() - warmStart,
        error
      });
    }

    // Cleanup expired cache entries
    const { data: cleanedCount } = await supabase.rpc('cleanup_expired_cache');
    console.log(`🧹 Cleaned up ${cleanedCount || 0} expired cache entries`);

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    console.log(`✅ Cache warming complete: ${successCount}/${results.length} successful in ${totalDuration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        warmed: successCount,
        total: results.length,
        cleaned: cleanedCount || 0,
        duration_ms: totalDuration,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Cache warming failed:', error);
    
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