/**
 * Health check endpoint for monitoring application status
 * Used by external monitors and internal health checks
 */

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  checks: {
    database: boolean;
    twilio: boolean;
    supabase: boolean;
  };
  uptime: number;
}

const START_TIME = Date.now();

export async function healthCheck(): Promise<HealthStatus> {
  const checks = {
    database: false,
    twilio: false,
    supabase: false,
  };

  // Check Supabase connectivity (basic client test)
  try {
    // Import dynamically to avoid bundling issues
    const { supabase } = await import('./integrations/supabase');
    if (supabase) {
      // Simple connectivity test - this will fail if Supabase is unreachable
      await supabase.from('_health_check').select('count').single();
      checks.supabase = true;
    }
  } catch (error) {
    console.warn('Supabase health check failed:', error);
  }

  // Check Twilio connectivity (basic API test)
  try {
    // This is a safe check that doesn't require actual credentials
    // In production, this would use a test API call
    checks.twilio = process.env.TWILIO_ACCOUNT_SID ? true : false;
  } catch (error) {
    console.warn('Twilio health check failed:', error);
  }

  // Database check (placeholder - implement based on your DB)
  try {
    checks.database = true; // Placeholder - implement actual DB check
  } catch (error) {
    console.warn('Database health check failed:', error);
  }

  const allChecksPass = Object.values(checks).every(Boolean);
  const status = allChecksPass ? 'ok' : 'degraded';

  return {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks,
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
  };
}

export async function handleHealthRequest(): Promise<Response> {
  try {
    const health = await healthCheck();

    const statusCode = health.status === 'ok' ? 200 :
                      health.status === 'degraded' ? 206 : 503;

    return new Response(JSON.stringify(health, null, 2), {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return new Response(JSON.stringify({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check service unavailable',
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
