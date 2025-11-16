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
 * List of dangerous URL protocols that can execute code
 * These are blocked regardless of allowedProtocols configuration
 */
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
];

/**
 * Validates a URL before opening it
 * Prevents XSS via dangerous protocols (javascript:, data:, vbscript:, etc.)
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

  // Normalize URL for checking
  const normalizedUrl = url.toLowerCase().trim();

  // Block dangerous protocols explicitly (defense in depth)
  // Check before parsing to catch malformed URLs that might bypass URL constructor
  for (const dangerousProtocol of DANGEROUS_PROTOCOLS) {
    if (normalizedUrl.startsWith(dangerousProtocol)) {
      errorReporter.report({
        type: 'error',
        message: `Blocked XSS attempt via dangerous URL protocol: ${dangerousProtocol}`,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment'](),
        metadata: {
          blockedUrl: url.substring(0, 100),
          detectedProtocol: dangerousProtocol
        }
      });
      return false;
    }
  }

  try {
    const parsed = new URL(url, window.location.href);

    // Double-check protocol after parsing (defense in depth)
    const protocol = parsed.protocol.toLowerCase();

    // Block dangerous protocols from parsed URL
    for (const dangerousProtocol of DANGEROUS_PROTOCOLS) {
      if (protocol === dangerousProtocol) {
        errorReporter.report({
          type: 'error',
          message: `Blocked XSS attempt via dangerous URL protocol after parsing: ${protocol}`,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          environment: errorReporter['getEnvironment'](),
          metadata: {
            blockedUrl: url.substring(0, 100),
            parsedProtocol: protocol
          }
        });
        return false;
      }
    }

    // Check if protocol is in allowed list
    if (!allowedProtocols.includes(protocol)) {
      errorReporter.report({
        type: 'error',
        message: `Blocked navigation to disallowed URL protocol: ${protocol}`,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        environment: errorReporter['getEnvironment'](),
        metadata: {
          blockedUrl: url,
          protocol,
          allowedProtocols: allowedProtocols.join(', ')
        }
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
