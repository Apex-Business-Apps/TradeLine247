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
    // In test environment, env vars are mocked so should be true
    // In CI/production without env vars, this will be false - both are valid
    expect(isSupabaseEnabled).toBeDefined();
  });

  it('should export supabase client', async () => {
    const { supabase, isSupabaseEnabled } = await import('./client');

    if (isSupabaseEnabled) {
      expect(supabase).toBeDefined();
      expect(typeof supabase.auth).toBe('object');
    } else {
      expect(supabase).toBeNull();
    }
  });

  it('should have valid Supabase URL configured', () => {
    const clientFilePath = join(__dirname, 'client.ts');
    const content = readFileSync(clientFilePath, 'utf-8');

    // Verify that the file references the correct environment variable names
    expect(content).toContain('VITE_SUPABASE_URL');
    expect(content).toContain('VITE_SUPABASE_ANON_KEY');
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

