/**
 * Centralized Error Reporter
 * Captures and reports all errors for monitoring
 */

interface ErrorReport {
  type: 'error' | 'unhandledRejection' | 'react' | 'network';
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  environment: string;
  metadata?: Record<string, any>;
}

/**
 * Type guard to check if value is an Error object
 */
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Normalizes any value to an Error object with proper stack trace
 */
function normalizeError(value: unknown): Error {
  if (isError(value)) {
    return value;
  }

  // Convert non-Error values to Error objects
  if (typeof value === 'string') {
    return new Error(value);
  }

  if (value && typeof value === 'object') {
    // Try to extract message from object
    const message = (value as any).message || (value as any).error || JSON.stringify(value);
    const error = new Error(message);
    // Preserve original stack if available
    if ((value as any).stack) {
      error.stack = (value as any).stack;
    }
    return error;
  }

  // Fallback for primitives
  return new Error(String(value));
}

class ErrorReporter {
  private errors: ErrorReport[] = [];
  private maxErrors = 50;
  private reportEndpoint = '/api/errors'; // Could be Supabase function

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupGlobalHandlers();
    }
  }

  private setupGlobalHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.report({
        type: 'error',
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: this.getEnvironment(),
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const normalizedError = normalizeError(event.reason);
      this.report({
        type: 'unhandledRejection',
        message: normalizedError.message,
        stack: normalizedError.stack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: this.getEnvironment(),
        metadata: {
          reason: event.reason,
          wasNormalized: !isError(event.reason)
        }
      });
    });

    // Network error detection
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          this.report({
            type: 'network',
            message: `Network error: ${response.status} ${response.statusText}`,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            environment: this.getEnvironment(),
            metadata: {
              fetchUrl: args[0],
              status: response.status,
              statusText: response.statusText
            }
          });
        }
        return response;
      } catch (error) {
        const normalizedError = normalizeError(error);
        this.report({
          type: 'network',
          message: `Fetch failed: ${normalizedError.message}`,
          stack: normalizedError.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: this.getEnvironment(),
          metadata: {
            fetchUrl: args[0],
            error: String(error),
            wasNormalized: !isError(error)
          }
        });
        throw normalizedError; // Re-throw normalized error with stack
      }
    };
  }

  private getEnvironment(): string {
    const hostname = window.location.hostname.toLowerCase();
    const previewDomains = ['lovableproject.com', 'lovable.app', 'lovable.dev', 'gptengineer.app'];
    const isPreviewHost =
      hostname.includes('.lovable.') ||
      previewDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));

    if (isPreviewHost) {
      return 'preview';
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    if (hostname.includes('tradeline247ai.com')) {
      return 'production';
    }
    return 'unknown';
  }

  report(error: ErrorReport) {
    // Add to local store
    this.errors.push(error);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in dev
    if (import.meta.env.DEV || this.getEnvironment() === 'preview') {
      console.error('📊 Error Report:', error);
    }

    // Send to backend (optional, only in production)
    if (this.getEnvironment() === 'production') {
      this.sendToBackend(error).catch(e => {
        console.warn('Failed to send error report:', e);
      });
    }

    // Store in localStorage for debugging
    try {
      const stored = JSON.parse(localStorage.getItem('error_reports') || '[]');
      stored.push(error);
      // Keep only last 20
      const trimmed = stored.slice(-20);
      localStorage.setItem('error_reports', JSON.stringify(trimmed));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  private async sendToBackend(error: ErrorReport) {
    // Only send critical errors to avoid spam
    if (error.type === 'error' || error.type === 'unhandledRejection') {
      try {
        await fetch(this.reportEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error)
        });
      } catch (e) {
        // Silent fail - don't want to create error loops
      }
    }
  }

  getRecentErrors(): ErrorReport[] {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
    try {
      localStorage.removeItem('error_reports');
    } catch (e) {
      // Ignore
    }
  }
}

export const errorReporter = new ErrorReporter();

// Export for React Error Boundaries
export function reportReactError(error: unknown, errorInfo?: { componentStack?: string }) {
  // Normalize error to ensure we have proper Error object with stack
  const normalizedError = normalizeError(error);

  errorReporter.report({
    type: 'react',
    message: normalizedError.message,
    stack: normalizedError.stack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    environment: errorReporter['getEnvironment'](),
    metadata: {
      componentStack: errorInfo?.componentStack,
      wasNormalized: !isError(error)
    }
  });
}

