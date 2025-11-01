// Distributed Rate Limiter using Supabase
// Replaces in-memory solution for horizontal scaling

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface RateLimitConfig {
  windowSeconds?: number;
  maxRequests?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  current_count: number;
  limit: number;
  remaining?: number;
  retry_after?: string;
}

/**
 * Check rate limit using distributed Supabase function
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  identifier: string,
  identifierType: 'phone' | 'ip',
  endpoint: string,
  config: RateLimitConfig = {}
): Promise<RateLimitResult> {
  const windowSeconds = config.windowSeconds || 60;
  const maxRequests = config.maxRequests || 10;

  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_identifier_type: identifierType,
      p_endpoint: endpoint,
      p_window_seconds: windowSeconds,
      p_max_requests: maxRequests
    });

    if (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limiter is down
      return {
        allowed: true,
        current_count: 0,
        limit: maxRequests,
        remaining: maxRequests
      };
    }

    return data as RateLimitResult;
  } catch (err) {
    console.error('Rate limit exception:', err);
    // Fail open
    return {
      allowed: true,
      current_count: 0,
      limit: maxRequests,
      remaining: maxRequests
    };
  }
}

/**
 * Middleware-style rate limit checker for Edge Functions
 */
export async function rateLimitMiddleware(
  req: Request,
  supabase: SupabaseClient,
  endpoint: string,
  config: RateLimitConfig = {}
): Promise<RateLimitResult | null> {
  // Get identifier (IP address)
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                   req.headers.get('cf-connecting-ip') ||
                   'unknown';

  // Check rate limit
  const result = await checkRateLimit(
    supabase,
    clientIp,
    'ip',
    endpoint,
    config
  );

  return result;
}

/**
 * Generate rate limit TwiML response
 */
export function rateLimitTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">We're experiencing high call volume. Please try again in a moment.</Say>
  <Hangup/>
</Response>`;
}

/**
 * Generate rate limit JSON response
 */
export function rateLimitJSON(retryAfter?: string) {
  return {
    error: 'Too many requests. Please try again later.',
    retry_after: retryAfter,
    status: 429
  };
}
