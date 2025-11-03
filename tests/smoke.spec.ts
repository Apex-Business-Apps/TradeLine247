import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:4173";

const PAGES = [
  { path: "/", h1: /TradeLine 24\/7/i },
  { path: "/pricing", h1: /Simple.*Transparent.*Pricing|Pricing/i },
  { path: "/compare", h1: /TradeLine 24\/7 vs Alternatives|Compare/i },
  { path: "/security", h1: /Security.*Privacy/i },
  { path: "/contact", h1: /Get in Touch|Contact/i },
  { path: "/features", h1: /Features/i },
  { path: "/faq", h1: /FAQ|Frequently Asked Questions/i },
];

for (const page of PAGES) {
  test(`renders ${page.path} with correct heading`, async ({ page: browserPage }) => {
    await browserPage.goto(BASE_URL + page.path, { waitUntil: "networkidle", timeout: 10000 });

    // Check for h1 heading
    const h1 = browserPage.locator("h1").first();
    await expect(h1).toBeVisible({ timeout: 5000 });
    await expect(h1).toHaveText(page.h1);
  });

  test(`${page.path} has no console errors`, async ({ page: browserPage }) => {
    const consoleErrors: string[] = [];

    browserPage.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await browserPage.goto(BASE_URL + page.path, { waitUntil: "networkidle" });

    // Filter out known harmless errors
    const criticalErrors = consoleErrors.filter(
      (err) => !err.includes("Supabase disabled") && !err.includes("identify: not found")
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
