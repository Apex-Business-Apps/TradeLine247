/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Health Check Endpoint
 * GET /healthz
 * 
 * Returns database connection health and cold start detection
 * Used by pre-warming cron job
 */

import { corsHeaders } from "../_shared/cors.ts";
import { healthCheckQuery } from "../_shared/dbPool.ts";

// Track cold starts
let isColdStart = true;
const startupTime = Date.now();

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStart = Date.now();
  
  try {
    // Run health check query
    const dbHealth = await healthCheckQuery();
    
    const response = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime_ms: Date.now() - startupTime,
      request_ms: Date.now() - requestStart,
      cold_start: isColdStart,
      database: {
        healthy: dbHealth.healthy,
        latency_ms: dbHealth.db_ms,
        error: dbHealth.error
      },
      env: Deno.env.get("DENO_DEPLOYMENT_ID") ? "production" : "development"
    };

    // Mark as warm after first request
    if (isColdStart) {
      console.log("Cold start detected, function now warm");
      isColdStart = false;
    }

    return new Response(JSON.stringify(response), {
      status: dbHealth.healthy ? 200 : 503,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Health check failed:", errorMsg);
    
    return new Response(JSON.stringify({
      status: "error",
      timestamp: new Date().toISOString(),
      error: errorMsg,
      cold_start: isColdStart
    }), {
      status: 503,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});

