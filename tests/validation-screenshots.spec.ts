import { test, expect } from '@playwright/test';
import { mkdirSync } from 'fs';
import { join } from 'path';

const SCREENSHOT_DIR = join(process.cwd(), 'validation-screenshots');

test.beforeAll(() => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.describe('Validation Screenshots', () => {
  test('Hero Overlay - 40% opacity', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const heroSection = page.locator('.hero-section, [data-testid="hero-bg"]').first();
    await heroSection.waitFor({ state: 'visible' });
    
    await page.screenshot({
      path: join(SCREENSHOT_DIR, '01-hero-overlay-40-opacity.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 800 }
    });
  });

  test('Landing Mask - 65% overlay', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: join(SCREENSHOT_DIR, '02-landing-mask-65-overlay.png'),
      fullPage: true
    });
  });

  test('Hero Text Shadows - Brand Orange', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const heroText = page.locator('h1.hero-headline').first();
    await heroText.waitFor({ state: 'visible' });
    
    await page.screenshot({
      path: join(SCREENSHOT_DIR, '03-hero-text-shadows-brand-orange.png'),
      fullPage: false,
      clip: { x: 0, y: 200, width: 1920, height: 600 }
    });
  });

  test('Background Image Layering - No Scroll Interference', async ({ page }) => {
    await page.goto('/features', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Scroll to verify background doesn't interfere
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    
    await page.screenshot({
      path: join(SCREENSHOT_DIR, '04-background-layering-no-scroll-interference.png'),
      fullPage: true
    });
  });

  test('Mobile Background - Cover (no letterboxing)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: join(SCREENSHOT_DIR, '05-mobile-background-cover.png'),
      fullPage: true
    });
  });

  test('Desktop Background - Full Layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: join(SCREENSHOT_DIR, '06-desktop-background-full-layout.png'),
      fullPage: true
    });
  });

  test.skip('Main Landmark - Accessibility', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const mainElement = page.locator('main#main-content[role="main"]');
    const count = await mainElement.count();
    expect(count).toBeGreaterThan(0);
    
    await page.screenshot({
      path: join(SCREENSHOT_DIR, '07-main-landmark-accessibility.png'),
      fullPage: true
    });
  });

  test('Tablet View - Responsive Layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: join(SCREENSHOT_DIR, '08-tablet-responsive-layout.png'),
      fullPage: true
    });
  });
});
