import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { path: "/security", name: "Security" },
  { path: "/compare", name: "Compare" },
  { path: "/pricing", name: "Pricing" },
];

test.describe("Color contrast guardrails", () => {
  for (const { path, name } of pages) {
    test(`has no contrast violations on ${name} page`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      const results = await new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
