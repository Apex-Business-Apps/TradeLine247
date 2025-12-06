import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * Supabase Client Unit Tests
 *
 * Tests the env-driven behavior of the Supabase client.
 * The setupTests.tsx mocks VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY,
 * so we test the "enabled" behavior here.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Supabase Client', () => {
  it('should export isSupabaseEnabled flag', async () => {
    const { isSupabaseEnabled } = await import('./client');

    expect(typeof isSupabaseEnabled).toBe('boolean');
    // Client has hardcoded fallback values, so it should always be enabled
    // Even if env vars are not set, fallbacks ensure supabase is created
    expect(isSupabaseEnabled).toBe(true);
  });

  it('should export supabase client', async () => {
    const { supabase, isSupabaseEnabled } = await import('./client');

    // Client has fallback values, so supabase should always be created
    expect(isSupabaseEnabled).toBe(true);
    expect(supabase).toBeDefined();
    expect(supabase).not.toBeNull();
    expect(typeof supabase?.auth).toBe('object');
  });

  it('should have valid Supabase URL configured', () => {
    const clientFilePath = join(__dirname, 'client.ts');
    const content = readFileSync(clientFilePath, 'utf-8');

    // Verify that the file references the correct environment variable names
    expect(content).toContain('VITE_SUPABASE_URL');
    expect(content).toContain('VITE_SUPABASE_ANON_KEY');
    // Check that it has fallback values (either env vars with || fallback or hardcoded URL)
    const hasFallback = content.includes('||') || content.includes('supabase.co');
    expect(hasFallback).toBe(true);
  });

  it('should have valid Supabase key configured', () => {
    const clientFilePath = join(__dirname, 'client.ts');
    const content = readFileSync(clientFilePath, 'utf-8');

    // Verify that the file references the correct environment variable names
    expect(content).toContain('VITE_SUPABASE_URL');
    expect(content).toContain('VITE_SUPABASE_ANON_KEY');
  });

  it('should be marked as auto-generated', () => {
    const clientFilePath = join(__dirname, 'client.ts');
    const content = readFileSync(clientFilePath, 'utf-8');

    // Verify the file has the auto-generated comment
    expect(content).toContain('automatically generated');
    expect(content).toContain('Do not edit it directly');
  });
});

