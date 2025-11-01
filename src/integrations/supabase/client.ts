// Preview-safe Supabase client that NEVER crashes the app if env is missing.
// - If both URL + ANON exist: exports a real client.
// - Otherwise: exports a "soft" stub that resolves with {data:null, error:Disabled}
//   for any call (no unhandled rejections), and a flag isSupabaseEnabled=false.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { SUPABASE_CONFIG } from '@/config/supabase';

// Helpers -----------------------------------------------------
function readEnv(name: string): string | undefined {
  const v = (import.meta as any)?.env?.[name];
  return v && v !== 'undefined' && v !== 'null' ? String(v) : undefined;
}

// Allow quick local/preview override without rebuild
const LS_URL  = typeof localStorage !== 'undefined' ? localStorage.getItem('SUPABASE_URL') : null;
const LS_ANON = typeof localStorage !== 'undefined' ? localStorage.getItem('SUPABASE_ANON_KEY') : null;

// Public project URL and anon key (safe to embed client-side)
// Support both URL and PROJECT_ID (derive URL from project ID if needed)
const projectId = readEnv('VITE_SUPABASE_PROJECT_ID');
const derivedUrl = projectId ? `https://${projectId}.supabase.co` : undefined;

const SUPABASE_URL =
  readEnv('VITE_SUPABASE_URL') ||
  derivedUrl ||
  (LS_URL || undefined) ||
  SUPABASE_CONFIG.url; // ✅ Fallback to embedded config

// Support PUBLISHABLE_KEY as alias for ANON_KEY
const SUPABASE_ANON_KEY =
  readEnv('VITE_SUPABASE_ANON_KEY') ||
  readEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ||
  (LS_ANON || undefined) ||
  SUPABASE_CONFIG.anonKey; // ✅ Fallback to embedded config

// A soft "disabled" result
const DISABLED = Object.freeze({ data: null, error: new Error('[Supabase disabled] Missing URL or ANON key for this environment.') });

// Build a deep proxy that returns functions resolving to DISABLED (no throws)
function disabledProxy(path: string[] = []): any {
  const fn = () => Promise.resolve(DISABLED);
  return new Proxy(fn, {
    get(_t, prop) {
      if (prop === 'then') return undefined; // keep it callable, not a thenable
      // Special cases: common entry points chained by users
      if (prop === 'from' || prop === 'rpc' || prop === 'storage' || prop === 'auth') {
        return disabledProxy([...path, String(prop)]);
      }
      return disabledProxy([...path, String(prop)]);
    },
    apply() {
      return Promise.resolve(DISABLED);
    }
  });
}

const supabaseDisabled = disabledProxy() as unknown as SupabaseClient<Database>;

export const isSupabaseEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const supabase: SupabaseClient<Database> = isSupabaseEnabled
  ? createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : (supabaseDisabled as SupabaseClient<Database>);

// Optional console note so devs know why features are no-op
if (!isSupabaseEnabled && typeof console !== 'undefined') {
  console.warn('[Supabase] Disabled in this environment.', {
    host: typeof location !== 'undefined' ? location.hostname : 'n/a',
    urlPresent: !!SUPABASE_URL,
    anonPresent: !!SUPABASE_ANON_KEY,
  });
}
