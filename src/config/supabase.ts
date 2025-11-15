import { env } from '@/utils/env';

/**
 * Supabase Public Configuration
 *
 * Only publishable (anon) credentials belong here. All secrets (service role,
 * access tokens) must be injected via server-side env vars.
 */

const urlFromEnv = env('VITE_SUPABASE_URL');
const projectId = env('VITE_SUPABASE_PROJECT_ID');
const publishableKey = env('VITE_SUPABASE_ANON_KEY') ?? env('VITE_SUPABASE_PUBLISHABLE_KEY');

export const SUPABASE_CONFIG = {
  url: (urlFromEnv ?? (projectId ? `https://${projectId}.supabase.co` : undefined)) ?? '',
  anonKey: publishableKey ?? '',
} as const;

export const hasSupabaseClientConfig = Boolean((urlFromEnv || projectId) && publishableKey);
