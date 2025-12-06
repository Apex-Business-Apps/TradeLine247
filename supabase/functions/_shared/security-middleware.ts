/**
 * Security Middleware Module
 *
 * Provides security utilities including rate limiting, input validation,
 * and request authentication for TradeLine 24/7.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enterpriseMonitor } from "./enterprise-monitoring.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Security configuration
const RATE_LIMIT_WINDOW = 60; // seconds
const DEFAULT_RATE_LIMIT = 100; // requests per window
const STRICT_RATE_LIMIT = 10; // for sensitive endpoints

export interface SecurityContext {
  userId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  isAuthenticated: boolean;
  roles: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: Record<string, unknown>;
}

/**
 * Extract security context from request
 */
export function extractSecurityContext(req: Request): SecurityContext {
  const authHeader = req.headers.get('authorization');
  const ipAddress = req.headers.get('x-forwarded-for') ||
                    req.headers.get('x-real-ip') ||
                    'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  return {
    ipAddress,
    userAgent,
    requestId,
    isAuthenticated: !!authHeader,
    roles: [], // Populated after JWT verification
  };
}

/**
 * Verify JWT token and extract user info
 */
export async function verifyAuth(req: Request): Promise<{ userId: string; organizationId?: string } | null> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // Get organization membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    return {
      userId: user.id,
      organizationId: membership?.org_id,
    };
  } catch {
    return null;
  }
}

/**
 * Rate limiting middleware
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number = DEFAULT_RATE_LIMIT
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW * 1000);

  try {
    // Get current request count
    const { data, error } = await supabase
      .from('rate_limit_counters')
      .select('request_count')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .single();

    const currentCount = data?.request_count || 0;
    const allowed = currentCount < limit;
    const remaining = Math.max(0, limit - currentCount - 1);
    const resetAt = new Date(Date.now() + RATE_LIMIT_WINDOW * 1000);

    if (allowed) {
      // Increment counter
      await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_identifier_type: 'ip',
        p_endpoint: endpoint,
        p_window_seconds: RATE_LIMIT_WINDOW,
        p_max_requests: limit,
      });
    } else {
      // Log rate limit exceeded
      await enterpriseMonitor.logSecurityEvent('rate_limit_exceeded', {
        identifier,
        endpoint,
        current_count: currentCount,
        limit,
      });
    }

    return { allowed, remaining, resetAt };
  } catch (err) {
    console.error('Rate limit check error:', err);
    // Fail open on errors to not block legitimate traffic
    return { allowed: true, remaining: limit, resetAt: new Date(Date.now() + RATE_LIMIT_WINDOW * 1000) };
  }
}

/**
 * Input sanitization utilities
 */
export const sanitize = {
  /**
   * Sanitize string input
   */
  string(input: unknown, maxLength: number = 1000): string {
    if (typeof input !== 'string') return '';
    return input
      .trim()
      .substring(0, maxLength)
      .replace(/[<>]/g, ''); // Basic XSS prevention
  },

  /**
   * Sanitize email
   */
  email(input: unknown): string | null {
    if (typeof input !== 'string') return null;
    const email = input.trim().toLowerCase().substring(0, 254);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? email : null;
  },

  /**
   * Sanitize phone number
   */
  phone(input: unknown): string | null {
    if (typeof input !== 'string') return null;
    const phone = input.trim().replace(/[^\d+\-\s()]/g, '').substring(0, 20);
    const phoneRegex = /^\+?[\d\s\-()]{10,20}$/;
    return phoneRegex.test(phone) ? phone : null;
  },

  /**
   * Sanitize integer
   */
  integer(input: unknown, min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
    const num = parseInt(String(input), 10);
    if (isNaN(num)) return min;
    return Math.min(Math.max(num, min), max);
  },

  /**
   * Sanitize UUID
   */
  uuid(input: unknown): string | null {
    if (typeof input !== 'string') return null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(input) ? input.toLowerCase() : null;
  },

  /**
   * Sanitize date string
   */
  date(input: unknown): string | null {
    if (typeof input !== 'string') return null;
    const date = new Date(input);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  },

  /**
   * Sanitize time string (HH:MM:SS or HH:MM)
   */
  time(input: unknown): string | null {
    if (typeof input !== 'string') return null;
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    return timeRegex.test(input) ? input : null;
  },

  /**
   * Sanitize enum value
   */
  enum<T extends string>(input: unknown, allowedValues: T[]): T | null {
    if (typeof input !== 'string') return null;
    return allowedValues.includes(input as T) ? (input as T) : null;
  },
};

