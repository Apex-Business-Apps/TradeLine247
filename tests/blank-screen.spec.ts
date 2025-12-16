import { test, expect } from '@playwright/test';

const SAFE_MODE_LOG = '[SAFE MODE] Enabled via ?safe=1';

const FUNCTIONS_BASE = process.env.SUPABASE_FUNCTIONS_URL?.replace(/\/$/, '');

test.describe('Blank Screen Prevention', () => {
  test('preview loads without blank screen', async ({ page }) => {
    await page.goto('/');
    
    // Should render content within 3 seconds
    await expect(page.locator('#root')).toBeVisible({ timeout: 3000 });
    
    // Root should have content
    const rootContent = await page.locator('#root').textContent();
    expect(rootContent).toBeTruthy();
    expect(rootContent.length).toBeGreaterThan(100);
    
    // Main element should exist
    await expect(page.locator('#main')).toBeVisible();
    
    // Hero section should be visible
    await expect(page.locator('h1').first()).toContainText('24/7');
  });

  test.skip('background image loads correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const wallpaper = page.locator('#app-home');
    await expect(wallpaper).toHaveCount(1);
    await expect(wallpaper).toBeVisible();

    const css = await wallpaper.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(css).toMatch(/url\(/);

    const opacity = await wallpaper.evaluate((el) => getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeGreaterThan(0);

    // Check for gradient overlay in hero section (replaces separate mask element)
    const heroSection = page.locator('section.hero-section').first();
    if (await heroSection.count() > 0) {
      const heroBg = await heroSection.evaluate((el) => getComputedStyle(el).backgroundImage);
      expect(heroBg).not.toBe('none');
    }
  });

  test('startup splash does not block content', async ({ page }) => {
    await page.goto('/?nosplash=1'); // Disable splash for this test
    
    // Content should be immediately visible
    await expect(page.locator('#main')).toBeVisible({ timeout: 2000 });
  });

  test('safe mode unblanks screen', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));

    await page.goto('/?safe=1', { waitUntil: 'load' });

    await expect(page.locator('#root')).toBeVisible({ timeout: 2000 });

    // CRITICAL: Wait for Safe Mode detection to complete
    await page.waitForFunction(
      () => document.body.hasAttribute('data-safe-mode'),
      { timeout: process.env.CI ? 10000 : 5000 }
    );

    const safeAttr = await page.getAttribute('body', 'data-safe-mode');
    expect(safeAttr).toBe('true');

    const hasSafeMode = logs.some(log => log.includes(SAFE_MODE_LOG));
    expect(hasSafeMode).toBe(true);
  });

  test('css renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // No CSS-related errors
    const cssErrors = errors.filter(e => 
      e.includes('CSS') || 
      e.includes('stylesheet') || 
      e.includes('style')
    );
    
    expect(cssErrors).toHaveLength(0);
  });

  test('root element has correct height', async ({ page }) => {
    await page.goto('/');

    const rootHeight = await page.locator('#root').evaluate((el) => {
      return el.getBoundingClientRect().height;
    });

    // Should be at least viewport height
    const viewportSize = page.viewportSize();
    const viewportHeight = viewportSize?.height || 0;
    expect(rootHeight).toBeGreaterThanOrEqual(viewportHeight * 0.9);
  });

  test('all major sections render', async ({ page }) => {
    await page.goto('/');

    // Check for key sections
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('footer').first()).toBeVisible();

    // Hero content
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

    // Navigation
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });
});

test.describe('Edge Function Health', () => {
  test('healthz endpoint responds quickly', async ({ request }) => {
    test.skip(!FUNCTIONS_BASE, 'Supabase functions URL is not configured for this environment.');

    const start = Date.now();
    const response = await request.get(`${FUNCTIONS_BASE}/healthz`);
    const duration = Date.now() - start;
    
    expect(response.ok()).toBe(true);
    expect(duration).toBeLessThan(2000);
    
    const data = await response.json();
    expect(data).toHaveProperty('healthy');
  });

  test('prewarm job succeeds', async ({ request }) => {
    test.skip(!FUNCTIONS_BASE, 'Supabase functions URL is not configured for this environment.');

    const response = await request.post(`${FUNCTIONS_BASE}/prewarm-cron`);
    
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty('endpoints_warmed');
    expect(data.endpoints_warmed).toBeGreaterThan(0);
  });
});

test.describe('PIPEDA Compliance', () => {
  test('privacy policy includes call recording section', async ({ page }) => {
    await page.goto('/privacy');

    // Wait for the Privacy page to load by checking for the main heading
    await page.waitForSelector('h1:has-text("Privacy Policy")', { timeout: 10000 });

    // Wait for the call recording section to appear
    await page.waitForSelector('#call-recording', { timeout: 5000 });

    await expect(page.locator('#call-recording')).toBeVisible();

    // Verify required elements
    const content = await page.locator('#call-recording').textContent();
    expect(content).toContain('Purpose');
    expect(content).toContain('Opt-Out');
    expect(content).toContain('Retention');
    expect(content).toContain('30 days');
  });

  test('privacy link in footer works', async ({ page }) => {
    await page.goto('/');

    // Use .first() to handle multiple Privacy links (main footer + secondary footer)
    const privacyLink = page.getByRole('link', { name: /privacy/i }).first();
    await expect(privacyLink).toBeVisible();

    await privacyLink.click();
    await expect(page).toHaveURL('/privacy');
  });

  test('call recording anchor link works', async ({ page }) => {
    await page.goto('/privacy#call-recording');

    // Wait for the Privacy page to load
    await page.waitForSelector('h1:has-text("Privacy Policy")', { timeout: 10000 });

    // Wait for the call recording section to appear
    await page.waitForSelector('#call-recording', { timeout: 5000 });

    const section = page.locator('#call-recording');

    // Scroll the section into view and wait a bit for the scroll to complete
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    await expect(section).toBeInViewport();
  });
});

