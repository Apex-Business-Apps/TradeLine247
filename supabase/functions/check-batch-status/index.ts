import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface StatusRequest {
  batch_id?: string;
  summary?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCors(req);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const url = new URL(req.url);
    const batchId = url.searchParams.get('batch_id');
    const summary = url.searchParams.get('summary') === 'true';

    console.log('Checking batch status:', { batchId, summary });

    // If specific batch requested
    if (batchId) {
      const { data: batch, error: batchError } = await supabase
        .from('batch_jobs')
        .select('*')
        .eq('batch_id', batchId)
        .single();

      if (batchError) {
        throw batchError;
      }

      // Get queue items for this batch
      const { data: queueItems, error: queueError } = await supabase
        .from('priority_queue')
        .select('*')
        .gte('created_at', batch.created_at)
        .lte('created_at', batch.completed_at || new Date().toISOString())
        .limit(100);

      return new Response(
        JSON.stringify({
          success: true,
          batch,
          queue_items: queueItems || [],
          progress: batch.total_items > 0 
            ? (batch.processed_items / batch.total_items * 100).toFixed(2) + '%'
            : '0%'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get queue statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_queue_stats');

    if (statsError) {
      console.error('Stats error:', statsError);
      throw statsError;
    }

    // Get recent batch jobs
    const { data: recentBatches, error: batchesError } = await supabase
      .from('batch_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (batchesError) {
      console.error('Batches error:', batchesError);
    }

    // Get pending jobs by priority
    const { data: pendingByPriority, error: pendingError } = await supabase
      .from('priority_queue')
      .select('priority')
      .eq('status', 'pending')
      .order('priority', { ascending: false });

    if (pendingError) {
      console.error('Pending error:', pendingError);
    }

    // Calculate priority distribution
    const priorityDistribution: Record<number, number> = {};
    pendingByPriority?.forEach((item: any) => {
      priorityDistribution[item.priority] = (priorityDistribution[item.priority] || 0) + 1;
    });

    // Get failed jobs that need attention
    const { data: failedJobs, error: failedError } = await supabase
      .from('priority_queue')
      .select('*')
      .eq('status', 'failed')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (failedError) {
      console.error('Failed jobs error:', failedError);
    }

    const response = {
      success: true,
      queue_stats: stats?.[0] || {
        total_pending: 0,
        total_processing: 0,
        total_completed_today: 0,
        total_failed_today: 0,
        avg_processing_time_seconds: 0
      },
      recent_batches: recentBatches || [],
      priority_distribution: priorityDistribution,
      failed_jobs: failedJobs || [],
      summary: summary ? {
        health: calculateHealthScore(stats?.[0]),
        recommendations: generateRecommendations(stats?.[0], priorityDistribution)
      } : undefined
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-batch-status:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function calculateHealthScore(stats: any): string {
  if (!stats) return 'unknown';
  
  const pending = stats.total_pending || 0;
  const processing = stats.total_processing || 0;
  const failedToday = stats.total_failed_today || 0;
  const completedToday = stats.total_completed_today || 0;
  
  if (failedToday > completedToday * 0.1) return 'critical';
  if (pending > 1000 || processing > 100) return 'degraded';
  if (failedToday > 0) return 'warning';
  return 'healthy';
}

function generateRecommendations(stats: any, priorityDist: Record<number, number>): string[] {
  const recommendations: string[] = [];
  
  if (!stats) return recommendations;
  
  const pending = stats.total_pending || 0;
  const processing = stats.total_processing || 0;
  const failedToday = stats.total_failed_today || 0;
  
  if (pending > 500) {
    recommendations.push('High queue backlog detected. Consider increasing batch size or frequency.');
  }
  
  if (processing > 50) {
    recommendations.push('Many jobs currently processing. Monitor for stuck jobs.');
  }
  
  if (failedToday > 10) {
    recommendations.push('High failure rate today. Review error logs and retry logic.');
  }
  
  const highPriorityCount = Object.entries(priorityDist)
    .filter(([priority]) => parseInt(priority) >= 8)
    .reduce((sum, [, count]) => sum + count, 0);
  
  if (highPriorityCount > 100) {
    recommendations.push('Many high-priority jobs pending. Consider emergency processing.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Queue is operating normally.');
  }
  
  return recommendations;
}