/**
 * Validate request body against schema
 */
export function validateRequest<T extends Record<string, unknown>>(
  body: unknown,
  schema: Record<string, {
    type: 'string' | 'email' | 'phone' | 'integer' | 'uuid' | 'date' | 'time' | 'enum' | 'boolean';
    required?: boolean;
    maxLength?: number;
    min?: number;
    max?: number;
    allowedValues?: string[];
  }>
): ValidationResult {
  const errors: string[] = [];
  const sanitizedData: Record<string, unknown> = {};

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Invalid request body'] };
  }

  const data = body as Record<string, unknown>;

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value === undefined || value === null) {
      sanitizedData[field] = null;
      continue;
    }

    // Sanitize based on type
    switch (rules.type) {
      case 'string':
        sanitizedData[field] = sanitize.string(value, rules.maxLength);
        break;
      case 'email': {
        const email = sanitize.email(value);
        if (rules.required && !email) {
          errors.push(`${field} must be a valid email`);
        }
        sanitizedData[field] = email;
        break;
      }
      case 'phone': {
        const phone = sanitize.phone(value);
        if (rules.required && !phone) {
          errors.push(`${field} must be a valid phone number`);
        }
        sanitizedData[field] = phone;
        break;
      }
      case 'integer':
        sanitizedData[field] = sanitize.integer(value, rules.min, rules.max);
        break;
      case 'uuid': {
        const uuid = sanitize.uuid(value);
        if (rules.required && !uuid) {
          errors.push(`${field} must be a valid UUID`);
        }
        sanitizedData[field] = uuid;
        break;
      }
      case 'date': {
        const date = sanitize.date(value);
        if (rules.required && !date) {
          errors.push(`${field} must be a valid date`);
        }
        sanitizedData[field] = date;
        break;
      }
      case 'time': {
        const time = sanitize.time(value);
        if (rules.required && !time) {
          errors.push(`${field} must be a valid time (HH:MM)`);
        }
        sanitizedData[field] = time;
        break;
      }
      case 'enum': {
        const enumValue = sanitize.enum(value, rules.allowedValues || []);
        if (rules.required && !enumValue) {
          errors.push(`${field} must be one of: ${rules.allowedValues?.join(', ')}`);
        }
        sanitizedData[field] = enumValue;
        break;
      }
      case 'boolean':
        sanitizedData[field] = Boolean(value);
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData as T : undefined,
  };
}

/**
 * CORS headers helper
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-request-id',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Create standard error response
 */
export function errorResponse(
  message: string,
  status: number = 400,
  requestId?: string
): Response {
  return new Response(
    JSON.stringify({
      error: true,
      message,
      request_id: requestId || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

/**
 * Create standard success response
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  requestId?: string
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      request_id: requestId || crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

/**
 * Request handler wrapper with security middleware
 */
export function withSecurity(
  handler: (req: Request, ctx: SecurityContext) => Promise<Response>,
  options: {
    requireAuth?: boolean;
    rateLimit?: number;
    endpoint: string;
  }
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const ctx = extractSecurityContext(req);

    try {
      // Check rate limit
      const rateLimitResult = await checkRateLimit(
        ctx.ipAddress,
        options.endpoint,
        options.rateLimit || DEFAULT_RATE_LIMIT
      );

      if (!rateLimitResult.allowed) {
        return errorResponse('Rate limit exceeded', 429, ctx.requestId);
      }

      // Verify authentication if required
      if (options.requireAuth) {
        const auth = await verifyAuth(req);
        if (!auth) {
          await enterpriseMonitor.logSecurityEvent('auth_failure', {
            endpoint: options.endpoint,
            ip: ctx.ipAddress,
          });
          return errorResponse('Authentication required', 401, ctx.requestId);
        }
        ctx.userId = auth.userId;
        ctx.organizationId = auth.organizationId;
        ctx.isAuthenticated = true;
      }

      // Execute handler
      return await handler(req, ctx);

    } catch (error) {
      console.error('Request handler error:', error);

      await enterpriseMonitor.logEvent({
        event_type: 'error',
        severity: 'high',
        component: 'security-middleware',
        operation: options.endpoint,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack_trace: error instanceof Error ? error.stack : undefined,
        request_id: ctx.requestId,
        ip_address: ctx.ipAddress,
      });

      return errorResponse(
        'An unexpected error occurred',
        500,
        ctx.requestId
      );
    }
  };
}
