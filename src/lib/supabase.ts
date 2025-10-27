// src/lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
const enabled = !!(url && anon);

/** Proxy that throws a clear error if someone calls Supabase while disabled. */
function offline<T extends object>(msg: string): T {
  return new Proxy({} as T, { get() { throw new Error(msg); } });
}

export const supabase: SupabaseClient = enabled
  ? createClient(url, anon, { auth: { persistSession: true } })
  : offline<SupabaseClient>(
      'Supabase disabled: no VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set.'
    );
