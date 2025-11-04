import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('a11y on home', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  // Color contrast should be fixed - bg-green-700 should pass WCAG AA (4.5:1+)
  expect(results.violations.find((v) => v.id === 'color-contrast')).toBeFalsy();
});


