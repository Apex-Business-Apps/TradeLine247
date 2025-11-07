/**
 * Safety Helper Utilities
 *
 * Provides safe wrappers for common security-sensitive operations:
 * - URL validation before navigation
 * - Safe JSON parsing with fallbacks
 * - Input sanitization
 */

import { errorReporter } from '@/lib/errorReporter';

/**
 * Validates a URL before opening it
 * Prevents XSS via javascript: and data: URLs
 *
 * @param url - URL to validate
 * @param allowedProtocols - Allowed protocols (default: http, https, mailto, tel)
 * @returns true if URL is safe, false otherwise
 */
export function isValidURL(
  url: string,
  allowedProtocols: string[] = ['http:', 'https:', 'mailto:', 'tel:']
): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url, window.location.href);

    // Check protocol
    if (!allowedProtocols.includes(parsed.protocol)) {
      errorReporter.report({
        type: 'error',
        message: `Blocked navigation to unsafe URL protocol: ${parsed.protocol}`,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment'](),
        metadata: { blockedUrl: url, protocol: parsed.protocol }
      });
      return false;
    }

    // Block javascript: and data: protocols explicitly
    if (url.toLowerCase().startsWith('javascript:') || url.toLowerCase().startsWith('data:')) {
      errorReporter.report({
        type: 'error',
        message: `Blocked XSS attempt via dangerous URL: ${url.substring(0, 50)}...`,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment'](),
        metadata: { blockedUrl: url.substring(0, 100) }
      });
      return false;
    }

    return true;
  } catch (e) {
    errorReporter.report({
      type: 'error',
      message: `Invalid URL format: ${e instanceof Error ? e.message : 'Unknown error'}`,
      stack: e instanceof Error ? e.stack : undefined,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      environment: errorReporter['getEnvironment'](),
      metadata: { attemptedUrl: url }
    });
    return false;
  }
}

/**
 * Safely opens a URL in a new tab after validation
 * Prevents XSS and navigation to unsafe URLs
 *
 * @param url - URL to open
 * @param allowedProtocols - Optional allowed protocols
 * @returns true if URL was opened, false if blocked
 */
export function safeWindowOpen(
  url: string,
  allowedProtocols?: string[]
): boolean {
  if (!isValidURL(url, allowedProtocols)) {
    return false;
  }

  try {
    const newWindow = window.open(url, '_blank');

    // Set security attributes
    if (newWindow) {
      newWindow.opener = null; // Prevent reverse tabnabbing
    }

    return true;
  } catch (e) {
    errorReporter.report({
      type: 'error',
      message: `Failed to open URL: ${e instanceof Error ? e.message : 'Unknown error'}`,
      stack: e instanceof Error ? e.stack : undefined,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      environment: errorReporter['getEnvironment'](),
      metadata: { targetUrl: url }
    });
    return false;
  }
}

/**
 * Safely parses JSON with error handling and fallback
 *
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails (default: null)
 * @param context - Context for error reporting (e.g., "localStorage", "API response")
 * @returns Parsed object or fallback value
 */
export function safeJSONParse<T = any>(
  jsonString: string | null | undefined,
  fallback: T | null = null,
  context: string = 'unknown'
): T | null {
  // Handle null/undefined input
  if (!jsonString) {
    return fallback;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    errorReporter.report({
      type: 'error',
      message: `JSON parse error in ${context}: ${e instanceof Error ? e.message : 'Unknown error'}`,
      stack: e instanceof Error ? e.stack : undefined,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      environment: errorReporter['getEnvironment'](),
      metadata: {
        context,
        jsonPreview: jsonString.substring(0, 100),
        error: e instanceof Error ? e.message : String(e)
      }
    });

    return fallback;
  }
}

/**
 * Safely gets and parses JSON from localStorage
 *
 * @param key - localStorage key
 * @param fallback - Fallback value if not found or invalid
 * @returns Parsed value or fallback
 */
export function safeLocalStorageGetJSON<T = any>(
  key: string,
  fallback: T | null = null
): T | null {
  try {
    const item = localStorage.getItem(key);
    return safeJSONParse<T>(item, fallback, `localStorage:${key}`);
  } catch (e) {
    errorReporter.report({
      type: 'error',
      message: `localStorage access error for key "${key}": ${e instanceof Error ? e.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      environment: errorReporter['getEnvironment'](),
      metadata: { key }
    });
    return fallback;
  }
}

/**
 * Safely sets JSON in localStorage
 *
 * @param key - localStorage key
 * @param value - Value to store
 * @returns true if successful, false otherwise
 */
export function safeLocalStorageSetJSON(
  key: string,
  value: any
): boolean {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    errorReporter.report({
      type: 'error',
      message: `localStorage set error for key "${key}": ${e instanceof Error ? e.message : 'Unknown error'}`,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      environment: errorReporter['getEnvironment'](),
      metadata: { key, error: e instanceof Error ? e.message : String(e) }
    });
    return false;
  }
}
