/**
 * Playwright Authentication Setup
 *
 * Sets up authenticated session for E2E and accessibility tests.
 * Mocks Supabase auth state when no real backend is available (CI environment).
 */

import { test as setup } from '@playwright/test';

const authFile = 'tests/.auth/user.json';

setup('authenticate', async ({ page, context }) => {
  // Check if we're in a CI environment without a real Supabase backend
  const isCI = process.env.CI === 'true';

  if (isCI) {
    // Mock authentication by setting localStorage directly
    // This simulates a logged-in Supabase session
    await page.goto('/');

    // Mock Supabase session in localStorage
    await page.evaluate(() => {
      const mockSession = {
        access_token: 'mock-access-token-for-testing',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString(),
          role: 'authenticated',
          app_metadata: {},
          user_metadata: {
            full_name: 'Test User'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      // Supabase stores session in localStorage with key pattern:
      // sb-<project-ref>-auth-token
      const supabaseKey = Object.keys(localStorage).find(key =>
        key.includes('supabase') && key.includes('auth-token')
      ) || 'sb-mock-auth-token';

      localStorage.setItem(supabaseKey, JSON.stringify(mockSession));
    });

    console.log('✓ Mock authentication set up for CI environment');
  } else {
    // In local environment with real Supabase, perform actual login
    try {
      await page.goto('/auth');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'TestPass123!');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('/dashboard', { timeout: 5000 });
      console.log('✓ Real authentication successful');
    } catch (error) {
      console.log('⚠ Real authentication failed, falling back to mock');
      // Fall back to mock if real auth fails
      await page.goto('/');
      await page.evaluate(() => {
        const mockSession = {
          access_token: 'mock-access-token',
          user: { id: 'mock-user-id', email: 'test@example.com' }
        };
        const key = Object.keys(localStorage).find(k => k.includes('auth-token')) || 'sb-mock-auth-token';
        localStorage.setItem(key, JSON.stringify(mockSession));
      });
    }
  }

  // Save auth state to file for reuse across tests
  await page.context().storageState({ path: authFile });
});
