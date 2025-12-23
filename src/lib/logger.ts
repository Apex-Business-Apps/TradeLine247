/**
 * Centralized Logging Service
 *
 * Provides environment-aware logging that:
 * - Logs to console in development
 * - Sends to monitoring service in production
 * - Respects log levels and can be disabled
 * - Sanitizes sensitive data before logging
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('API call failed', { error, endpoint: '/api/users' });
 *   logger.debug('State updated', { oldState, newState });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: unknown;
}

class Logger {
  // Made public and mutable so tests can simulate production by setting false
  public isDevelopment = import.meta.env.DEV;
  private isProduction = import.meta.env.MODE === 'production';
  private minLevel: LogLevel = this.isDevelopment ? 'debug' : 'info';

  public setLogLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitize(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'apiKey',
      'authorization',
      'auth',
      'credential',
      'ssn',
      'creditCard',
    ];

    const sanitized = { ...data } as Record<string, unknown>;

    for (const key in sanitized) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Determine if we should log at this level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const requestedLevelIndex = levels.indexOf(level);
    return requestedLevelIndex >= currentLevelIndex;
  }

  /**
   * Send to monitoring service in production
   */
  private async sendToMonitoring(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
  ): Promise<void> {
    // In production, send logs to your monitoring service
    // For now, we'll use console.error/warn/info which are preserved by Terser
    if (!this.isProduction) {
      return;
    }

    try {
      // TODO: Integrate with your monitoring service (Sentry, LogRocket, etc.)
      // For now, just use console methods that are preserved in production
      if (level === 'error') {
        console.error(`[${level.toUpperCase()}]`, message, metadata);
      } else if (level === 'warn') {
        console.warn(`[${level.toUpperCase()}]`, message, metadata);
      } else {
        console.info(`[${level.toUpperCase()}]`, message, metadata);
      }
    } catch (error) {
      // Silently fail - logging errors shouldn't break the app
    }
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog('debug')) return;

    if (this.isDevelopment) {
      // console.debug is stripped in production by Terser
      console.debug(`[DEBUG]`, message, metadata ? this.sanitize(metadata) : '');
    }
  }

  /**
   * Log an info message
   */
  info(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog('info')) return;

    if (this.isDevelopment) {
      console.info(`[INFO]`, message, metadata ? this.sanitize(metadata) : '');
    } else {
      this.sendToMonitoring('info', message, metadata ? this.sanitize(metadata) as LogMetadata : undefined);
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog('warn')) return;

    if (this.isDevelopment) {
      console.warn(`[WARN]`, message, metadata ? this.sanitize(metadata) : '');
    } else {
      this.sendToMonitoring('warn', message, metadata ? this.sanitize(metadata) as LogMetadata : undefined);
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
    if (!this.shouldLog('error')) return;

    const errorData = {
      ...metadata,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };

    if (this.isDevelopment) {
      console.error(`[ERROR]`, message, this.sanitize(errorData));
    } else {
      this.sendToMonitoring('error', message, this.sanitize(errorData) as LogMetadata);
    }
  }

  /**
   * Create a child logger with a specific context
   */
  child(context: string): ChildLogger {
    return new ChildLogger(this, context);
  }
}

/**
 * Child logger that includes context in all log messages
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private context: string
  ) {}

  debug(message: string, metadata?: LogMetadata): void {
    this.parent.debug(`[${this.context}] ${message}`, metadata);
  }

  info(message: string, metadata?: LogMetadata): void {
    this.parent.info(`[${this.context}] ${message}`, metadata);
  }

  warn(message: string, metadata?: LogMetadata): void {
    this.parent.warn(`[${this.context}] ${message}`, metadata);
  }

  error(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
    this.parent.error(`[${this.context}] ${message}`, error, metadata);
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Convenience function to replace console.log usage
 * Use logger.info() instead for production-appropriate logging
 */
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
};
