/**
 * Enterprise Monitoring Module
 *
 * Provides comprehensive monitoring, logging, and observability
 * for TradeLine 24/7 enterprise features.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Event types for monitoring
export type EventType = 'error' | 'warning' | 'info' | 'security' | 'performance';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type SecurityEventType =
  | 'auth_attempt' | 'auth_success' | 'auth_failure' | 'auth_logout'
  | 'data_access' | 'data_modification' | 'data_deletion'
  | 'permission_change' | 'role_change' | 'suspicious_activity'
  | 'rate_limit_exceeded' | 'brute_force_attempt' | 'sql_injection_attempt'
  | 'xss_attempt' | 'csrf_attempt' | 'unauthorized_access';

export interface MonitoringEvent {
  event_type: EventType;
  severity: Severity;
  component: string;
  operation: string;
  message: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
  session_id?: string;
  request_id?: string;
  duration_ms?: number;
  error_code?: string;
  stack_trace?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface PerformanceMetric {
  operation: string;
  duration_ms: number;
  metadata?: Record<string, unknown>;
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms: number;
  details?: Record<string, unknown>;
  error_message?: string;
}

// Circuit breaker state management
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const circuitBreakers: Map<string, CircuitBreakerState> = new Map();

const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

/**
 * Enterprise Monitor class for comprehensive monitoring
 */
class EnterpriseMonitor {
  private static instance: EnterpriseMonitor;

  private constructor() {}

  static getInstance(): EnterpriseMonitor {
    if (!EnterpriseMonitor.instance) {
      EnterpriseMonitor.instance = new EnterpriseMonitor();
    }
    return EnterpriseMonitor.instance;
  }

