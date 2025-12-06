/**
 * Enterprise Monitoring & Alerting System
 *
 * Comprehensive monitoring, alerting, and reliability features
 * for production-grade AI receptionist system.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

export interface MonitoringEvent {
  event_type: 'error' | 'warning' | 'info' | 'security' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  operation: string;
  message: string;
  metadata?: Record<string, any>;
  user_id?: string;
  session_id?: string;
  request_id?: string;
  duration_ms?: number;
  error_code?: string;
  stack_trace?: string;
}

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms: number;
  last_check: string;
  details?: Record<string, any>;
  error_message?: string;
}

class EnterpriseMonitor {
  private alertThresholds = {
    error_rate_5min: 0.05, // 5% error rate
    response_time_p95: 5000, // 5 seconds
    concurrent_connections: 50,
    memory_usage: 0.8, // 80%
    cpu_usage: 0.7 // 70%
  };

  private circuitBreakers = new Map<string, {
    failures: number;
    lastFailure: number;
    state: 'closed' | 'open' | 'half-open';
    nextAttempt: number;
  }>();

  /**
   * Log monitoring event with enterprise-grade detail
   */
  async logEvent(event: MonitoringEvent): Promise<void> {
    try {
      // Store in monitoring table
      await supabase
        .from('system_monitoring_events')
        .insert({
          event_type: event.event_type,
          severity: event.severity,
          component: event.component,
          operation: event.operation,
          message: event.message,
          metadata: event.metadata,
          user_id: event.user_id,
          session_id: event.session_id,
          request_id: event.request_id,
          duration_ms: event.duration_ms,
          error_code: event.error_code,
          stack_trace: event.stack_trace,
          created_at: new Date().toISOString()
        });

      // Send alerts for critical issues
      if (event.severity === 'critical' || event.event_type === 'security') {
        await this.sendAlert(event);
      }

      // Check if we need to trigger circuit breaker
      if (event.event_type === 'error') {
        this.updateCircuitBreaker(event.component, true);
      }

    } catch (error) {
      // Fallback logging to console if database fails
      console.error('MONITORING SYSTEM FAILURE:', error);
      console.error('Original event:', event);
    }
  }

  /**
   * Circuit breaker pattern for fault tolerance
   */
  private updateCircuitBreaker(component: string, failed: boolean): void {
    const now = Date.now();
    const breaker = this.circuitBreakers.get(component) || {
      failures: 0,
      lastFailure: 0,
      state: 'closed' as const,
      nextAttempt: 0
    };

    if (failed) {
      breaker.failures++;
      breaker.lastFailure = now;

      // Open circuit after 5 failures in 60 seconds
      if (breaker.failures >= 5 && breaker.state === 'closed') {
        breaker.state = 'open';
        breaker.nextAttempt = now + 60000; // 1 minute timeout
        this.logEvent({
          event_type: 'warning',
          severity: 'high',
          component: 'circuit_breaker',
          operation: 'open',
          message: `Circuit breaker opened for ${component}`,
          metadata: { failures: breaker.failures }
        });
      }
    } else {
      // Success - reset failure count
      breaker.failures = 0;
      if (breaker.state === 'half-open') {
        breaker.state = 'closed';
        this.logEvent({
          event_type: 'info',
          severity: 'medium',
          component: 'circuit_breaker',
          operation: 'close',
          message: `Circuit breaker closed for ${component}`,
        });
      }
    }

    this.circuitBreakers.set(component, breaker);
  }

  /**
   * Check if circuit breaker allows operation
   */
  isCircuitBreakerOpen(component: string): boolean {
    const breaker = this.circuitBreakers.get(component);
    if (!breaker) return false;

    const now = Date.now();

    // Allow single test request when half-open
    if (breaker.state === 'half-open') {
      return false; // Allow the test
    }

    // Check if we should transition from open to half-open
    if (breaker.state === 'open' && now >= breaker.nextAttempt) {
      breaker.state = 'half-open';
      this.circuitBreakers.set(component, breaker);
      return false; // Allow the test
    }

    return breaker.state === 'open';
  }

  /**
   * Send alerts via multiple channels
   */
  private async sendAlert(event: MonitoringEvent): Promise<void> {
    try {
      // Send email alert (placeholder - integrate with email service)
      console.error('🚨 ENTERPRISE ALERT:', {
        severity: event.severity.toUpperCase(),
        component: event.component,
        message: event.message,
        timestamp: new Date().toISOString()
      });

      // Store alert in database
      await supabase
        .from('system_alerts')
        .insert({
          alert_type: event.event_type,
          severity: event.severity,
          title: `${event.component}: ${event.message}`,
          description: event.metadata ? JSON.stringify(event.metadata) : null,
          component: event.component,
          operation: event.operation,
          error_code: event.error_code,
          stack_trace: event.stack_trace,
          status: 'active',
          created_at: new Date().toISOString()
        });

      // TODO: Integrate with external alerting systems
      // - Slack/Discord webhooks
      // - PagerDuty/OpsGenie
      // - Email notifications
      // - SMS alerts for critical issues

    } catch (alertError) {
      console.error('ALERT SYSTEM FAILURE:', alertError);
    }
  }

  /**
   * Health check with comprehensive diagnostics
   */
  async performHealthCheck(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    const startTime = Date.now();

    // Database connectivity check
    try {
      const dbStart = Date.now();
      const { error } = await supabase.from('organizations').select('count').limit(1).single();
      const dbTime = Date.now() - dbStart;

      results.push({
        service: 'database',
        status: error ? 'unhealthy' : 'healthy',
        response_time_ms: dbTime,
        last_check: new Date().toISOString(),
        details: { error: error?.message }
      });
    } catch (error) {
      results.push({
        service: 'database',
        status: 'unhealthy',
        response_time_ms: Date.now() - startTime,
        last_check: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // External services health checks
    const services = [
      { name: 'stripe', url: 'https://api.stripe.com/v1/charges', headers: { 'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')?.substring(0, 10)}...` } },
      { name: 'twilio', url: 'https://api.twilio.com/2010-04-01/Accounts.json' },
      { name: 'openai', url: 'https://api.openai.com/v1/models' }
    ];

    for (const service of services) {
      try {
        const serviceStart = Date.now();
        // Note: These are simplified checks - in production you'd use proper health endpoints
        const response = await fetch(service.url, {
          method: 'HEAD',
          headers: service.headers || {}
        });
        const serviceTime = Date.now() - serviceStart;

        results.push({
          service: service.name,
          status: response.ok ? 'healthy' : 'degraded',
          response_time_ms: serviceTime,
          last_check: new Date().toISOString(),
          details: { status_code: response.status }
        });
      } catch (error) {
        results.push({
          service: service.name,
          status: 'unhealthy',
          response_time_ms: 0,
          last_check: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Service unreachable'
        });
      }
    }

    // Store health check results
    try {
      await supabase
        .from('system_health_checks')
        .insert(results.map(result => ({
          service: result.service,
          status: result.status,
          response_time_ms: result.response_time_ms,
          details: result.details,
          error_message: result.error_message,
          checked_at: result.last_check
        })));
    } catch (storageError) {
      console.error('Health check storage failed:', storageError);
    }

    return results;
  }

  /**
   * Performance metrics collection
   */
  async collectPerformanceMetrics(operation: string, duration: number, metadata?: Record<string, any>): Promise<void> {
    try {
      await supabase
        .from('performance_metrics')
        .insert({
          operation,
          duration_ms: duration,
          metadata,
          collected_at: new Date().toISOString()
        });

      // Check performance thresholds
      if (duration > this.alertThresholds.response_time_p95) {
        await this.logEvent({
          event_type: 'performance',
          severity: 'medium',
          component: 'performance_monitor',
          operation,
          message: `Slow response detected: ${duration}ms`,
          metadata: { ...metadata, threshold: this.alertThresholds.response_time_p95 }
        });
      }
    } catch (error) {
      console.error('Performance metrics collection failed:', error);
    }
  }

  /**
   * Security event logging
   */
  async logSecurityEvent(
    eventType: 'auth_attempt' | 'auth_success' | 'auth_failure' | 'data_access' | 'suspicious_activity',
    details: Record<string, any>,
    userId?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    await this.logEvent({
      event_type: 'security',
      severity,
      component: 'security_monitor',
      operation: eventType,
      message: `Security event: ${eventType}`,
      metadata: details,
      user_id: userId
    });
  }
}

// Singleton instance
export const enterpriseMonitor = new EnterpriseMonitor();

// Utility functions for common monitoring tasks
export function withMonitoring<T extends any[], R>(
  operation: string,
  component: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();

    try {
      // Check circuit breaker
      if (enterpriseMonitor.isCircuitBreakerOpen(component)) {
        throw new Error(`Circuit breaker open for ${component}`);
      }

      const result = await fn(...args);
      const duration = Date.now() - startTime;

      // Log success
      await enterpriseMonitor.logEvent({
        event_type: 'info',
        severity: 'low',
        component,
        operation,
        message: `${operation} completed successfully`,
        duration_ms: duration
      });

      // Collect performance metrics
      await enterpriseMonitor.collectPerformanceMetrics(operation, duration);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;

      // Update circuit breaker
      enterpriseMonitor.updateCircuitBreaker(component, true);

      // Log error
      await enterpriseMonitor.logEvent({
        event_type: 'error',
        severity: 'high',
        component,
        operation,
        message: `${operation} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration_ms: duration,
        error_code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
        stack_trace: error instanceof Error ? error.stack : undefined
      });

      throw error;
    }
  };
}

export default enterpriseMonitor;