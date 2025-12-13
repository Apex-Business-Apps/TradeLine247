import { useEffect } from 'react';
import { errorReporter } from '@/lib/errorReporter';

interface PerformanceEntryExtended extends PerformanceEntry {
  renderTime?: number;
  loadTime?: number;
  hadRecentInput?: boolean;
  value?: number;
  processingStart?: number;
}

/**
 * Web Vitals Reporter Component
 * 
 * Tracks and reports Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint) - Target: ≤2.5s
 * - CLS (Cumulative Layout Shift) - Target: ≤0.05
 * - INP (Interaction to Next Paint) - Target: ≤200ms
 * - FCP (First Contentful Paint) - Target: ≤1.8s
 * - TTFB (Time to First Byte) - Target: ≤800ms
 */
export function WebVitalsReporter() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    const reportMetric = (name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') => {
      // CRITICAL FIX: Validate metric values - sometimes Performance Observer returns invalid timestamps
      const roundedValue = Math.round(value);
      const isValidMetric = roundedValue > 0 && roundedValue < 60000; // Must be between 0 and 60s for web vitals
      
      if (!isValidMetric) {
        errorReporter.report({
          type: 'error',
          message: `Invalid ${name} metric: ${roundedValue}ms - ignoring`,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: errorReporter['getEnvironment'](),
          metadata: { metric: name, value: roundedValue }
        });
        return;
      }

      // Send to analytics via beacon
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          type: 'web_vital',
          metric: name,
          value: roundedValue,
          rating,
          url: window.location.pathname,
          timestamp: Date.now()
        });
        navigator.sendBeacon('/api/vitals', data);
      }

      // Log to console in development
      if (import.meta.env.DEV) {
        const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
        console.log(`${emoji} ${name}: ${roundedValue}ms (${rating})`);
      }
    };

    const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
      const thresholds: Record<string, { good: number; poor: number }> = {
        LCP: { good: 2500, poor: 4000 },
        CLS: { good: 0.05, poor: 0.25 },
        INP: { good: 200, poor: 500 },
        FCP: { good: 1800, poor: 3000 },
        TTFB: { good: 800, poor: 1800 }
      };

      const threshold = thresholds[name];
      if (!threshold) return 'good';

      if (value <= threshold.good) return 'good';
      if (value <= threshold.poor) return 'needs-improvement';
      return 'poor';
    };

    // Observe LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntryExtended;
        const value = lastEntry.renderTime || lastEntry.loadTime || 0;
        reportMetric('LCP', value, getRating('LCP', value));
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (_e) {
      errorReporter.report({
        type: 'error',
        message: 'LCP observer not supported',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment']()
      });
    }

    // Observe CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const extendedEntry = entry as PerformanceEntryExtended;
          if (!extendedEntry.hadRecentInput && extendedEntry.value) {
            clsValue += extendedEntry.value;
          }
        }
        reportMetric('CLS', clsValue, getRating('CLS', clsValue));
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (_e) {
      errorReporter.report({
        type: 'error',
        message: 'CLS observer not supported',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment']()
      });
    }

    // Observe FID (First Input Delay) as fallback
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstInput = entries[0] as PerformanceEntryExtended;
        const value = (firstInput.processingStart || 0) - firstInput.startTime;
        reportMetric('FID', value, getRating('INP', value)); // Use INP thresholds
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (_e) {
      errorReporter.report({
        type: 'error',
        message: 'FID observer not supported',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment']()
      });
    }

    // Observe FCP
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstPaint = entries.find((e) => e.name === 'first-contentful-paint');
        if (firstPaint) {
          const value = firstPaint.startTime;
          reportMetric('FCP', value, getRating('FCP', value));
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });
    } catch (_e) {
      errorReporter.report({
        type: 'error',
        message: 'FCP observer not supported',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment']()
      });
    }

    // Calculate TTFB from Navigation Timing
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        reportMetric('TTFB', ttfb, getRating('TTFB', ttfb));
      }
    } catch (_e) {
      errorReporter.report({
        type: 'error',
        message: 'TTFB calculation not supported',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment']()
      });
    }

  }, []);

  return null; // This is a monitoring component, no UI
}
