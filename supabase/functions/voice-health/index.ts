// Health Check Endpoint for Telephony System
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const businessTargetE164 = Deno.env.get('BUSINESS_TARGET_E164');

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {} as Record<string, any>,
    };

    // Check environment variables
    health.checks.env = {
      TWILIO_AUTH_TOKEN: !!twilioAuthToken,
      BUSINESS_TARGET_E164: !!businessTargetE164,
      SUPABASE_URL: !!supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: !!supabaseServiceKey,
    };

    // Check database connectivity
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data, error } = await supabase
        .from('call_logs')
        .select('call_sid')
        .limit(1);

      health.checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        error: error?.message || null,
      };
    } catch (dbError: any) {
      health.checks.database = {
        status: 'unhealthy',
        error: dbError.message,
      };
      health.status = 'degraded';
    }

    // Check recent call activity
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { count, error } = await supabase
        .from('call_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', fiveMinutesAgo);

      health.checks.recent_activity = {
        calls_last_5min: count || 0,
        error: error?.message || null,
      };
    } catch (activityError: any) {
      health.checks.recent_activity = {
        error: activityError.message,
      };
    }

    // Overall health determination
    const allChecksHealthy = Object.values(health.checks).every(
      (check: any) => check.status !== 'unhealthy' && !check.error
    );

    if (!allChecksHealthy) {
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;

    return new Response(JSON.stringify(health, null, 2), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
