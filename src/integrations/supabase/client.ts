// Preview-safe Supabase client that NEVER crashes the app if env is missing.
// - If both URL + ANON exist: exports a real client.
// - Otherwise: exports a "soft" stub that resolves with {data:null, error:Disabled}
//   for any call (no unhandled rejections), and a flag isSupabaseEnabled=false.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Helpers -----------------------------------------------------
function readEnv(name: string): string | undefined {
  const v = (import.meta as any)?.env?.[name];
  return v && v !== 'undefined' && v !== 'null' ? String(v) : undefined;
}

// Allow quick local/preview override without rebuild
const LS_URL  = typeof localStorage !== 'undefined' ? localStorage.getItem('SUPABASE_URL') : null;
const LS_ANON = typeof localStorage !== 'undefined' ? localStorage.getItem('SUPABASE_ANON_KEY') : null;

// Public project URL and anon key (safe to embed client-side)
const SUPABASE_URL =
  readEnv('VITE_SUPABASE_URL') ||
  (LS_URL || undefined);

const SUPABASE_ANON_KEY =
  readEnv('VITE_SUPABASE_ANON_KEY') ||
  (LS_ANON || undefined);

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

const supabaseDisabled = disabledProxy() as unknown as SupabaseClient;

export const isSupabaseEnabled = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const supabase: SupabaseClient = isSupabaseEnabled
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : (supabaseDisabled as SupabaseClient);

// Optional console note so devs know why features are no-op
if (!isSupabaseEnabled) {
  console.warn('[Supabase] Disabled in this environment.', {
    host: typeof location !== 'undefined' ? location.hostname : 'n/a',
    urlPresent: !!SUPABASE_URL,
    anonPresent: !!SUPABASE_ANON_KEY,
  });
}
