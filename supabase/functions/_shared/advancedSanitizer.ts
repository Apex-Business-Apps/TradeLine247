/**
 * Comprehensive Input Sanitization Utility
 * Prevents XSS, SQL injection, and other injection attacks
 */

import { normalizeToE164 } from "./e164.ts";

export type SanitizationOptions = {
  maxLength?: number;
  allowedChars?: RegExp;
  removeHtml?: boolean;
  removeSql?: boolean;
  removeScripts?: boolean;
};

const DEFAULT_OPTIONS: Required<Pick<SanitizationOptions, "maxLength" | "removeHtml" | "removeSql" | "removeScripts">> = {
  maxLength: 1000,
  removeHtml: true,
  removeSql: true,
  removeScripts: true,
};

export function sanitizeText(input: string, options: SanitizationOptions = {}): string {
  if (!input || typeof input !== 'string') return '';

  const opts = { ...DEFAULT_OPTIONS, ...options };
  let sanitized = input.trim();

  if (opts.maxLength) sanitized = sanitized.substring(0, opts.maxLength);
  if (opts.removeHtml) sanitized = sanitized.replace(/<[^>]*>/g, '');

  sanitized = sanitized
    .replace(/[<>`]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ');

  if (opts.removeSql) {
    const sqlPatterns = [/(UNION.*SELECT|INSERT.*INTO|UPDATE.*SET|DELETE.*FROM|DROP.*TABLE)/gi];
    if (sqlPatterns.some(p => p.test(sanitized))) throw new Error('Potential SQL injection detected');
  }

  if (opts.removeScripts && /script|eval\s*\(|setTimeout|setInterval/gi.test(sanitized)) {
    throw new Error('Potential script injection detected');
  }

  if (opts.allowedChars && !opts.allowedChars.test(sanitized)) {
    throw new Error('Input contains invalid characters');
  }

  return sanitized;
}

export function sanitizeEmail(email: string): string {
  const sanitized = sanitizeText(email, { maxLength: 255 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) throw new Error('Invalid email format');
  return sanitized;
}

export function sanitizeName(name: string, maxLength: number = 100): string {
  return sanitizeText(name, {
    maxLength,
    allowedChars: /^[a-zA-Z0-9\s\-'\.&,()]+$/,
    removeHtml: true,
    removeSql: true,
    removeScripts: true,
  });
}

export function sanitizePhone(input: string, defaultCountryCode: string = '1'): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const normalizedInput = sanitizeText(input, {
    maxLength: 32,
    allowedChars: /^[0-9+()\-\s.]+$/,
    removeHtml: true,
    removeSql: true,
    removeScripts: true,
  });

  if (!normalizedInput) {
    return null;
  }

  try {
    return normalizeToE164(normalizedInput, defaultCountryCode);
  } catch (error) {
    console.warn('[sanitizePhone] Failed to normalize phone number', {
      input,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export function detectSuspiciousContent(text: string): boolean {
  const patterns = [/script/gi, /<[^>]*>/gi, /javascript:/gi, /on\w+=/gi, /(union|select|drop|delete)/gi];
  return patterns.some(p => p.test(text));
}

export function validateSecurity(input: string, field: string): void {
  const sanitized = sanitizeText(input, { maxLength: 1024 });
  if (!sanitized) {
    throw new Error(`Invalid ${field}`);
  }
  if (detectSuspiciousContent(sanitized)) {
    throw new Error(`Suspicious content detected in ${field}`);
  }
}

export async function generateRequestHash(data: any): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(JSON.stringify(data));
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

