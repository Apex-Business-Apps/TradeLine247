import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const modulePath = './client.ts';

const clearEnv = () => {
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.VITE_SUPABASE_ANON_KEY;
  delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.VITE_SUPABASE_PROJECT_ID;
};

const importClient = async () => {
  return import(modulePath);
};

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.resetModules();
    clearEnv();
  });

  afterEach(() => {
    vi.resetModules();
    clearEnv();
  });

  it('disables Supabase when env vars are missing', async () => {
    const { isSupabaseEnabled, supabaseFunctionsBase } = await importClient();

    expect(isSupabaseEnabled).toBe(false);
    expect(supabaseFunctionsBase).toBeUndefined();
  });

  it('enables Supabase when url and anon key are provided', async () => {
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

    const { isSupabaseEnabled, supabaseFunctionsBase, supabase } = await importClient();

    expect(isSupabaseEnabled).toBe(true);
    expect(supabaseFunctionsBase).toBe('https://example.supabase.co/functions/v1');
    expect(supabase).toBeDefined();
    expect(typeof supabase.auth).toBe('object');
  });

  it('accepts publishable key alias when anon key is not set', async () => {
    process.env.VITE_SUPABASE_URL = 'https://alias.supabase.co';
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'alias-key';

    const { isSupabaseEnabled, supabaseFunctionsBase } = await importClient();

    expect(isSupabaseEnabled).toBe(true);
    expect(supabaseFunctionsBase).toBe('https://alias.supabase.co/functions/v1');
  });

  it('derives url from project id if url missing', async () => {
    process.env.VITE_SUPABASE_PROJECT_ID = 'projectref';
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';

    const { isSupabaseEnabled, supabaseFunctionsBase, supabaseUrl } = await importClient();

    expect(isSupabaseEnabled).toBe(true);
    expect(supabaseUrl).toBe('https://projectref.supabase.co');
    expect(supabaseFunctionsBase).toBe('https://projectref.supabase.co/functions/v1');
  });
});
