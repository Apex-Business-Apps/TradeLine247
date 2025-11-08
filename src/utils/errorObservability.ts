/**
 * Error Observability - Production Error Capture
 *
 * Captures and logs runtime errors for debugging in production.
 * No external dependencies - pure console logging for now.
 * Can be extended with Sentry, LogRocket, etc. later.
 */

interface ErrorDetails {
  message: string;
  stack?: string;
  url?: string;
  line?: number;
  column?: number;
  timestamp: string;
  userAgent: string;
}

/**
 * Log error to console with structured format
 */
function logError(details: ErrorDetails) {
  console.error("[ERROR CAPTURE]", {
    ...details,
    environment: import.meta.env.MODE,
  });
}

/**
 * Initialize global error handlers
 */
export function initErrorObservability() {
  // Capture uncaught errors
  window.addEventListener("error", (event) => {
    logError({
      message: event.message,
      stack: event.error?.stack,
      url: event.filename,
      line: event.lineno,
      column: event.colno,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    logError({
      message: `Unhandled Promise Rejection: ${event.reason}`,
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  });

  // Log that observability is active
  console.info("[ERROR OBSERVABILITY] Initialized successfully");
}

/**
 * Manually log an error (for caught errors that should be tracked)
 */
export function captureError(error: Error, context?: Record<string, any>) {
  logError({
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    ...context,
  });
}
