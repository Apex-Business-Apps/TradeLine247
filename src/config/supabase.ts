/**
 * Supabase Public Configuration
 *
 * These credentials are SAFE to embed in client-side code:
 * - The anon key is designed for public exposure
 * - Supabase Row Level Security (RLS) protects all data
 * - Service role key (with full access) is NEVER exposed
 *
 * This follows Supabase best practices and standard deployment patterns.
 * Environment variables can still override these defaults if needed.
 */

export const SUPABASE_CONFIG = {
  // Public Supabase project URL - use environment variable with fallback
  url: import.meta.env.VITE_SUPABASE_URL || 'https://hysvqdwmhxnblxfqnszn.supabase.co',

  // Public anonymous key (safe for client-side use)
  // This key has LIMITED permissions enforced by RLS policies
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5c3ZxZHdtaHhuYmx4ZnFuc3puIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MTQxMjcsImV4cCI6MjA3MjI5MDEyN30.cPgBYmuZh7o-stRDGGG0grKINWe9-RolObGmiqsdJfo'
} as const;

