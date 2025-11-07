/**
 * Sentry Integration
 *
 * Error tracking and performance monitoring
 *
 * Setup Instructions:
 * 1. Sign up at https://sentry.io
 * 2. Create new project
 * 3. Add VITE_SENTRY_DSN to .env
 * 4. Add VITE_SENTRY_ENVIRONMENT (development/staging/production)
 *
 * Usage:
 * - Errors automatically captured via Error Boundary
 * - Manual error tracking: captureException(error)
 * - Performance: startTransaction('operation')
 */

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
}

// Sentry will be dynamically imported to avoid bundle bloat
let sentryInitialized = false;

export async function initializeSentry(): Promise<void> {
  // Skip in development unless explicitly enabled
  if (import.meta.env.DEV && !import.meta.env.VITE_SENTRY_DEV_ENABLED) {
    console.info('[Sentry] Skipped in development');
    return;
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn('[Sentry] DSN not configured. Error tracking disabled.');
    return;
  }

  try {
    // Dynamic import to keep Sentry out of main bundle
    const Sentry = await import('@sentry/react');

    const config: SentryConfig = {
      dsn,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development',
      release: import.meta.env.VITE_APP_VERSION || 'development',
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    };

    Sentry.init({
      ...config,
      integrations: [
        new Sentry.BrowserTracing({
          // Set sampling rate for performance monitoring
          tracePropagationTargets: ['localhost', /^https:\/\/.*\.autorepai\.ca/],
        }),
        new Sentry.Replay({
          // Privacy settings for session replay
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Filter out non-critical errors
      beforeSend(event, hint) {
        const error = hint.originalException;

        // Ignore network errors (user connectivity issues)
        if (error instanceof Error) {
          if (error.message.includes('NetworkError') ||
              error.message.includes('Failed to fetch')) {
            return null;
          }
        }

        // Ignore cancelled requests
        if (event.exception?.values?.[0]?.value?.includes('aborted')) {
          return null;
        }

        return event;
      },
    });

    // Set user context (anonymized)
    Sentry.setContext('app', {
      name: 'AutoRepAi',
      version: config.release,
    });

    sentryInitialized = true;
    console.info('[Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

export function captureException(error: Error, context?: Record<string, any>): void {
  if (!sentryInitialized) {
    console.error('[Sentry] Not initialized. Error:', error);
    return;
  }

  import('@sentry/react').then((Sentry) => {
    if (context) {
      Sentry.setContext('error_context', context);
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!sentryInitialized) return;

  import('@sentry/react').then((Sentry) => {
    Sentry.captureMessage(message, level);
  });
}

export function setUserContext(userId: string, email?: string): void {
  if (!sentryInitialized) return;

  import('@sentry/react').then((Sentry) => {
    Sentry.setUser({
      id: userId,
      email,
    });
  });
}

export function startTransaction(name: string, op: string = 'custom'): any {
  if (!sentryInitialized) return null;

  return import('@sentry/react').then((Sentry) => {
    return Sentry.startTransaction({ name, op });
  });
}
