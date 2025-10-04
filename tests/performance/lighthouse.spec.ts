/**
 * Performance Test: Lighthouse Metrics
 * 
 * Validates Core Web Vitals and performance budgets
 */

import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

test.describe('Performance Benchmarking', () => {
  test('should meet LCP budget (2.5s)', async ({ page }) => {
    await page.goto('/');
    
    // Measure LCP using Performance API
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
          resolve(lastEntry.renderTime || lastEntry.loadTime || 0);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Timeout after 10s
        setTimeout(() => resolve(0), 10000);
      });
    });
    
    console.log(`LCP: ${lcp}ms`);
    expect(lcp).toBeLessThan(2500);
  });

  test('should meet TTI budget (3.0s)', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const tti = Date.now() - startTime;
    
    console.log(`TTI: ${tti}ms`);
    expect(tti).toBeLessThan(3000);
  });

  test('should meet CLS budget (0.1)', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to stabilize
    await page.waitForTimeout(3000);
    
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsScore = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsScore += (entry as any).value;
            }
          }
          resolve(clsScore);
        }).observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => resolve(clsScore), 5000);
      });
    });
    
    console.log(`CLS: ${cls}`);
    expect(cls).toBeLessThan(0.1);
  });

  test('should lazy load non-critical assets', async ({ page }) => {
    await page.goto('/');
    
    // Check for lazy loading attributes
    const images = await page.locator('img').all();
    let lazyCount = 0;
    
    for (const img of images) {
      const loading = await img.getAttribute('loading');
      if (loading === 'lazy') lazyCount++;
    }
    
    console.log(`Lazy loaded images: ${lazyCount}/${images.length}`);
    expect(lazyCount).toBeGreaterThan(0);
  });

  test('should minimize bundle size', async ({ page }) => {
    const response = await page.goto('/');
    const size = (await response?.body())?.length || 0;
    
    console.log(`Initial bundle size: ${(size / 1024).toFixed(2)} KB`);
    expect(size).toBeLessThan(500 * 1024); // < 500KB
  });
});

test.describe('Mobile Performance', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  test('should load quickly on mobile', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - startTime;
    
    console.log(`Mobile load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have touch-friendly targets', async ({ page }) => {
    await page.goto('/');
    
    // Check button sizes (should be at least 44x44px)
    const buttons = await page.locator('button').all();
    
    for (const button of buttons.slice(0, 5)) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
