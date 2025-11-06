/**
 * DEPRECATED: Use errorReporter from '@/lib/errorReporter' instead
 * This file exists only for backward compatibility during migration
 * @deprecated
 */

import { errorReporter } from './errorReporter';

    await fetch(`${base}/ops-error-intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (reportingError) {
    // Fallback: Store error in localStorage for debugging
    try {
      const fallbackKey = 'error_reporting_failures';
      const existing = JSON.parse(localStorage.getItem(fallbackKey) || '[]');
      existing.push({
        originalError: err instanceof Error ? err.message : String(err),
        reportingError: reportingError instanceof Error ? reportingError.message : String(reportingError),
        timestamp: new Date().toISOString(),
        userAgent: navigator?.userAgent || 'unknown'
      });
      // Keep only last 10 failures to prevent localStorage bloat
      const limited = existing.slice(-10);
      localStorage.setItem(fallbackKey, JSON.stringify(limited));
    } catch (storageError) {
      // Final fallback - console only (better than complete silence)
      console.error('[reportError] Failed to report error and store fallback:', {
        originalError: err,
        reportingError,
        storageError
      });
    }
  }
}
