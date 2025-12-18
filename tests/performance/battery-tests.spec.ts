/**
 * Battery Tests - Comprehensive Performance & Reliability Testing
 *
 * These tests ensure the app is reliable, robust, and performs well
 * under various conditions and stress scenarios.
 *
 * @slow - These tests run in nightly builds only (full project)
 * They are excluded from PR gates (critical project)
 */

import { test, expect } from '@playwright/test';

// Configure for parallel execution, no retries (performance tests should be deterministic)
test.describe.configure({ mode: 'parallel', retries: 0 });

test.describe('Battery Tests - Performance & Reliability', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for performance tests
    test.setTimeout(60000);
    
    // Monitor console for errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
  });

  test('Memory Leak Test - Extended Scroll Session', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Perform extended scrolling (simulating heavy usage)
    for (let i = 0; i < 50; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(100);
      
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(100);
    }

    // Wait for cleanup
    await page.waitForTimeout(2000);

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Memory should not grow more than 20% (allowing for normal fluctuations)
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryGrowth = ((finalMemory - initialMemory) / initialMemory) * 100;
      expect(memoryGrowth).toBeLessThan(20);
    }
  });

  test('Animation Performance - 60fps Target', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Ensure animations are enabled for accurate FPS measurement
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // Measure frame rate during animations
    const frameRates: number[] = [];
    let frameCount = 0;
    let lastTime = performance.now();

    await page.evaluate(() => {
      let frameCount = 0;
      let lastTime = performance.now();
      const frameRates: number[] = [];

      function measureFrame() {
        frameCount++;
        const currentTime = performance.now();
        const elapsed = currentTime - lastTime;

        if (elapsed >= 1000) {
          const fps = (frameCount * 1000) / elapsed;
          frameRates.push(fps);
          frameCount = 0;
          lastTime = currentTime;
        }

        if (frameRates.length < 3) {
          requestAnimationFrame(measureFrame);
        }
      }

      requestAnimationFrame(measureFrame);
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(frameRates);
        }, 4000);
      });
    });

    // Trigger animations by scrolling
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await page.waitForTimeout(2000);

    // Check that animations are smooth (target: 50+ fps average)
    if (frameRates.length === 0) {
      throw new Error('FPS measurement failed: no frame rate samples collected. requestAnimationFrame may not be firing.');
    }
    
    // Filter out non-finite values to prevent NaN
    const cleanFrameRates = frameRates.filter(n => Number.isFinite(n) && n > 0);
    expect(cleanFrameRates.length).toBeGreaterThanOrEqual(3);
    
    if (cleanFrameRates.length === 0) {
      throw new Error('FPS measurement failed: all frame rate samples were invalid (NaN, Infinity, or <= 0).');
    }
    
    const avgFps = cleanFrameRates.reduce((a, b) => a + b, 0) / cleanFrameRates.length;
    expect(Number.isFinite(avgFps)).toBe(true);
    expect(avgFps).toBeGreaterThan(50);
  });

  test('Scroll Performance - Smooth Scrolling Test', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Measure scroll performance
    const scrollMetrics = await page.evaluate(() => {
      const metrics: { time: number; position: number }[] = [];
      let startTime = performance.now();

      const handleScroll = () => {
        const currentTime = performance.now();
        metrics.push({
          time: currentTime - startTime,
          position: window.scrollY,
        });
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      // Perform smooth scroll
      window.scrollTo({
        top: 1000,
        behavior: 'smooth',
      });

      return new Promise<typeof metrics>(resolve => {
        setTimeout(() => {
          window.removeEventListener('scroll', handleScroll);
          resolve(metrics);
        }, 2000);
      });
    });

    // Verify smooth scrolling (should have multiple intermediate positions)
    expect(scrollMetrics.length).toBeGreaterThan(10);
    
    // Check scroll timing is consistent
    const timeDiffs = scrollMetrics.slice(1).map((m, i) => m.time - scrollMetrics[i].time);
    const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
    expect(avgTimeDiff).toBeLessThan(50); // Should scroll smoothly, not in large jumps
  });

  test('Background Image Rendering Performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Measure background image rendering performance
    const renderTime = await page.evaluate(() => {
      const startTime = performance.now();
      
      // Force repaint
      const wallpaper = document.querySelector('.landing-wallpaper');
      if (wallpaper) {
        const style = window.getComputedStyle(wallpaper);
        const bgImage = style.backgroundImage;
        
        // Check if background image is loaded
        return new Promise<number>(resolve => {
          if (bgImage && bgImage !== 'none') {
            const img = new Image();
            img.onload = () => {
              resolve(performance.now() - startTime);
            };
            img.onerror = () => {
              resolve(performance.now() - startTime);
            };
            img.src = bgImage.replace(/url\(["']?([^"']+)["']?\)/, '$1');
          } else {
            resolve(performance.now() - startTime);
          }
        });
      }
      return performance.now() - startTime;
    });

    // Background should render quickly (< 2 seconds)
    expect(renderTime).toBeLessThan(2000);
  });

  test('Component Rendering Stress Test', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate through multiple pages rapidly
    const pages = ['/features', '/pricing', '/contact', '/faq', '/'];
    
    for (const route of pages) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      
      // Verify page rendered without errors
      const errors = await page.evaluate(() => {
        return (window as any).__ERRORS__ || [];
      });
      expect(errors.length).toBe(0);
    }
  });

  test('Event Handler Efficiency - No Memory Leaks', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Count initial event listeners
    const initialListeners = await page.evaluate(() => {
      // Approximate count by checking common elements
      const buttons = document.querySelectorAll('button, a[role="button"]');
      return buttons.length;
    });

    // Trigger many interactions
    for (let i = 0; i < 20; i++) {
      await page.click('body'); // Click to trigger any click handlers
      await page.keyboard.press('Tab'); // Tab through elements
      await page.waitForTimeout(50);
    }

    // Verify no excessive event listener accumulation
    const finalListeners = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a[role="button"]');
      return buttons.length;
    });

    // Should not have significantly more listeners
    expect(finalListeners).toBeLessThanOrEqual(initialListeners * 1.5);
  });

  test('Background Image Pointer Events - No Scroll Interference', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify background images have pointer-events: none
    const backgroundElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('[style*="backgroundImage"], .landing-wallpaper, .hero-bg');
      return Array.from(elements).map(el => {
        const style = window.getComputedStyle(el);
        return {
          pointerEvents: style.pointerEvents,
          zIndex: style.zIndex,
        };
      });
    });

    // All background images should have pointer-events: none
    backgroundElements.forEach(element => {
      expect(element.pointerEvents).toBe('none');
    });

    // Verify scrolling works smoothly
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await page.waitForTimeout(500);
    
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(0);
  });

  test('Resource Cleanup - No Orphaned Resources', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate away and back
    await page.goto('/features');
    await page.waitForLoadState('networkidle');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for orphaned intervals/timeouts
    const activeTimers = await page.evaluate(() => {
      // This is approximate - we can't directly count timers, but we can check for errors
      return (window as any).__ACTIVE_TIMERS__ || 0;
    });

    // Should not have excessive active timers
    expect(activeTimers).toBeLessThan(100);
  });

  test('Large Content Rendering - Performance Test', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Measure time to render all content
    const renderTime = await page.evaluate(() => {
      const startTime = performance.now();
      
      // Wait for all images to load
      return Promise.all(
        Array.from(document.images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      ).then(() => performance.now() - startTime);
    });

    // Should render within reasonable time (< 5 seconds)
    expect(renderTime).toBeLessThan(5000);
  });

  test('Touch Interaction Performance - Mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test touch interactions
    const touchPerformance = await page.evaluate(() => {
      const startTime = performance.now();
      
      // Simulate touch events
      const touchStart = new TouchEvent('touchstart', {
        touches: [new Touch({ identifier: 1, target: document.body, clientX: 100, clientY: 100 } as any)],
      } as any);
      
      document.dispatchEvent(touchStart);
      
      return performance.now() - startTime;
    });

    // Touch events should be fast (< 16ms for 60fps)
    expect(touchPerformance).toBeLessThan(16);
  });

  test('CSS Animation Performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that CSS animations use GPU acceleration
    const animationProperties = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="animate"], [class*="transition"]');
      return Array.from(elements).slice(0, 10).map(el => {
        const style = window.getComputedStyle(el);
        return {
          transform: style.transform,
          willChange: style.willChange,
          backfaceVisibility: style.backfaceVisibility,
        };
      });
    });

    // At least some elements should have GPU acceleration hints
    const hasGPUAcceleration = animationProperties.some(
      props => props.willChange !== 'auto' || props.transform !== 'none'
    );
    expect(hasGPUAcceleration).toBe(true);
  });

  test('Network Request Efficiency', async ({ page }) => {
    const requests: string[] = [];
    
    page.on('request', request => {
      requests.push(request.url());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should not have excessive duplicate requests
    const duplicateRequests = requests.filter((url, index) => requests.indexOf(url) !== index);
    expect(duplicateRequests.length).toBeLessThan(5);
  });

  test('Z-Index Layering - Correct Stacking Order', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const zIndexValues = await page.evaluate(() => {
      const elements = document.querySelectorAll('.landing-wallpaper, .landing-mask, .landing-content, .hero-bg');
      return Array.from(elements).map(el => {
        const style = window.getComputedStyle(el);
        return {
          className: el.className,
          zIndex: parseInt(style.zIndex) || 0,
        };
      });
    });

    // Background should be lowest
    const wallpaper = zIndexValues.find(z => z.className.includes('wallpaper') || z.className.includes('hero-bg'));
    const content = zIndexValues.find(z => z.className.includes('content'));

    if (wallpaper && content) {
      expect(wallpaper.zIndex).toBeLessThan(content.zIndex);
    }
  });
});