  /**
   * Log a monitoring event to the database
   */
  async logEvent(event: MonitoringEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_monitoring_events')
        .insert({
          event_type: event.event_type,
          severity: event.severity,
          component: event.component,
          operation: event.operation,
          message: event.message,
          metadata: event.metadata || {},
          user_id: event.user_id,
          session_id: event.session_id,
          request_id: event.request_id,
          duration_ms: event.duration_ms,
          error_code: event.error_code,
          stack_trace: event.stack_trace,
          ip_address: event.ip_address,
          user_agent: event.user_agent,
        });

      if (error) {
        console.error('Failed to log monitoring event:', error);
      }

      // Create alert for high/critical severity events
      if (event.severity === 'high' || event.severity === 'critical') {
        await this.createAlert(event);
      }
    } catch (err) {
      console.error('Monitoring error:', err);
    }
  }

  /**
   * Log a security-specific event
   */
  async logSecurityEvent(
    eventType: SecurityEventType,
    details: Record<string, unknown>,
    userId?: string,
    severity: Severity = 'medium'
  ): Promise<void> {
    try {
      const riskScore = this.calculateRiskScore(eventType, details);

      const { error } = await supabase
        .from('security_audit_log')
        .insert({
          event_type: eventType,
          severity,
          user_id: userId,
          request_data: details,
          risk_score: riskScore,
        });

      if (error) {
        console.error('Failed to log security event:', error);
      }

      // Trigger alert for high-risk events
      if (riskScore >= 70) {
        await this.createAlert({
          event_type: 'security',
          severity: riskScore >= 90 ? 'critical' : 'high',
          component: 'security-monitor',
          operation: eventType,
          message: `High-risk security event detected: ${eventType}`,
          metadata: details,
        });
      }
    } catch (err) {
      console.error('Security logging error:', err);
    }
  }

  /**
   * Record a performance metric
   */
  async recordMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert({
          operation: metric.operation,
          duration_ms: metric.duration_ms,
          metadata: metric.metadata || {},
        });

      if (error) {
        console.error('Failed to record metric:', error);
      }

      // Log warning for slow operations
      if (metric.duration_ms > 5000) {
        await this.logEvent({
          event_type: 'performance',
          severity: metric.duration_ms > 10000 ? 'high' : 'medium',
          component: 'performance-monitor',
          operation: metric.operation,
          message: `Slow operation detected: ${metric.operation} took ${metric.duration_ms}ms`,
          duration_ms: metric.duration_ms,
          metadata: metric.metadata,
        });
      }
    } catch (err) {
      console.error('Metric recording error:', err);
    }
  }

  /**
   * Record a health check result
   */
  async recordHealthCheck(result: HealthCheckResult): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_health_checks')
        .insert({
          service: result.service,
          status: result.status,
          response_time_ms: result.response_time_ms,
          details: result.details || {},
          error_message: result.error_message,
        });

      if (error) {
        console.error('Failed to record health check:', error);
      }

      // Create alert for unhealthy services
      if (result.status === 'unhealthy') {
        await this.createAlert({
          event_type: 'error',
          severity: 'critical',
          component: result.service,
          operation: 'health_check',
          message: `Service unhealthy: ${result.service}`,
          metadata: { ...result.details, error: result.error_message },
        });
      }
    } catch (err) {
      console.error('Health check recording error:', err);
    }
  }

  /**
   * Create a system alert
   */
  private async createAlert(event: MonitoringEvent): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .insert({
          alert_type: event.event_type,
          severity: event.severity,
          title: `${event.component}: ${event.operation}`,
          description: event.message,
          component: event.component,
          operation: event.operation,
          error_code: event.error_code,
          stack_trace: event.stack_trace,
          status: 'active',
        });

      if (error) {
        console.error('Failed to create alert:', error);
      }
    } catch (err) {
      console.error('Alert creation error:', err);
    }
  }

  /**
   * Calculate risk score for security events
   */
  private calculateRiskScore(eventType: SecurityEventType, details: Record<string, unknown>): number {
    let score = 0;

    // Base scores by event type
    const baseScores: Record<SecurityEventType, number> = {
      'auth_attempt': 10,
      'auth_success': 0,
      'auth_failure': 20,
      'auth_logout': 0,
      'data_access': 10,
      'data_modification': 30,
      'data_deletion': 50,
      'permission_change': 40,
      'role_change': 50,
      'suspicious_activity': 60,
      'rate_limit_exceeded': 30,
      'brute_force_attempt': 80,
      'sql_injection_attempt': 90,
      'xss_attempt': 85,
      'csrf_attempt': 85,
      'unauthorized_access': 70,
    };

    score = baseScores[eventType] || 50;

    // Adjust based on details
    if (details.repeated_attempts && (details.repeated_attempts as number) > 3) {
      score += 20;
    }
    if (details.from_known_bad_ip) {
      score += 30;
    }
    if (details.outside_business_hours) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Check circuit breaker state
   */
  checkCircuitBreaker(serviceName: string): boolean {
    const state = circuitBreakers.get(serviceName);

    if (!state) {
      return true; // No state = closed circuit
    }

    if (state.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - state.lastFailure > CIRCUIT_BREAKER_TIMEOUT) {
        state.state = 'half-open';
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Record circuit breaker failure
   */
  recordCircuitFailure(serviceName: string): void {
    let state = circuitBreakers.get(serviceName);

    if (!state) {
      state = { failures: 0, lastFailure: 0, state: 'closed' };
      circuitBreakers.set(serviceName, state);
    }

    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      state.state = 'open';
      this.logEvent({
        event_type: 'warning',
        severity: 'high',
        component: serviceName,
        operation: 'circuit_breaker',
        message: `Circuit breaker opened for ${serviceName} after ${state.failures} failures`,
      });
    }
  }

  /**
   * Record circuit breaker success
   */
  recordCircuitSuccess(serviceName: string): void {
    const state = circuitBreakers.get(serviceName);

    if (state) {
      state.failures = 0;
      state.state = 'closed';
    }
  }
}

// Export singleton instance
export const enterpriseMonitor = EnterpriseMonitor.getInstance();

/**
 * Higher-order function for monitoring async operations
 */
export function withMonitoring<T extends unknown[], R>(
  operationName: string,
  component: string,
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      // Check circuit breaker
      if (!enterpriseMonitor.checkCircuitBreaker(component)) {
        throw new Error(`Service ${component} is currently unavailable (circuit breaker open)`);
      }

      const result = await fn(...args);

      const duration = Date.now() - startTime;

      // Record success metric
      await enterpriseMonitor.recordMetric({
        operation: operationName,
        duration_ms: duration,
        metadata: { request_id: requestId, success: true },
      });

      // Record circuit success
      enterpriseMonitor.recordCircuitSuccess(component);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Record failure
      enterpriseMonitor.recordCircuitFailure(component);

      await enterpriseMonitor.logEvent({
        event_type: 'error',
        severity: 'high',
        component,
        operation: operationName,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack_trace: error instanceof Error ? error.stack : undefined,
        duration_ms: duration,
        request_id: requestId,
      });

      throw error;
    }
  };
}

/**
 * Decorator for timing operations
 */
export async function timed<T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    return await fn();
  } finally {
    const duration = Date.now() - startTime;
    await enterpriseMonitor.recordMetric({
      operation: operationName,
      duration_ms: duration,
    });
  }
}
