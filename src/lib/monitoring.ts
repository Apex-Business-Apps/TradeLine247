/**
 * Enterprise-Grade Monitoring & Observability System
 *
 * Provides comprehensive monitoring for:
 * - Performance metrics (Web Vitals, custom metrics)
 * - Error tracking and reporting
 * - User behavior analytics
 * - Security events
 * - Business metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  navigationType?: string;
}

interface SecurityEvent {
  type: 'csp-violation' | 'xss-attempt' | 'rate-limit' | 'auth-failure' | 'suspicious-activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp: string;
  userAgent?: string;
  ip?: string;
}

interface BusinessMetric {
  event: string;
  category: string;
  value?: number;
  metadata?: Record<string, any>;
}

/**
 * Performance monitoring with Web Vitals
 */
export class PerformanceMonitor {
  private static metrics: Map<string, PerformanceMetric> = new Map();

  /**
   * Track a performance metric
   */
  static trackMetric(metric: PerformanceMetric): void {
    this.metrics.set(metric.name, metric);

    // Log poor performance immediately
    if (metric.rating === 'poor') {
      console.warn(`[Performance] Poor ${metric.name}:`, metric.value);
    }

    // Send to analytics
    if (window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        non_interaction: true,
      });
    }
  }

  /**
   * Get performance summary
   */
  static getSummary(): Record<string, PerformanceMetric> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Track custom timing
   */
  static trackTiming(name: string, duration: number): void {
    const rating = duration < 1000 ? 'good' : duration < 2500 ? 'needs-improvement' : 'poor';
    this.trackMetric({ name, value: duration, rating });
  }
}

/**
 * Security event monitoring
 */
export class SecurityMonitor {
  private static readonly ALERT_THRESHOLD = {
    low: 10,
    medium: 5,
    high: 2,
    critical: 1,
  };

  private static events: SecurityEvent[] = [];

  /**
   * Report a security event
   */
  static reportEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    this.events.push(fullEvent);

    // Alert on critical events
    if (event.severity === 'critical' || event.severity === 'high') {
      console.error('[Security] Critical event:', fullEvent);
    }

    // Send to backend for analysis
    this.sendToBackend(fullEvent);
  }

  /**
   * Send security event to backend
   */
  private static sendToBackend(event: SecurityEvent): void {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/security/events', JSON.stringify(event));
    }
  }

  /**
   * Track CSP violations
   */
  static setupCSPViolationTracking(): void {
    document.addEventListener('securitypolicyviolation', (e) => {
      this.reportEvent({
        type: 'csp-violation',
        severity: 'high',
        details: {
          violatedDirective: e.violatedDirective,
          blockedURI: e.blockedURI,
          originalPolicy: e.originalPolicy,
          disposition: e.disposition,
        },
      });
    });
  }
}

/**
 * Business metrics tracking
 */
export class BusinessMetricsMonitor {
  /**
   * Track a business event
   */
  static trackEvent(metric: BusinessMetric): void {
    // Send to Google Analytics
    if (window.gtag) {
      window.gtag('event', metric.event, {
        event_category: metric.category,
        value: metric.value,
        ...metric.metadata,
      });
    }

    // Send to Klaviyo
    if (window.klaviyo) {
      window.klaviyo.push(['track', metric.event, {
        category: metric.category,
        value: metric.value,
        ...metric.metadata,
      }]);
    }
  }

  /**
   * Track conversion events
   */
  static trackConversion(name: string, value?: number): void {
    this.trackEvent({
      event: 'conversion',
      category: 'conversions',
      value,
      metadata: { conversion_name: name },
    });
  }

  /**
   * Track user engagement
   */
  static trackEngagement(action: string, metadata?: Record<string, any>): void {
    this.trackEvent({
      event: 'engagement',
      category: 'user_engagement',
      metadata: { action, ...metadata },
    });
  }
}

/**
 * Initialize all monitoring systems
 */
export function initializeMonitoring(): void {
  // Setup CSP violation tracking
  SecurityMonitor.setupCSPViolationTracking();

  // Track page visibility
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      PerformanceMonitor.trackTiming('page_hidden', performance.now());
    }
  });

  // Track long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            PerformanceMonitor.trackMetric({
              name: 'long_task',
              value: entry.duration,
              rating: entry.duration > 200 ? 'poor' : 'needs-improvement',
            });
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // PerformanceObserver not supported
    }
  }

  console.log('✅ Monitoring initialized');
}

// Global declarations for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    klaviyo?: any;
  }
}
