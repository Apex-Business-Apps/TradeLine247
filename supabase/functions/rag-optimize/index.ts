/**
 * RAG Performance Optimization Tools
 * Analyzes slow queries, recommends pre-computed answers, and optimizes vector indexes
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, preflight } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface OptimizationRequest {
  action: 'analyze_slow_queries' | 'recommend_precomputed' | 'optimize_indexes' | 'full_report';
  days?: number;
  threshold_ms?: number;
}

async function analyzeSlowQueries(supabase: any, days: number, thresholdMs: number) {
  console.log(`Analyzing slow queries from last ${days} days, threshold: ${thresholdMs}ms`);
  
  const { data: slowQueries, error } = await supabase
    .from('rag_query_analytics')
    .select('*')
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
    .gte('execution_time_ms', thresholdMs)
    .order('execution_time_ms', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching slow queries:', error);
    throw error;
  }

  // Group by query hash to find patterns
  const queryGroups = new Map<string, any[]>();
  slowQueries?.forEach((q: any) => {
    if (!queryGroups.has(q.query_hash)) {
      queryGroups.set(q.query_hash, []);
    }
    queryGroups.get(q.query_hash)!.push(q);
  });

  const analysis = Array.from(queryGroups.entries()).map(([hash, queries]) => {
    const avgTime = queries.reduce((sum, q) => sum + q.execution_time_ms, 0) / queries.length;
    const avgResults = queries.reduce((sum, q) => sum + (q.result_count || 0), 0) / queries.length;
    
    return {
      query_hash: hash,
      query_text: queries[0].query_text,
      frequency: queries.length,
      avg_execution_time_ms: Math.round(avgTime),
      max_execution_time_ms: Math.max(...queries.map(q => q.execution_time_ms)),
      avg_result_count: Math.round(avgResults),
      first_seen: queries[queries.length - 1].created_at,
      last_seen: queries[0].created_at
    };
  }).sort((a, b) => b.avg_execution_time_ms - a.avg_execution_time_ms);

  return {
    total_slow_queries: slowQueries?.length || 0,
    unique_patterns: analysis.length,
    queries: analysis.slice(0, 20),
    recommendations: analysis.slice(0, 5).map(q => ({
      query: q.query_text,
      issue: `High latency: ${q.avg_execution_time_ms}ms avg`,
      suggestion: q.frequency > 10 
        ? 'Consider pre-computing this answer (high frequency)'
        : 'Review query complexity and filters'
    }))
  };
}

async function recommendPrecomputed(supabase: any, days: number) {
  console.log(`Finding queries for pre-computation from last ${days} days`);
  
  const { data: analytics, error } = await supabase
    .from('rag_query_analytics')
    .select('query_text, query_hash, execution_time_ms, result_count, top_score')
    .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }

  // Group by query hash
  const queryStats = new Map<string, any>();
  analytics?.forEach((q: any) => {
    if (!queryStats.has(q.query_hash)) {
      queryStats.set(q.query_hash, {
        query_text: q.query_text,
        count: 0,
        total_time: 0,
        avg_results: 0,
        avg_score: 0
      });
    }
    const stats = queryStats.get(q.query_hash)!;
    stats.count++;
    stats.total_time += q.execution_time_ms;
    stats.avg_results += q.result_count || 0;
    stats.avg_score += q.top_score || 0;
  });

  // Calculate averages and score
  const candidates = Array.from(queryStats.entries()).map(([hash, stats]) => {
    const avgTime = stats.total_time / stats.count;
    const avgResults = stats.avg_results / stats.count;
    const avgScore = stats.avg_score / stats.count;
    
    // Score based on frequency, execution time, and result quality
    const score = (stats.count * 0.5) + (avgTime / 100) + (avgScore * 10);
    
    return {
      query_hash: hash,
      query_text: stats.query_text,
      frequency: stats.count,
      avg_execution_time_ms: Math.round(avgTime),
      avg_result_count: Math.round(avgResults),
      avg_relevance_score: avgScore.toFixed(3),
      precompute_score: score.toFixed(2),
      estimated_savings_ms: Math.round(avgTime * stats.count)
    };
  })
  .filter(c => c.frequency >= 3) // Only recommend if query appears 3+ times
  .sort((a, b) => parseFloat(b.precompute_score) - parseFloat(a.precompute_score))
  .slice(0, 20);

  return {
    total_candidates: candidates.length,
    recommendations: candidates,
    total_potential_savings_ms: candidates.reduce((sum, c) => sum + c.estimated_savings_ms, 0)
  };
}

async function optimizeIndexes(supabase: any) {
  console.log('Analyzing index performance');
  
  // Check current index usage
  const { data: indexStats, error: indexError } = await supabase.rpc('pg_stat_user_indexes', {});
  
  // Get table sizes
  const { data: tableSizes, error: sizeError } = await supabase.rpc('pg_total_relation_size', {});
  
  // Analyze missing embeddings
  const { data: healthCheck, error: healthError } = await supabase.rpc('rag_health_check', {});
  
  if (healthError) {
    console.error('Health check error:', healthError);
  }

  const recommendations = [];

  // Check for missing embeddings (indicates indexing issues)
  const healthData = Array.isArray(healthCheck) ? healthCheck : [];
  const missingEmbeddings = healthData.find((h: any) => h.check_name === 'missing_embeddings');
  if (missingEmbeddings && parseInt(missingEmbeddings.metric_value) > 0) {
    recommendations.push({
      type: 'missing_embeddings',
      severity: 'high',
      issue: `${missingEmbeddings.metric_value} chunks missing embeddings`,
      action: 'Run re-indexing via rag-ingest function for affected sources',
      sql: `SELECT DISTINCT s.id, s.title, COUNT(c.id) as missing_count
FROM rag_sources s
JOIN rag_chunks c ON s.id = c.source_id
LEFT JOIN rag_embeddings e ON c.id = e.chunk_id
WHERE e.id IS NULL AND s.deleted_at IS NULL
GROUP BY s.id, s.title;`
    });
  }

  // Check for orphaned data
  const orphanedChunks = healthData.find((h: any) => h.check_name === 'orphaned_chunks');
  if (orphanedChunks && parseInt(orphanedChunks.metric_value) > 0) {
    recommendations.push({
      type: 'orphaned_data',
      severity: 'medium',
      issue: `${orphanedChunks.metric_value} orphaned chunks found`,
      action: 'Run cleanup: SELECT rag_cleanup_orphaned_data();',
      sql: 'SELECT rag_cleanup_orphaned_data();'
    });
  }

  // Recommend VACUUM ANALYZE for RAG tables
  recommendations.push({
    type: 'maintenance',
    severity: 'low',
    issue: 'Regular maintenance not scheduled',
    action: 'Run VACUUM ANALYZE on RAG tables',
    sql: `VACUUM ANALYZE rag_sources;
VACUUM ANALYZE rag_chunks;
VACUUM ANALYZE rag_embeddings;`
  });

  return {
    health_status: healthData,
    recommendations,
    summary: {
      total_issues: recommendations.filter(r => r.severity === 'high').length,
      warnings: recommendations.filter(r => r.severity === 'medium').length,
      suggestions: recommendations.filter(r => r.severity === 'low').length
    }
  };
}

async function generateFullReport(supabase: any, days: number, thresholdMs: number) {
  console.log('Generating full optimization report');
  
  const [slowQueries, precomputed, indexes] = await Promise.all([
    analyzeSlowQueries(supabase, days, thresholdMs),
    recommendPrecomputed(supabase, days),
    optimizeIndexes(supabase)
  ]);

  return {
    generated_at: new Date().toISOString(),
    period_days: days,
    slow_query_analysis: slowQueries,
    precomputed_recommendations: precomputed,
    index_optimization: indexes,
    executive_summary: {
      total_slow_queries: slowQueries.total_slow_queries,
      high_priority_issues: indexes.summary.total_issues,
      precompute_candidates: precomputed.total_candidates,
      potential_time_savings_ms: precomputed.total_potential_savings_ms
    }
  };
}

Deno.serve(async (req: Request) => {
  const pf = preflight(req);
  if (pf) return pf;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const body: OptimizationRequest = await req.json();
    const action = body.action || 'full_report';
    const days = body.days || 7;
    const thresholdMs = body.threshold_ms || 500;

    let result;

    switch (action) {
      case 'analyze_slow_queries':
        result = await analyzeSlowQueries(supabase, days, thresholdMs);
        break;
      
      case 'recommend_precomputed':
        result = await recommendPrecomputed(supabase, days);
        break;
      
      case 'optimize_indexes':
        result = await optimizeIndexes(supabase);
        break;
      
      case 'full_report':
      default:
        result = await generateFullReport(supabase, days, thresholdMs);
        break;
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Optimization error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
