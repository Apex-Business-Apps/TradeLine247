/**
 * Centralized API Configuration
 *
 * All API endpoints and URLs should be imported from this file.
 * This ensures consistent configuration across environments and
 * prevents hard-coded URLs scattered throughout the codebase.
 *
 * SECURITY NOTE:
 * - Never hard-code sensitive credentials in source code
 * - Use environment variables for all secrets
 * - Anon keys are safe for client-side use (protected by RLS)
 * - Service role keys must NEVER be in client-side code
 */

import { SUPABASE_CONFIG } from './supabase';

/**
 * Base Supabase configuration
 */
export const API_CONFIG = {
  /**
   * Supabase project URL
   */
  supabaseUrl: SUPABASE_CONFIG.url,

  /**
   * Supabase anonymous key (safe for client-side)
   * Protected by Row Level Security (RLS) policies
   */
  supabaseAnonKey: SUPABASE_CONFIG.anonKey,

  /**
   * Supabase Functions base URL
   */
  supabaseFunctionsUrl: `${SUPABASE_CONFIG.url}/functions/v1`,

  /**
   * Application base URL
   */
  appBaseUrl: import.meta.env.VITE_APP_BASE_URL || 'https://tradeline247ai.com',
} as const;

/**
 * Supabase Function endpoints
 */
export const SUPABASE_FUNCTIONS = {
  chat: `${API_CONFIG.supabaseFunctionsUrl}/chat`,
  registerAbSession: `${API_CONFIG.supabaseFunctionsUrl}/register-ab-session`,
  secureAbAssign: 'secure-ab-assign', // Used with supabase.functions.invoke()
  abConvert: 'ab-convert', // Used with supabase.functions.invoke()
  callerIdVerifyStart: `${API_CONFIG.supabaseFunctionsUrl}/callerid-verify-start`,
  callerIdVerifyCheck: `${API_CONFIG.supabaseFunctionsUrl}/callerid-verify-check`,
  secretEncrypt: `${API_CONFIG.supabaseFunctionsUrl}/secret-encrypt`,
} as const;

/**
 * Auth configuration
 */
export const AUTH_CONFIG = {
  /**
   * OAuth callback URL for authentication redirects
   */
  callbackUrl: `${API_CONFIG.appBaseUrl}/auth/callback`,
} as const;

/**
 * Twilio configuration
 */
export const TWILIO_CONFIG = {
  /**
   * Twilio voice forwarding number (E.164 format)
   */
  voiceNumber: import.meta.env.VITE_TWILIO_VOICE_NUMBER_E164 || '+18336062247',
} as const;

/**
 * Get authorization header for Supabase requests
 * @returns Authorization header with Bearer token
 */
export const getAuthHeader = (): string => {
  return `Bearer ${API_CONFIG.supabaseAnonKey}`;
};

/**
 * Get common headers for Supabase API requests
 * @returns Headers object with Content-Type and Authorization
 */
export const getSupabaseHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
    'Authorization': getAuthHeader(),
  };
};
