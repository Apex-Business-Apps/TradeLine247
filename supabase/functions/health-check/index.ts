 
/**
 * Health Check Endpoint
 *
 * Comprehensive health monitoring for all TradeLine 24/7 services.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enterpriseMonitor } from "../_shared/enterprise-monitoring.ts";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details?: Record<string, unknown>;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: ServiceHealth[];
  uptime: number;
}

const startTime = Date.now();

/**
 * Check Supabase database connectivity
 */
async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const { error } = await supabase
      .from('system_health_checks')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - start;

    if (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime,
        error: error.message,
      };
    }

    return {
      name: 'database',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      details: { latency: `${responseTime}ms` },
    };
  } catch (err) {
    return {
      name: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Check Supabase Auth service
 */
async function checkAuth(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    // Simple auth check by verifying the service is responsive
    const { data, error } = await supabase.auth.getSession();

    const responseTime = Date.now() - start;

    // No error means auth service is responsive
    return {
      name: 'auth',
      status: responseTime < 500 ? 'healthy' : 'degraded',
      responseTime,
      details: { latency: `${responseTime}ms` },
    };
  } catch (err) {
    return {
      name: 'auth',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Check external API connectivity (Stripe)
 */
async function checkStripe(): Promise<ServiceHealth> {
  const start = Date.now();
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (!stripeKey) {
    return {
      name: 'stripe',
      status: 'unhealthy',
      responseTime: 0,
      error: 'Stripe API key not configured',
    };
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    });

    const responseTime = Date.now() - start;

    return {
      name: 'stripe',
      status: response.ok ? (responseTime < 1000 ? 'healthy' : 'degraded') : 'unhealthy',
      responseTime,
      details: { httpStatus: response.status },
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (err) {
    return {
      name: 'stripe',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Check Twilio connectivity
 */
async function checkTwilio(): Promise<ServiceHealth> {
  const start = Date.now();
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");

  if (!accountSid || !authToken) {
    return {
      name: 'twilio',
      status: 'unhealthy',
      responseTime: 0,
      error: 'Twilio credentials not configured',
    };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        },
      }
    );

    const responseTime = Date.now() - start;

    return {
      name: 'twilio',
      status: response.ok ? (responseTime < 1000 ? 'healthy' : 'degraded') : 'unhealthy',
      responseTime,
      details: { httpStatus: response.status },
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (err) {
    return {
      name: 'twilio',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Check OpenAI API connectivity
 */
async function checkOpenAI(): Promise<ServiceHealth> {
  const start = Date.now();
  const apiKey = Deno.env.get("OPENAI_API_KEY");

  if (!apiKey) {
    return {
      name: 'openai',
      status: 'unhealthy',
      responseTime: 0,
      error: 'OpenAI API key not configured',
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const responseTime = Date.now() - start;

    return {
      name: 'openai',
      status: response.ok ? (responseTime < 2000 ? 'healthy' : 'degraded') : 'unhealthy',
      responseTime,
      details: { httpStatus: response.status },
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (err) {
    return {
      name: 'openai',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Check storage/cache health
 */
async function checkStorage(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const { data, error } = await supabase.storage.listBuckets();

    const responseTime = Date.now() - start;

    if (error) {
      return {
        name: 'storage',
        status: 'unhealthy',
        responseTime,
        error: error.message,
      };
    }

    return {
      name: 'storage',
      status: responseTime < 500 ? 'healthy' : 'degraded',
      responseTime,
      details: { bucketCount: data?.length || 0 },
    };
  } catch (err) {
    return {
      name: 'storage',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const detailed = url.searchParams.get('detailed') === 'true';

  try {
    // Run all health checks in parallel
    const checks = await Promise.all([
      checkDatabase(),
      checkAuth(),
      checkStripe(),
      checkTwilio(),
      checkOpenAI(),
      checkStorage(),
    ]);

    // Record health checks
    for (const check of checks) {
      await enterpriseMonitor.recordHealthCheck({
        service: check.name,
        status: check.status,
        response_time_ms: check.responseTime,
        details: check.details,
        error_message: check.error,
      });
    }

    // Determine overall status
    const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
    const hasDegraded = checks.some(c => c.status === 'degraded');
    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

    const response: HealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: Deno.env.get("VERSION") || '1.0.0',
      services: detailed ? checks : checks.map(c => ({
        name: c.name,
        status: c.status,
        responseTime: c.responseTime,
      })),
      uptime: Date.now() - startTime,
    };

    // Log if any service is unhealthy
    if (hasUnhealthy) {
      const unhealthyServices = checks.filter(c => c.status === 'unhealthy').map(c => c.name);
      await enterpriseMonitor.logEvent({
        event_type: 'error',
        severity: 'high',
        component: 'health-check',
        operation: 'system_health',
        message: `Unhealthy services detected: ${unhealthyServices.join(', ')}`,
        metadata: { unhealthy_services: unhealthyServices },
      });
    }

    return new Response(
      JSON.stringify(response),
      {
        status: overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Health check error:', error);

    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});
