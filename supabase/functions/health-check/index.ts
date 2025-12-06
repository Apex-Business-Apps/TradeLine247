/**
 * Enterprise Health Check Endpoint
 *
 * Comprehensive system health monitoring with detailed diagnostics
 * for production-grade reliability and observability.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enterpriseMonitor } from "../_shared/enterprise-monitoring.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    external_apis: ServiceHealth;
    storage: ServiceHealth;
    functions: ServiceHealth;
  };
  metrics: {
    active_connections: number;
    total_requests_today: number;
    error_rate_24h: number;
    avg_response_time: number;
  };
  alerts: AlertSummary[];
  maintenance?: MaintenanceInfo;
}

interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms: number;
  last_check: string;
  message?: string;
}

interface AlertSummary {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  component: string;
  created_at: string;
}

interface MaintenanceInfo {
  scheduled: boolean;
  start_time?: string;
  end_time?: string;
  message: string;
}

// Service health check functions
async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    const { error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
      .single();

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'unhealthy',
        response_time_ms: responseTime,
        last_check: new Date().toISOString(),
        message: `Database query failed: ${error.message}`
      };
    }

    return {
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      response_time_ms: responseTime,
      last_check: new Date().toISOString()
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

async function checkCacheHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    // Check Redis/memory cache status (placeholder - implement actual cache check)
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      response_time_ms: responseTime,
      last_check: new Date().toISOString()
    };

  } catch (error) {
    return {
      status: 'degraded',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      message: 'Cache service check failed'
    };
  }
}

async function checkExternalAPIsHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  const apis = [
    { name: 'stripe', url: 'https://api.stripe.com/v1/charges' },
    { name: 'twilio', url: 'https://api.twilio.com/2010-04-01/Accounts.json' }
  ];

  let healthyCount = 0;
  let totalResponseTime = 0;

  for (const api of apis) {
    try {
      const apiStart = Date.now();
      const response = await fetch(api.url, {
        method: 'HEAD',
        headers: api.name === 'stripe' ? {
          'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')?.substring(0, 10)}...`
        } : undefined
      });

      totalResponseTime += Date.now() - apiStart;

      if (response.ok) {
        healthyCount++;
      }
    } catch (error) {
      // Continue checking other APIs
    }
  }

  const avgResponseTime = totalResponseTime / apis.length;
  const healthPercentage = (healthyCount / apis.length) * 100;

  return {
    status: healthPercentage >= 80 ? 'healthy' : healthPercentage >= 50 ? 'degraded' : 'unhealthy',
    response_time_ms: Math.round(avgResponseTime),
    last_check: new Date().toISOString(),
    message: `${healthyCount}/${apis.length} APIs healthy`
  };
}

async function checkStorageHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    // Check Supabase Storage health
    const { error } = await supabase.storage
      .from('temp')
      .list('', { limit: 1 });

    const responseTime = Date.now() - startTime;

    return {
      status: error ? 'degraded' : 'healthy',
      response_time_ms: responseTime,
      last_check: new Date().toISOString(),
      message: error ? `Storage check failed: ${error.message}` : undefined
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Storage health check failed'
    };
  }
}

async function checkFunctionsHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();

  try {
    // Test a simple function call
    const { error } = await supabase.functions.invoke('healthz', {
      body: { check: 'basic' }
    });

    const responseTime = Date.now() - startTime;

    return {
      status: error ? 'degraded' : 'healthy',
      response_time_ms: responseTime,
      last_check: new Date().toISOString(),
      message: error ? `Function test failed: ${error.message}` : undefined
    };

  } catch (error) {
    return {
      status: 'unhealthy',
      response_time_ms: Date.now() - startTime,
      last_check: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Functions health check failed'
    };
  }
}

async function getMetrics(): Promise<HealthStatus['metrics']> {
  try {
    // Get active connections (simplified)
    const activeConnections = 0; // Would need actual connection tracking

    // Get today's request count
    const today = new Date().toISOString().split('T')[0];
    const { count: totalRequests } = await supabase
      .from('system_monitoring_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00.000Z`);

    // Get error rate in last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: totalEvents } = await supabase
      .from('system_monitoring_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday);

    const { count: errorEvents } = await supabase
      .from('system_monitoring_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'error')
      .gte('created_at', yesterday);

    const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;

    // Get average response time from performance metrics
    const { data: performanceData } = await supabase
      .from('performance_metrics')
      .select('duration_ms')
      .gte('collected_at', yesterday);

    const avgResponseTime = performanceData && performanceData.length > 0
      ? performanceData.reduce((sum, item) => sum + item.duration_ms, 0) / performanceData.length
      : 0;

    return {
      active_connections: activeConnections,
      total_requests_today: totalRequests || 0,
      error_rate_24h: Math.round(errorRate * 100) / 100,
      avg_response_time: Math.round(avgResponseTime)
    };

  } catch (error) {
    console.error('Metrics collection failed:', error);
    return {
      active_connections: 0,
      total_requests_today: 0,
      error_rate_24h: 0,
      avg_response_time: 0
    };
  }
}

async function getActiveAlerts(): Promise<AlertSummary[]> {
  try {
    const { data: alerts } = await supabase
      .from('system_alerts')
      .select('id, severity, title, component, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10);

    return alerts?.map(alert => ({
      id: alert.id,
      severity: alert.severity,
      message: alert.title,
      component: alert.component,
      created_at: alert.created_at
    })) || [];

  } catch (error) {
    console.error('Alert fetch failed:', error);
    return [];
  }
}

async function checkMaintenanceMode(): Promise<MaintenanceInfo | undefined> {
  try {
    // Check for scheduled maintenance (placeholder - implement actual maintenance tracking)
    const maintenanceMode = Deno.env.get("MAINTENANCE_MODE");

    if (maintenanceMode === "true") {
      return {
        scheduled: true,
        message: "System is currently under maintenance"
      };
    }

    return undefined;

  } catch (error) {
    return undefined;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  const startTime = Date.now();

  try {
    // Validate request method
    if (req.method !== "GET") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Perform comprehensive health checks
    const [
      databaseHealth,
      cacheHealth,
      externalAPIsHealth,
      storageHealth,
      functionsHealth,
      metrics,
      alerts,
      maintenance
    ] = await Promise.all([
      checkDatabaseHealth(),
      checkCacheHealth(),
      checkExternalAPIsHealth(),
      checkStorageHealth(),
      checkFunctionsHealth(),
      getMetrics(),
      getActiveAlerts(),
      checkMaintenanceMode()
    ]);

    // Determine overall system status
    const services = {
      database: databaseHealth,
      cache: cacheHealth,
      external_apis: externalAPIsHealth,
      storage: storageHealth,
      functions: functionsHealth
    };

    const serviceStatuses = Object.values(services).map(s => s.status);
    const hasUnhealthy = serviceStatuses.includes('unhealthy');
    const hasDegraded = serviceStatuses.includes('degraded');

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: Deno.env.get("APP_VERSION") || "1.0.0",
      uptime: Date.now() - (globalThis as any).startTime || 0,
      services,
      metrics,
      alerts,
      maintenance
    };

    // Log health check
    await enterpriseMonitor.logEvent({
      event_type: 'info',
      severity: 'low',
      component: 'health-check',
      operation: 'system_health_check',
      message: `Health check completed: ${overallStatus}`,
      metadata: {
        overall_status: overallStatus,
        service_statuses: services,
        active_alerts: alerts.length
      },
      duration_ms: Date.now() - startTime
    });

    // Return appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'degraded' ? 200 : 503;

    return new Response(
      JSON.stringify(healthStatus, null, 2),
      {
        status: httpStatus,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Health-Status": overallStatus,
          "X-Response-Time": `${Date.now() - startTime}ms`
        },
      }
    );

  } catch (error) {
    console.error("Health check error:", error);

    // Log critical health check failure
    await enterpriseMonitor.logEvent({
      event_type: 'error',
      severity: 'critical',
      component: 'health-check',
      operation: 'system_health_check_failed',
      message: error instanceof Error ? error.message : 'Health check system failure',
      stack_trace: error instanceof Error ? error.stack : undefined
    });

    const errorResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      message: error instanceof Error ? error.message : 'Unknown error'
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "X-Health-Status": "unhealthy"
        },
      }
    );
  }
});