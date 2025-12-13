import { test, expect } from '@playwright/test';

test.describe('Hero Background Responsiveness', () => {
  test('landing wallpaper layer renders BACKGROUND_IMAGE1', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const heroSection = page.locator('section.hero-section').first();
    await expect(heroSection).toBeVisible();

    const wallpaper = page.locator('.landing-wallpaper');
    await expect(wallpaper).toBeVisible();
    const wallpaperBg = await wallpaper.evaluate((el) => {
      return window.getComputedStyle(el).backgroundImage;
    });
    expect(wallpaperBg).toMatch(/BACKGROUND_IMAGE1.*\.svg/);

    // Wallpaper is scoped to hero section (absolute within hero-shell) to prevent bleed
    const wallpaperPosition = await wallpaper.evaluate((el) => {
      return window.getComputedStyle(el).position;
    });
    expect(wallpaperPosition).toBe('absolute');
  });

  test('mobile: background focal point shows face', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const wallpaper = page.locator('.landing-wallpaper');

    const styles = await wallpaper.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundSize: computed.backgroundSize,
        backgroundPosition: computed.backgroundPosition,
        backgroundRepeat: computed.backgroundRepeat,
        backgroundAttachment: computed.backgroundAttachment,
      };
    });

    // Mobile CSS override: specific size and focal point (20% from top = face visible)
    expect(styles.backgroundPosition).toContain('20%'); // Face focal point
    expect(styles.backgroundSize).toContain('cover');
    expect(styles.backgroundRepeat).toBe('no-repeat');
    expect(styles.backgroundAttachment).toBe('scroll');
  });

  test('tablet: background focal point adjusted', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const wallpaper = page.locator('.landing-wallpaper');

    const styles = await wallpaper.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundSize: computed.backgroundSize,
        backgroundPosition: computed.backgroundPosition,
        backgroundAttachment: computed.backgroundAttachment,
      };
    });

    // Tablet uses mobile CSS override at 768px boundary
    expect(styles.backgroundPosition).toContain('15%'); // Face focal point
    expect(styles.backgroundSize).toContain('cover');
    expect(styles.backgroundAttachment).toBe('scroll');
  });

  test('desktop: background uses cover (Dec 4 standard)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const wallpaper = page.locator('.landing-wallpaper');

    const styles = await wallpaper.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundSize: computed.backgroundSize,
        backgroundPosition: computed.backgroundPosition,
        backgroundRepeat: computed.backgroundRepeat,
        backgroundAttachment: computed.backgroundAttachment,
      };
    });

    // Desktop should use standard cover (no mobile override at this viewport)
    // Note: getComputedStyle returns resolved values, so "center" becomes "50% 50%"
    // Wallpaper is scoped to hero (absolute) so attachment is scroll, not fixed
    expect(styles.backgroundSize).toContain('cover');
    expect(styles.backgroundPosition === 'center' || styles.backgroundPosition === 'center center' || styles.backgroundPosition === '50% 50%' || styles.backgroundPosition.includes('50%')).toBe(true);
    expect(styles.backgroundRepeat).toBe('no-repeat');
    expect(styles.backgroundAttachment).toBe('scroll');
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
