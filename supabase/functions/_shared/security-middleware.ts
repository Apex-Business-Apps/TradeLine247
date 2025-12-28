// DENO-ONLY, not executed in Node/Vitest CI due to https imports.

/**
 * Enterprise Security Middleware
 *
 * Comprehensive security layer with rate limiting, abuse prevention,
 * fraud detection, and compliance features.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enterpriseMonitor } from "./enterprise-monitoring.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

export interface SecurityContext {
  userId?: string;
  organizationId?: string;
  ipAddress: string;
  userAgent: string;
  geoData?: GeoData;
  riskScore: number;
  securityFlags: string[];
}

export interface GeoData {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
  blockDurationMinutes: number;
}

export class EnterpriseSecurity {
  private defaultRateLimit: RateLimitConfig = {
    windowSeconds: 300, // 5 minutes
    maxRequests: 100,
    blockDurationMinutes: 60
  };

  private strictRateLimit: RateLimitConfig = {
    windowSeconds: 60, // 1 minute
    maxRequests: 10,
    blockDurationMinutes: 120
  };

  /**
   * Comprehensive security check with multiple layers
   */
  async performSecurityCheck(
    req: Request,
    options: {
      requireAuth?: boolean;
      rateLimit?: RateLimitConfig;
      enableGeoCheck?: boolean;
      enableFraudDetection?: boolean;
      sensitiveOperation?: boolean;
    } = {}
  ): Promise<SecurityContext> {
    const startTime = Date.now();
    const clientIP = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      // Initialize security context
      const context: SecurityContext = {
        ipAddress: clientIP,
        userAgent,
        riskScore: 0,
        securityFlags: []
      };

      // 1. IP Reputation Check
      const ipReputation = await this.checkIPReputation(clientIP);
      if (ipReputation < 30) {
        context.securityFlags.push('low_ip_reputation');
        context.riskScore += 40;
      }

      // 2. Rate Limiting Check
      const rateLimitConfig = options.rateLimit || this.defaultRateLimit;
      const rateLimitResult = await this.checkRateLimit(
        clientIP,
        req.url,
        rateLimitConfig
      );

      if (!rateLimitResult.allowed) {
        context.securityFlags.push('rate_limited');
        context.riskScore += 60;

        await enterpriseMonitor.logSecurityEvent(
          'rate_limit_exceeded',
          {
            ip: clientIP,
            endpoint: req.url,
            limit: rateLimitConfig.maxRequests,
            window: rateLimitConfig.windowSeconds
          },
          undefined,
          'high'
        );

        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // 3. Authentication Check (if required)
      if (options.requireAuth) {
        const authResult = await this.validateAuthentication(req);
        if (!authResult.valid) {
          context.securityFlags.push('auth_failed');
          context.riskScore += 80;

          await enterpriseMonitor.logSecurityEvent(
            'auth_failure',
            {
              reason: authResult.reason,
              ip: clientIP,
              userAgent
            },
            undefined,
            'high'
          );

          throw new Error('Authentication required');
        }

        context.userId = authResult.userId;
        context.organizationId = authResult.organizationId;
      }

      // 4. Geo-based Security (if enabled)
      if (options.enableGeoCheck) {
        const geoData = await this.getGeoData(clientIP);
        context.geoData = geoData;

        // Check for suspicious locations
        if (this.isSuspiciousLocation(geoData)) {
          context.securityFlags.push('suspicious_location');
          context.riskScore += 30;
        }
      }

      // 5. Fraud Detection (if enabled)
      if (options.enableFraudDetection) {
        const fraudIndicators = await this.detectFraud(req, context);
        context.securityFlags.push(...fraudIndicators.indicators);
        context.riskScore += fraudIndicators.riskIncrease;
      }

      // 6. Additional checks for sensitive operations
      if (options.sensitiveOperation) {
        const additionalChecks = await this.performSensitiveOperationChecks(req, context);
        context.securityFlags.push(...additionalChecks.flags);
        context.riskScore += additionalChecks.riskIncrease;
      }

      // 7. Risk Assessment
      if (context.riskScore >= 70) {
        await enterpriseMonitor.logSecurityEvent(
          'suspicious_activity',
          {
            risk_score: context.riskScore,
            flags: context.securityFlags,
            ip: clientIP,
            operation: 'high_risk_request'
          },
          context.userId,
          'critical'
        );

        // Could implement additional security measures like 2FA requirement
      }

      // Log successful security check
      await enterpriseMonitor.logEvent({
        event_type: 'info',
        severity: 'low',
        component: 'security-middleware',
        operation: 'security_check_passed',
        message: 'Security check completed successfully',
        metadata: {
          risk_score: context.riskScore,
          flags: context.securityFlags,
          duration_ms: Date.now() - startTime
        }
      });

      return context;

    } catch (error) {
      // Enhanced error logging
      await enterpriseMonitor.logEvent({
        event_type: 'error',
        severity: 'high',
        component: 'security-middleware',
        operation: 'security_check_failed',
        message: error instanceof Error ? error.message : 'Security check failed',
        metadata: {
          ip: clientIP,
          userAgent,
          duration_ms: Date.now() - startTime
        }
      });

      throw error;
    }
  }

  /**
   * Get client IP address with fallback handling
   */
  private getClientIP(req: Request): string {
    // Try multiple headers for IP detection
    const ipHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip',
      'fastly-client-ip'
    ];

    for (const header of ipHeaders) {
      const ip = req.headers.get(header);
      if (ip && this.isValidIP(ip.split(',')[0].trim())) {
        return ip.split(',')[0].trim();
      }
    }

    // Fallback to connection info (Deno specific)
    try {
      const connInfo = (req as any).connInfo;
      if (connInfo?.remoteAddr?.hostname) {
        return connInfo.remoteAddr.hostname;
      }
    } catch (error) {
      // Ignore connection info errors
    }

    return 'unknown';
  }

  /**
   * Validate IP address format
   */
  private isValidIP(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    if (ipv4Regex.test(ip)) {
      return ip.split('.').every(part => {
        const num = parseInt(part);
        return num >= 0 && num <= 255;
      });
    }

    return ipv6Regex.test(ip);
  }

  /**
   * Check IP reputation from database
   */
  private async checkIPReputation(ip: string): Promise<number> {
    try {
      const { data } = await supabase
        .rpc('check_ip_reputation', { p_ip_address: ip });

      return data || 50; // Default neutral score
    } catch (error) {
      console.error('IP reputation check failed:', error);
      return 50; // Default to neutral on error
    }
  }

  /**
   * Rate limiting with database-backed tracking
   */
  private async checkRateLimit(
    identifier: string,
    endpoint: string,
    config: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const allowed = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_identifier_type: 'ip',
        p_endpoint: endpoint,
        p_window_seconds: config.windowSeconds,
        p_max_requests: config.maxRequests
      });

      // Get current count for response headers
      const { data: counter } = await supabase
        .from('rate_limit_counters')
        .select('request_count, blocked_until')
        .eq('identifier', identifier)
        .eq('identifier_type', 'ip')
        .eq('endpoint', endpoint)
        .gte('window_start', new Date(Date.now() - config.windowSeconds * 1000))
        .single();

      const remaining = Math.max(0, config.maxRequests - (counter?.request_count || 0));
      const resetTime = Date.now() + config.windowSeconds * 1000;

      return {
        allowed: allowed && !counter?.blocked_until,
        remaining,
        resetTime
      };

    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Allow request on rate limit system failure to avoid blocking legitimate users
      return { allowed: true, remaining: config.maxRequests, resetTime: Date.now() + config.windowSeconds * 1000 };
    }
  }

  /**
   * Authentication validation
   */
  private async validateAuthentication(req: Request): Promise<{
    valid: boolean;
    userId?: string;
    organizationId?: string;
    reason?: string;
  }> {
    try {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, reason: 'missing_token' };
      }

      const token = authHeader.substring(7);

      // Validate with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return { valid: false, reason: 'invalid_token' };
      }

      // Get organization membership
      const { data: memberData } = await supabase
        .from('organization_members')
        .select('org_id, role')
        .eq('user_id', user.id)
        .single();

      if (!memberData) {
        return { valid: false, reason: 'no_organization' };
      }

      return {
        valid: true,
        userId: user.id,
        organizationId: memberData.org_id
      };

    } catch (error) {
      console.error('Authentication validation failed:', error);
      return { valid: false, reason: 'auth_system_error' };
    }
  }

  /**
   * Geo-based security checks
   */
  private async getGeoData(ip: string): Promise<GeoData | undefined> {
    // This would integrate with a GeoIP service like MaxMind
    // Placeholder implementation
    // TODO: Replace with actual GeoIP service integration that may throw errors
    return {
      country: 'US',
      region: 'CA',
      city: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194,
      timezone: 'America/Los_Ang_Angeles'
    };
  }

  /**
   * Check for suspicious geographic locations
   */
  private isSuspiciousLocation(geoData: GeoData | undefined): boolean {
    if (!geoData) return false;

    // Check for known high-risk countries or unusual patterns
    const highRiskCountries = ['KP', 'IR', 'CU', 'SY', 'VE']; // Example list
    const suspiciousPatterns = [
      // Add location-based risk patterns
    ];

    return highRiskCountries.includes(geoData.country.toUpperCase());
  }

  /**
   * Fraud detection engine
   */
  private async detectFraud(req: Request, context: SecurityContext): Promise<{
    indicators: string[];
    riskIncrease: number;
  }> {
    const indicators: string[] = [];
    let riskIncrease = 0;

    // Check user agent for suspicious patterns
    if (context.userAgent.includes('bot') || context.userAgent.includes('crawler')) {
      indicators.push('suspicious_user_agent');
      riskIncrease += 20;
    }

    // Check for rapid successive requests (already handled by rate limiting)
    // Additional fraud patterns can be added here

    // Check for unusual request patterns
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
    const forwardedCount = suspiciousHeaders.filter(header =>
      req.headers.has(header)
    ).length;

    if (forwardedCount > 1) {
      indicators.push('multiple_proxy_headers');
      riskIncrease += 15;
    }

    // Check request body for suspicious patterns (if applicable)
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        const contentType = req.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const body = await req.clone().json();

          // Check for SQL injection patterns
          const sqlPatterns = /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i;
          const bodyString = JSON.stringify(body);

          if (sqlPatterns.test(bodyString)) {
            indicators.push('sql_injection_attempt');
            riskIncrease += 50;

            await enterpriseMonitor.logSecurityEvent(
              'suspicious_activity',
              { pattern: 'sql_injection', body_preview: bodyString.substring(0, 200) },
              context.userId,
              'critical'
            );
          }
        }
      } catch (error) {
        // Ignore body parsing errors
      }
    }

    return { indicators, riskIncrease };
  }

  /**
   * Additional checks for sensitive operations
   */
  private async performSensitiveOperationChecks(
    req: Request,
    context: SecurityContext
  ): Promise<{ flags: string[]; riskIncrease: number }> {
    const flags: string[] = [];
    let riskIncrease = 0;

    // Check if user has recent security violations
    if (context.userId) {
      const recentViolations = await supabase
        .from('security_audit_log')
        .select('count')
        .eq('user_id', context.userId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .eq('severity', 'high');

      if (recentViolations.count && recentViolations.count > 0) {
        flags.push('recent_security_violations');
        riskIncrease += 25;
      }
    }

    // Check for unusual time patterns
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      flags.push('unusual_time_access');
      riskIncrease += 10;
    }

    return { flags, riskIncrease };
  }

  /**
   * Create security headers for responses
   */
  getSecurityHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      ...additionalHeaders
    };
  }

  /**
   * Sanitize input data
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Basic XSS prevention
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = Array.isArray(input) ? [] : {};

      for (const [key, value] of Object.entries(input)) {
        // Skip sensitive fields
        if (['password', 'token', 'secret', 'key'].some(field => key.toLowerCase().includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeInput(value);
        }
      }

      return sanitized;
    }

    return input;
  }
}

// Singleton instance
export const enterpriseSecurity = new EnterpriseSecurity();

// CORS headers export
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extended security context with requestId
export interface ExtendedSecurityContext extends SecurityContext {
  requestId: string;
}

// Success response helper
export function successResponse(
  data: unknown,
  status = 200,
  requestId?: string
): Response {
  return new Response(
    JSON.stringify({ success: true, data, request_id: requestId }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...(requestId ? { 'X-Request-ID': requestId } : {}),
      },
    }
  );
}

// Error response helper
export function errorResponse(
  message: string,
  status = 500,
  requestId?: string
): Response {
  return new Response(
    JSON.stringify({ success: false, error: message, request_id: requestId }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...(requestId ? { 'X-Request-ID': requestId } : {}),
      },
    }
  );
}

// Validation schema type
interface ValidationRule {
  type: 'string' | 'uuid' | 'email' | 'number' | 'boolean' | 'enum';
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  allowedValues?: string[];
}

// Validate request helper
export function validateRequest<T>(
  body: unknown,
  schema: Record<string, ValidationRule>
): { isValid: boolean; errors: string[]; sanitizedData: Partial<T> } {
  const errors: string[] = [];
  const sanitizedData: Record<string, unknown> = {};

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Invalid request body'], sanitizedData: {} };
  }

  const data = body as Record<string, unknown>;

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];

    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }

    if (value === undefined || value === null) continue;

    if (rule.type === 'string' && typeof value !== 'string') {
      errors.push(`${field} must be a string`);
    } else if (rule.type === 'string') {
      let strVal = String(value).trim();
      if (rule.maxLength && strVal.length > rule.maxLength) {
        strVal = strVal.substring(0, rule.maxLength);
      }
      if (rule.minLength && strVal.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters`);
      }
      sanitizedData[field] = strVal;
    }

    if (rule.type === 'uuid') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(String(value))) {
        errors.push(`${field} must be a valid UUID`);
      } else {
        sanitizedData[field] = value;
      }
    }

    if (rule.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push(`${field} must be a number`);
      } else {
        sanitizedData[field] = num;
      }
    }

    if (rule.type === 'boolean') {
      sanitizedData[field] = Boolean(value);
    }

    if (rule.type === 'enum' && rule.allowedValues) {
      if (!rule.allowedValues.includes(String(value))) {
        errors.push(`${field} must be one of: ${rule.allowedValues.join(', ')}`);
      } else {
        sanitizedData[field] = value;
      }
    }
  }

  return { isValid: errors.length === 0, errors, sanitizedData: sanitizedData as Partial<T> };
}

// Security middleware wrapper (legacy name)
export function withSecurityCheck<T extends any[], R>(
  operation: string,
  securityOptions: Parameters<EnterpriseSecurity['performSecurityCheck']>[1],
  fn: (securityContext: SecurityContext, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const req = args[0] as Request;
    const securityContext = await enterpriseSecurity.performSecurityCheck(req, securityOptions);
    const result = await fn(securityContext, ...args);

    if (result && typeof result === 'object' && 'headers' in result) {
      const securityHeaders = enterpriseSecurity.getSecurityHeaders();
      for (const [key, value] of Object.entries(securityHeaders)) {
        (result.headers as Headers).set(key, value);
      }
    }

    return result;
  };
}

// Modern withSecurity wrapper
export function withSecurity<T>(
  handler: (req: Request, ctx: ExtendedSecurityContext) => Promise<Response>,
  options: {
    endpoint?: string;
    requireAuth?: boolean;
    rateLimit?: number | RateLimitConfig;
  } = {}
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const requestId = crypto.randomUUID();

    try {
      const rateLimitConfig: RateLimitConfig | undefined = 
        typeof options.rateLimit === 'number'
          ? { windowSeconds: 60, maxRequests: options.rateLimit, blockDurationMinutes: 5 }
          : options.rateLimit;

      const securityContext = await enterpriseSecurity.performSecurityCheck(req, {
        requireAuth: options.requireAuth,
        rateLimit: rateLimitConfig,
      });

      const extendedContext: ExtendedSecurityContext = {
        ...securityContext,
        requestId,
      };

      return await handler(req, extendedContext);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Security check failed';
      console.error(`Security error (${requestId}):`, message);
      return errorResponse(message, 403, requestId);
    }
  };
}

export default enterpriseSecurity;
