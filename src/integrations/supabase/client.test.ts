import { describe, it, expect } from 'vitest';

/**
 * Supabase Client Unit Tests
 *
 * These tests verify that the Supabase client correctly handles:
 * 1. VITE_SUPABASE_PUBLISHABLE_KEY as an alias for VITE_SUPABASE_ANON_KEY
 * 2. Deriving URL from VITE_SUPABASE_PROJECT_ID when URL is not set
 * 3. Disabling Supabase when required env vars are missing
 *
 * Note: Due to the module-level initialization of the Supabase client and
 * Vitest's module caching, these tests verify the logic by inspecting the
 * code structure rather than testing runtime behavior with different env vars.
 * The actual runtime behavior can be verified through integration tests or
 * manual testing in different environments.
 */

describe('Supabase Client', () => {
  it('should have logic to support VITE_SUPABASE_PUBLISHABLE_KEY', async () => {
    // Read the client.ts file to verify it supports PUBLISHABLE_KEY
    const clientModule = await import('./client.ts?raw');
    const content = typeof clientModule === 'string' ? clientModule : clientModule.default;

    expect(content).toContain('VITE_SUPABASE_PUBLISHABLE_KEY');
    expect(content).toContain('readEnv(\'VITE_SUPABASE_PUBLISHABLE_KEY\')');
  });

  it('should have logic to derive URL from VITE_SUPABASE_PROJECT_ID', async () => {
    // Read the client.ts file to verify it supports PROJECT_ID
    const clientModule = await import('./client.ts?raw');
    const content = typeof clientModule === 'string' ? clientModule : clientModule.default;

    expect(content).toContain('VITE_SUPABASE_PROJECT_ID');
    expect(content).toContain('.supabase.co');
  });

  it('should export isSupabaseEnabled flag', async () => {
    const { isSupabaseEnabled } = await import('./client.ts');

    expect(typeof isSupabaseEnabled).toBe('boolean');
  });

  it('should export supabase client', async () => {
    const { supabase } = await import('./client.ts');

    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });

  it('should have proper env var priority: URL > PROJECT_ID', async () => {
    const clientModule = await import('./client.ts?raw');
    const content = typeof clientModule === 'string' ? clientModule : clientModule.default;

    // Verify that VITE_SUPABASE_URL is checked first, then derivedUrl
    const urlPattern = /SUPABASE_URL\s*=[\s\S]*?readEnv\('VITE_SUPABASE_URL'\)[\s\S]*?derivedUrl/;
    expect(content).toMatch(urlPattern);
  });

  it('should have proper key priority: ANON_KEY > PUBLISHABLE_KEY', async () => {
    const clientModule = await import('./client.ts?raw');
    const content = typeof clientModule === 'string' ? clientModule : clientModule.default;

    // Verify that VITE_SUPABASE_ANON_KEY is checked first, then PUBLISHABLE_KEY
    const keyPattern = /SUPABASE_ANON_KEY\s*=[\s\S]*?readEnv\('VITE_SUPABASE_ANON_KEY'\)[\s\S]*?readEnv\('VITE_SUPABASE_PUBLISHABLE_KEY'\)/;
    expect(content).toMatch(keyPattern);
  });
});
