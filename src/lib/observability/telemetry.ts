/**
 * Telemetry and Observability Layer
 * Provides structured logging, metrics, and error tracking
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
export type MetricType = 'counter' | 'gauge' | 'histogram';

interface LogContext {
  userId?: string;
  organizationId?: string;
  dealershipId?: string;
  leadId?: string;
  quoteId?: string;
  component?: string;
  action?: string;
  [key: string]: unknown;
}

interface TelemetryEvent {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: Error;
}

interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp: string;
}

class TelemetryService {
  private events: TelemetryEvent[] = [];
  private metrics: Metric[] = [];
  private maxBufferSize = 100;

  log(level: LogLevel, message: string, context: LogContext = {}, error?: Error) {
    const event: TelemetryEvent = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      ...(error && { error }),
    };

    this.events.push(event);
    
    // Console output in development
    if (import.meta.env.DEV) {
      const logMethod = level === 'error' || level === 'fatal' ? 'error' : level === 'warn' ? 'warn' : 'log';
      console[logMethod](`[${level.toUpperCase()}] ${message}`, context, error);
    }

    // Prevent memory leaks
    if (this.events.length > this.maxBufferSize) {
      this.flush();
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log('error', message, context, error);
  }

  fatal(message: string, context?: LogContext, error?: Error) {
    this.log('fatal', message, context, error);
  }

  recordMetric(name: string, type: MetricType, value: number, labels?: Record<string, string>) {
    const metric: Metric = {
      name,
      type,
      value,
      labels,
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.maxBufferSize) {
      this.flushMetrics();
    }
  }

  // Track performance metrics
  trackPerformance(operation: string, duration: number, context?: LogContext) {
    this.recordMetric('operation_duration_ms', 'histogram', duration, {
      operation,
      ...context,
    });
  }

  // Track business metrics
  trackBusinessMetric(name: string, value: number, labels?: Record<string, string>) {
    this.recordMetric(name, 'counter', value, labels);
  }

  private flush() {
    // In production, this would send to your observability backend
    // For now, we'll just clear the buffer
    if (import.meta.env.PROD) {
      // TODO: Send to observability backend (e.g., Sentry, DataDog, CloudWatch)
      // await fetch('/api/telemetry', { method: 'POST', body: JSON.stringify(this.events) });
    }
    this.events = [];
  }

  private flushMetrics() {
    // In production, this would send to your metrics backend
    if (import.meta.env.PROD) {
      // TODO: Send to metrics backend
    }
    this.metrics = [];
  }

  // Get recent events for debugging
  getRecentEvents(count = 50): TelemetryEvent[] {
    return this.events.slice(-count);
  }

  // Get recent metrics
  getRecentMetrics(count = 50): Metric[] {
    return this.metrics.slice(-count);
  }
}

// Singleton instance
export const telemetry = new TelemetryService();

// Performance tracking utility
export function trackOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = performance.now();
  return fn()
    .then((result) => {
      const duration = performance.now() - start;
      telemetry.trackPerformance(operation, duration, context);
      return result;
    })
    .catch((error) => {
      const duration = performance.now() - start;
      telemetry.trackPerformance(operation, duration, context);
      telemetry.error(`Operation failed: ${operation}`, context, error);
      throw error;
    });
}
