import { test, expect } from '@playwright/test';

test.describe('Hero Background Responsiveness', () => {
  test('hero section has background image scoped correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const heroSection = page.locator('section.hero-section').first();
    await expect(heroSection).toBeVisible();

    // Verify wallpaper version is present (regression safeguard)
    const wallpaperVersion = await heroSection.getAttribute('data-wallpaper-version');
    expect(wallpaperVersion).toBeTruthy();
    expect(wallpaperVersion).toContain('2025-12-08');

    // Verify background image is applied to hero section, not app-home
    const heroBgImage = await heroSection.evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage;
    });
    expect(heroBgImage).toMatch(/url\(.*BACKGROUND_IMAGE1\.svg/);

    // Verify app-home does NOT have background image
    const appHome = page.locator('#app-home');
    const appHomeBg = await appHome.evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage;
    });
    expect(appHomeBg).toBe('none');
  });

  test('mobile: background uses contain and scroll attachment', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heroSection = page.locator('section.hero-section').first();

    const styles = await heroSection.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundSize: computed.backgroundSize,
        backgroundPosition: computed.backgroundPosition,
        backgroundRepeat: computed.backgroundRepeat,
        backgroundAttachment: computed.backgroundAttachment,
        minHeight: computed.minHeight,
      };
    });

    // Mobile should use contain
    expect(styles.backgroundSize).toContain('contain');
    expect(styles.backgroundPosition).toContain('top');
    expect(styles.backgroundRepeat).toBe('no-repeat');
    expect(styles.backgroundAttachment).toBe('scroll');
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(600); // min-h-screen
  });

  test('tablet: background switches to cover', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heroSection = page.locator('section.hero-section').first();

    const styles = await heroSection.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundSize: computed.backgroundSize,
        backgroundPosition: computed.backgroundPosition,
        backgroundAttachment: computed.backgroundAttachment,
      };
    });

    // Tablet should use cover
    expect(styles.backgroundSize).toContain('cover');
    expect(styles.backgroundPosition).toContain('top');
    expect(styles.backgroundAttachment).toBe('scroll');
  });

  test('desktop: background uses cover with proper height', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heroSection = page.locator('section.hero-section').first();

    const styles = await heroSection.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundSize: computed.backgroundSize,
        backgroundPosition: computed.backgroundPosition,
        minHeight: computed.minHeight,
      };
    });

    expect(styles.backgroundSize).toContain('cover');
    expect(styles.backgroundPosition).toContain('top');
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(600);
  });

  test('background does not leak into next sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Scroll past hero section
    await page.evaluate(() => {
      const hero = document.querySelector('section.hero-section');
      if (hero) {
        hero.scrollIntoView({ behavior: 'instant', block: 'end' });
      }
    });
    await page.waitForTimeout(500);

    // Check BenefitsGrid section (next after hero) does not have background
    const benefitsSection = page.locator('section').filter({ hasText: /benefits/i }).first();
    if (await benefitsSection.count() > 0) {
      const bgImage = await benefitsSection.evaluate((el) => {
        return window.getComputedStyle(el).backgroundImage;
      });
      expect(bgImage).toBe('none');
    }
  });

  test('overlays and gradients remain intact', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const heroSection = page.locator('section.hero-section').first();

    // Check overlay elements exist
    const gradientOverlay = heroSection.locator('.hero-gradient-overlay');
    const vignette = heroSection.locator('.hero-vignette');

    await expect(gradientOverlay).toBeAttached();
    await expect(vignette).toBeAttached();

    // Verify z-index layering
    const overlayZ = await gradientOverlay.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });
    const vignetteZ = await vignette.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });

    expect(parseInt(overlayZ)).toBeGreaterThan(0);
    expect(parseInt(vignetteZ)).toBeGreaterThan(parseInt(overlayZ));
  });

  test('hero content remains visible and readable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const heroSection = page.locator('section.hero-section').first();

    // Check hero headline is visible
    const headline = heroSection.locator('h1');
    await expect(headline).toBeVisible();

    const headlineText = await headline.textContent();
    expect(headlineText).toContain('24/7');

    // Check logo is visible
    const logo = heroSection.locator('img[alt*="Logo"]');
    await expect(logo).toBeVisible();

    // Check CTA buttons are visible
    const ctaButtons = heroSection.locator('a[href*="auth"], button');
    const buttonCount = await ctaButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('background image loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('response', response => {
      if (response.url().includes('BACKGROUND_IMAGE1.svg') && !response.ok()) {
        errors.push(`Failed to load background image: ${response.status()}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const imageErrors = errors.filter(e => e.includes('BACKGROUND_IMAGE1') || e.includes('background'));
    expect(imageErrors).toHaveLength(0);
  });
});
