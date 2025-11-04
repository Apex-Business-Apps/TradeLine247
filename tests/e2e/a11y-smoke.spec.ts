import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('a11y on home', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.find((v) => v.id === 'color-contrast')).toBeFalsy();
});
