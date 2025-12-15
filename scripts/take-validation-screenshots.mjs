import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SCREENSHOT_DIR = join(process.cwd(), 'tmp', 'validation-screenshots');

// Create directory if it doesn't exist
mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for hero section to load
    await page.waitForSelector('.hero-section', { timeout: 10000 });
    await page.waitForTimeout(2000); // Additional wait for animations

    console.log('Taking full page screenshot...');
    await page.screenshot({
      path: join(SCREENSHOT_DIR, '01-full-page-desktop.png'),
      fullPage: true,
    });

    console.log('Taking hero section screenshot...');
    const heroSection = page.locator('.hero-section');
    await heroSection.screenshot({
      path: join(SCREENSHOT_DIR, '02-hero-section.png'),
    });

    console.log('Taking mobile viewport screenshot...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: join(SCREENSHOT_DIR, '03-mobile-viewport.png'),
      fullPage: true,
    });

    console.log('Taking tablet viewport screenshot...');
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: join(SCREENSHOT_DIR, '04-tablet-viewport.png'),
      fullPage: true,
    });

    // Check for background image visibility
    const bgImageVisible = await page.evaluate(() => {
      const wallpaper = document.querySelector('.landing-wallpaper');
      if (!wallpaper) return false;
      const style = window.getComputedStyle(wallpaper);
      return style.opacity === '1' && style.backgroundImage !== 'none';
    });

    console.log(`Background image visible: ${bgImageVisible}`);

    // Check hero text shadow color
    const heroTextShadow = await page.evaluate(() => {
      const h1 = document.querySelector('.hero-section h1');
      if (!h1) return null;
      const style = window.getComputedStyle(h1);
      return style.textShadow;
    });

    console.log(`Hero text shadow: ${heroTextShadow}`);

    console.log(`\n✅ Screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log('Files created:');
    console.log('  - 01-full-page-desktop.png');
    console.log('  - 02-hero-section.png');
    console.log('  - 03-mobile-viewport.png');
    console.log('  - 04-tablet-viewport.png');

  } catch (error) {
    console.error('Error taking screenshots:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

takeScreenshots();
