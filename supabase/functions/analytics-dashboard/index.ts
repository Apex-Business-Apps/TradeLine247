import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface DashboardRequest {
  tenant_id: string;
  days?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCors(req);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const body: DashboardRequest = await req.json();
    const days = body.days || 30;

    console.log('Fetching analytics for tenant:', body.tenant_id);

    // Get call summary
    const { data: summary, error: summaryError } = await supabase
      .rpc('get_call_analytics_summary', {
        p_tenant_id: body.tenant_id,
        p_days: days
      });

    if (summaryError) throw summaryError;

    // Get recent calls
    const { data: recentCalls, error: callsError } = await supabase
      .from('call_transcriptions')
      .select('*')
      .eq('tenant_id', body.tenant_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (callsError) throw callsError;

    // Get top metrics by type
    const { data: metrics, error: metricsError } = await supabase
      .from('call_analytics_metrics')
      .select(`
        metric_name,
        metric_value,
        call_transcriptions!inner(tenant_id)
      `)
      .eq('call_transcriptions.tenant_id', body.tenant_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (metricsError) throw metricsError;

    // Aggregate metrics by type
    const metricsByType: Record<string, { count: number; avg: number; total: number }> = {};
    
    metrics?.forEach((m: any) => {
      const name = m.metric_name;
      if (!metricsByType[name]) {
        metricsByType[name] = { count: 0, avg: 0, total: 0 };
      }
      metricsByType[name].count++;
      metricsByType[name].total += m.metric_value;
    });

    Object.keys(metricsByType).forEach(key => {
      metricsByType[key].avg = metricsByType[key].total / metricsByType[key].count;
    });

    // Get daily call volume
    const { data: dailyVolume, error: volumeError } = await supabase
      .from('call_transcriptions')
      .select('created_at, direction')
      .eq('tenant_id', body.tenant_id)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (volumeError) throw volumeError;

    // Group by day
    const volumeByDay: Record<string, { inbound: number; outbound: number }> = {};
    dailyVolume?.forEach((call: any) => {
      const day = call.created_at.split('T')[0];
      if (!volumeByDay[day]) {
        volumeByDay[day] = { inbound: 0, outbound: 0 };
      }
      if (call.direction === 'inbound') {
        volumeByDay[day].inbound++;
      } else {
        volumeByDay[day].outbound++;
      }
    });

    const response = {
      summary: summary?.[0] || {
        total_calls: 0,
        avg_duration_seconds: 0,
        avg_confidence: 0,
        total_minutes: 0,
        inbound_calls: 0,
        outbound_calls: 0
      },
      recent_calls: recentCalls || [],
      metrics_by_type: metricsByType,
      daily_volume: volumeByDay,
      period_days: days
    };

    console.log('Analytics fetched successfully');

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analytics-dashboard:', error);
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
