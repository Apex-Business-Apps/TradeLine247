import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:4173";

const PAGES = [
  { path: "/", h1: /Your 24\/7 Ai Receptionist!/i },
  { path: "/pricing", h1: /Simple.*Transparent.*Pricing|Pricing/i },
  { path: "/compare", h1: /TradeLine 24\/7 vs Alternatives|Compare/i },
  { path: "/security", h1: /Security.*Privacy/i },
  { path: "/contact", h1: /Get in Touch|Contact/i },
  { path: "/features", h1: /Features/i },
  { path: "/faq", h1: /FAQ|Frequently Asked Questions/i },
];

// CI-specific timeout settings
test.describe.configure({
  timeout: process.env.CI ? 60000 : 30000, // 60s in CI, 30s local
});

for (const page of PAGES) {
  test(`renders ${page.path} with correct heading`, async ({ page: browserPage }) => {
    await browserPage.goto(BASE_URL + page.path, {
      waitUntil: "networkidle",
      timeout: process.env.CI ? 15000 : 10000
    });

    // Wait for page to fully load
    await browserPage.waitForLoadState('domcontentloaded');

    // Check for h1 heading
    const h1 = browserPage.locator("h1").first();
    await expect(h1).toBeVisible({ timeout: process.env.CI ? 10000 : 5000 });
    await expect(h1).toHaveText(page.h1);
  });

  test(`${page.path} has no console errors`, async ({ page: browserPage }) => {
    const consoleErrors: string[] = [];

    browserPage.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await browserPage.goto(BASE_URL + page.path, {
      waitUntil: "networkidle",
      timeout: process.env.CI ? 15000 : 10000
    });

    // Wait for page to stabilize
    await browserPage.waitForLoadState('domcontentloaded');

    // Filter out known harmless errors
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes("Supabase disabled") &&
        !err.includes("identify: not found") &&
        !err.includes("Failed to load resource") &&
        !err.includes("404") &&
        !err.includes("Global error caught")
    );

    expect(criticalErrors).toHaveLength(0);
  });
}

test("all critical pages return 200 status", async ({ page: browserPage }) => {
  for (const page of PAGES) {
    const response = await browserPage.goto(BASE_URL + page.path);
    expect(response?.status()).toBe(200);
  }
});
