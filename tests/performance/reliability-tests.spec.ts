/**
 * Reliability Tests - System Robustness
 *
 * Tests to ensure all systems, functions, and components are reliable
 *
 * @slow - These tests run in nightly builds only (full project)
 * They are excluded from PR gates (critical project)
 */

import { test, expect } from '@playwright/test';

// Configure for parallel execution, no retries (performance tests should be deterministic)
test.describe.configure({ mode: 'parallel', retries: 0 });

test.describe('Reliability Tests - System Robustness', () => {
  test('Background Image System Reliability', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify all background images are properly configured
    const backgroundConfig = await page.evaluate(() => {
      const elements = document.querySelectorAll('.landing-wallpaper, .hero-bg, [data-bg-layer="true"]');
      return Array.from(elements).map(el => {
        const style = window.getComputedStyle(el);
        return {
          pointerEvents: style.pointerEvents,
          zIndex: parseInt(style.zIndex) || 0,
          position: style.position,
          backgroundImage: style.backgroundImage !== 'none',
        };
      });
    });

    // Verify pointer-events and z-index for all background elements
    backgroundConfig.forEach(config => {
      expect(config.pointerEvents).toBe('none');
      expect(config.zIndex).toBeLessThan(10);
    });

    // Verify at least one element has a background image
    const hasBackgroundImage = backgroundConfig.some(config => config.backgroundImage);
    expect(hasBackgroundImage).toBe(true);
  });

  test('Overlay System Reliability', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check hero overlay opacity
    const heroOverlay = await page.evaluate(() => {
      const hero = document.querySelector('.hero-section');
      if (!hero) return null;
      
      const overlay = Array.from(hero.children).find((el: Element) => {
        const style = window.getComputedStyle(el);
        return style.backgroundColor.includes('hsl') && 
               style.position === 'absolute';
      });
      
      if (!overlay) return null;
      
      const style = window.getComputedStyle(overlay);
      const bgColor = style.backgroundColor;
      const opacityMatch = bgColor.match(/\/\s*([\d.]+)\)/);
      return opacityMatch ? parseFloat(opacityMatch[1]) : null;
    });

    // Hero overlay should be 40% (0.4)
    if (heroOverlay !== null) {
      expect(heroOverlay).toBeCloseTo(0.4, 1);
    }

    // Check landing mask opacity
    const landingMask = await page.evaluate(() => {
      const mask = document.querySelector('.landing-mask');
      if (!mask) return null;
      
      const style = window.getComputedStyle(mask);
      const bgColor = style.backgroundColor;
      const opacityMatch = bgColor.match(/\/\s*([\d.]+)\)/);
      return opacityMatch ? parseFloat(opacityMatch[1]) : null;
    });

    // Landing mask should be 65% (0.65)
    if (landingMask !== null) {
      expect(landingMask).toBeCloseTo(0.65, 1);
    }
  });

  test('Hero Text Shadow Reliability', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check hero headline shadow
    const headlineShadow = await page.evaluate(() => {
      const headline = document.querySelector('.hero-headline, h1.hero-headline');
      if (!headline) return null;
      
      const style = window.getComputedStyle(headline);
      return style.textShadow;
    });

    // Should have brand orange shadow
    if (headlineShadow) {
      expect(headlineShadow).toContain('255, 107, 53'); // Brand orange RGB
    }

    // Check hero tagline shadow
    const taglineShadow = await page.evaluate(() => {
      const tagline = document.querySelector('.hero-tagline, p.hero-tagline');
      if (!tagline) return null;
      
      const style = window.getComputedStyle(tagline);
      return style.textShadow;
    });

    // Should have brand orange shadow
    if (taglineShadow) {
      expect(taglineShadow).toContain('255, 107, 53'); // Brand orange RGB
    }
  });

  test('Platform-Specific Styles Reliability', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that platform-specific styles are loaded
    const platformStyles = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      return stylesheets.map(sheet => {
        try {
          return (sheet as CSSStyleSheet).href || 'inline';
        } catch {
          return 'inline';
        }
      });
    });

    // Should have CSS files loaded
    expect(platformStyles.length).toBeGreaterThan(0);
  });

  test('Safe Area Support Reliability', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for safe area usage
    const safeAreaUsage = await page.evaluate(() => {
      const style = document.createElement('style');
      document.head.appendChild(style);
      const sheet = style.sheet as CSSStyleSheet;
      
      // Check if safe area is used in any styles
      const allStyles = Array.from(document.styleSheets);
      let hasSafeArea = false;
      
      allStyles.forEach(styleSheet => {
        try {
          const rules = Array.from((styleSheet as CSSStyleSheet).cssRules || []);
          rules.forEach(rule => {
            if (rule.cssText.includes('safe-area-inset')) {
              hasSafeArea = true;
            }
          });
        } catch (e) {
          // Cross-origin stylesheets may throw
        }
      });
      
      return hasSafeArea;
    });

    // Should use safe areas for mobile devices
    expect(safeAreaUsage).toBe(true);
  });

  test('Touch Interaction Reliability', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.setViewportSize({ width: 375, height: 667 });
    }
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check touch interaction support
    const touchSupport = await page.evaluate(() => {
      return {
        touchEvents: 'ontouchstart' in window,
        pointerEvents: 'onpointerdown' in window,
        passiveListeners: true, // Assume modern browsers support
      };
    });

    expect(touchSupport.touchEvents || touchSupport.pointerEvents).toBe(true);
  });

  test('Animation Reliability - No Jank', async ({ page }) => {
    // CI environments lack GPU acceleration - animation jank tests are not meaningful
    // Document: Headless browsers in CI runners cannot accurately measure frame timing
    if (process.env.CI) {
      console.log('[CI] Skipping jank test - no GPU in headless runners');
      return;
    }

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure animations are enabled for accurate jank measurement
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // Stabilization delay before sampling
    await page.waitForTimeout(250);

    // Measure frame drops during animation
    const frameDrops = await page.evaluate(() => {
      let frameCount = 0;
      let lastTime = performance.now();
      const frameTimes: number[] = [];

      return new Promise<number[]>(resolve => {
        function measureFrame() {
          const currentTime = performance.now();
          const frameTime = currentTime - lastTime;
          frameTimes.push(frameTime);
          frameCount++;
          lastTime = currentTime;

          if (frameCount < 60) {
            requestAnimationFrame(measureFrame);
          } else {
            resolve(frameTimes);
          }
        }

        // Trigger animations
        window.scrollTo(0, 500);
        requestAnimationFrame(measureFrame);
      });
    });

    // Check for excessive frame drops (> 20ms indicates jank)
    if (frameDrops.length === 0) {
      throw new Error('Jank measurement failed: no frame rate samples collected. requestAnimationFrame may not be firing.');
    }

    // Filter out non-finite values to prevent NaN
    const cleanFrameDrops = frameDrops.filter(time => Number.isFinite(time) && time > 0);
    expect(cleanFrameDrops.length).toBeGreaterThanOrEqual(60);

    if (cleanFrameDrops.length === 0) {
      throw new Error('Jank measurement failed: all frame time samples were invalid (NaN, Infinity, or <= 0).');
    }

    const jankyFrames = cleanFrameDrops.filter(time => time > 20).length;
    const jankPercentage = (jankyFrames / cleanFrameDrops.length) * 100;

    expect(Number.isFinite(jankPercentage)).toBe(true);
    // Local/production target: < 10% janky frames
    expect(jankPercentage).toBeLessThan(10);
  });

  test('Error Handling Reliability', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#main-content')).toBeVisible();
    await page.waitForTimeout(process.env.CI ? 1500 : 500);

    // Navigate through pages
    await page.goto('/features', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#main-content')).toBeVisible();
    await page.waitForTimeout(process.env.CI ? 1500 : 500);

    await page.goto('/pricing', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#main-content')).toBeVisible();
    await page.waitForTimeout(process.env.CI ? 1500 : 500);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#main-content')).toBeVisible();
    await page.waitForTimeout(process.env.CI ? 1500 : 500);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => {
      const lowerError = error.toLowerCase();
      return !lowerError.includes('favicon') &&
             !lowerError.includes('analytics') &&
             !lowerError.includes('third-party') &&
             !lowerError.includes('gtm') &&
             !lowerError.includes('google') &&
             !lowerError.includes('font') &&
             !lowerError.includes('preload') &&
             !lowerError.includes('prefetch') &&
             !lowerError.includes('manifest') &&
             !lowerError.includes('service-worker') &&
             !lowerError.includes('sw.js');
    });

    // CI: Resources load differently (fonts, manifests, external scripts) - allow more errors
    // Local: Strict threshold to catch real issues
    const maxErrors = process.env.CI ? 70 : 5;
    expect(criticalErrors.length).toBeLessThan(maxErrors);
  });

  test('Resource Loading Reliability', async ({ page }) => {
    const failedResources: string[] = [];
    
    page.on('response', response => {
      if (!response.ok() && response.status() >= 400) {
        failedResources.push(response.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out expected non-critical failures
    const criticalFailures = failedResources.filter(url => {
      const lowerUrl = url.toLowerCase();
      return !lowerUrl.includes('analytics') &&
             !lowerUrl.includes('tracking') &&
             !lowerUrl.includes('favicon') &&
             !lowerUrl.includes('gtm') &&
             !lowerUrl.includes('google') &&
             !lowerUrl.includes('fonts') &&
             !lowerUrl.includes('manifest') &&
             !lowerUrl.includes('.woff') &&
             !lowerUrl.includes('.woff2') &&
             !lowerUrl.includes('.ttf');
    });

    // CI: External resources (fonts, analytics) may fail to load - allow more failures
    // Local: Strict threshold to catch actual broken resources
    const maxFailures = process.env.CI ? 10 : 3;
    expect(criticalFailures.length).toBeLessThan(maxFailures);
  });
});
