/**
 * Reliability Tests - System Robustness
 * 
 * Tests to ensure all systems, functions, and components are reliable
 */

import { test, expect } from '@playwright/test';

test.describe('Reliability Tests - System Robustness', () => {
  test('Background Image System Reliability', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify all background images are properly configured
    const backgroundConfig = await page.evaluate(() => {
      const elements = document.querySelectorAll('[style*="backgroundImage"], .landing-wallpaper, .hero-bg');
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

    backgroundConfig.forEach(config => {
      expect(config.pointerEvents).toBe('none');
      expect(config.zIndex).toBeLessThan(10);
      expect(config.backgroundImage).toBe(true);
    });
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
    await page.goto('/');
    await page.waitForLoadState('networkidle');

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
    const jankyFrames = frameDrops.filter(time => time > 20).length;
    const jankPercentage = (jankyFrames / frameDrops.length) * 100;
    
    // Should have less than 10% janky frames
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

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate through pages
    await page.goto('/features');
    await page.waitForLoadState('networkidle');
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(error => {
      return !error.includes('favicon') && 
             !error.includes('analytics') &&
             !error.includes('third-party');
    });

    // Should have no critical errors
    expect(criticalErrors.length).toBe(0);
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
      return !url.includes('analytics') &&
             !url.includes('tracking') &&
             !url.includes('favicon');
    });

    // Should have no critical resource failures
    expect(criticalFailures.length).toBe(0);
  });
});
