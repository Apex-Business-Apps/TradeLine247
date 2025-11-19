import type { Page } from '@playwright/test';

type LoginOptions = {
  email?: string;
  password?: string;
  waitForRedirect?: boolean;
};

export async function loginTestUser(
  page: Page,
  {
    email = process.env.TEST_USER_EMAIL || 'test@example.com',
    password = process.env.TEST_USER_PASSWORD || 'TestPass123!',
    waitForRedirect = true,
  }: LoginOptions = {},
) {
  await page.goto('/auth', { timeout: 5000 });

  const emailField = page.getByLabel(/email/i).first();
  const passwordField = page.getByLabel(/password/i).first();

  await emailField.fill(email, { timeout: 3000 });
  await passwordField.fill(password, { timeout: 3000 });

  await page.getByRole('button', { name: /sign in/i }).click({ timeout: 3000 });

  if (waitForRedirect) {
    await page.waitForURL('/dashboard', { timeout: 7000 });
  }
}

