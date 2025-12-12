/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '7');

    console.log(`📊 Fetching cache statistics for ${days} days`);

    // Get comprehensive cache statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_cache_statistics', { p_days: days });

    if (statsError) {
      throw new Error(`Failed to get statistics: ${statsError.message}`);
    }

    // Get top performing cache entries
    const { data: topEntries, error: topError } = await supabase
      .from('api_cache')
      .select('cache_key, cache_type, hit_count, miss_count, ttl_seconds, last_hit_at, created_at')
      .order('hit_count', { ascending: false })
      .limit(20);

    if (topError) {
      console.warn('Failed to get top entries:', topError.message);
    }

    // Get cache warming status
    const { data: warmingStatus, error: warmingError } = await supabase
      .from('cache_warming_config')
      .select('config_key, enabled, last_warmed_at, next_warmup_at, success_count, failure_count, priority')
      .eq('enabled', true)
      .order('priority', { ascending: false });

    if (warmingError) {
      console.warn('Failed to get warming status:', warmingError.message);
    }

    // Calculate overall metrics
    const totalHits = stats?.reduce((sum: number, s: any) => sum + (s.total_hits || 0), 0) || 0;
    const totalMisses = stats?.reduce((sum: number, s: any) => sum + (s.total_misses || 0), 0) || 0;
    const totalEntries = stats?.reduce((sum: number, s: any) => sum + (s.total_entries || 0), 0) || 0;
    const overallHitRate = totalHits + totalMisses > 0 
      ? ((totalHits / (totalHits + totalMisses)) * 100).toFixed(2)
      : '0.00';

    const response = {
      success: true,
      period_days: days,
      overall: {
        total_entries: totalEntries,
        total_hits: totalHits,
        total_misses: totalMisses,
        hit_rate: `${overallHitRate}%`,
        total_size_mb: stats?.reduce((sum: number, s: any) => sum + (s.total_size_mb || 0), 0).toFixed(2)
      },
      by_type: stats || [],
      top_entries: topEntries?.map((entry: any) => ({
        ...entry,
        hit_rate: entry.hit_count + entry.miss_count > 0
          ? `${((entry.hit_count / (entry.hit_count + entry.miss_count)) * 100).toFixed(1)}%`
          : '0%'
      })) || [],
      warming_status: warmingStatus?.map((w: any) => ({
        ...w,
        success_rate: w.success_count + w.failure_count > 0
          ? `${((w.success_count / (w.success_count + w.failure_count)) * 100).toFixed(1)}%`
          : 'N/A',
        next_warmup_in_minutes: w.next_warmup_at 
          ? Math.max(0, Math.floor((new Date(w.next_warmup_at).getTime() - Date.now()) / 60000))
          : null
      })) || [],
      query_duration_ms: Date.now() - startTime
    };

    console.log(`✅ Cache statistics retrieved: ${totalEntries} entries, ${overallHitRate}% hit rate`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Cache stats error:', error);
    
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