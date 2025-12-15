import { chromium, type Browser, type Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SCREENSHOT_DIR = join(process.cwd(), 'validation-screenshots');
const BASE_URL = 'http://127.0.0.1:4176';

async function takeScreenshot(page: Page, name: string, description: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name}-${timestamp}.png`;
  const filepath = join(SCREENSHOT_DIR, filename);
  
  await page.screenshot({ 
    path: filepath, 
    fullPage: true,
    animations: 'disabled'
  });
  
  console.log(`✅ ${description}: ${filename}`);
  return filepath;
}

async function validateHeroOverlay(page: Page) {
  console.log('\n📸 Validating Hero Overlay (40% opacity)...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Wait for animations
  
  // Check hero section
  const heroSection = page.locator('.hero-section, [data-testid="hero-bg"]').first();
  await heroSection.waitFor({ state: 'visible' });
  
  return await takeScreenshot(page, 'hero-overlay-40', 'Hero overlay at 40% opacity');
}

async function validateLandingMask(page: Page) {
  console.log('\n📸 Validating Landing Mask (65% overlay)...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check landing mask
  const landingMask = page.locator('.landing-mask');
  if (await landingMask.count() > 0) {
    await landingMask.first().waitFor({ state: 'visible' });
  }
  
  return await takeScreenshot(page, 'landing-mask-65', 'Landing mask at 65% overlay');
}

async function validateHeroTextShadows(page: Page) {
  console.log('\n📸 Validating Hero Text Shadows (Brand Orange)...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check hero text
  const heroText = page.locator('h1, .hero-headline, .hero-text').first();
  await heroText.waitFor({ state: 'visible' });
  
  return await takeScreenshot(page, 'hero-text-shadows', 'Hero text with brand orange shadows');
}

async function validateBackgroundImageLayering(page: Page) {
  console.log('\n📸 Validating Background Image Layering...');
  await page.goto(`${BASE_URL}/features`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Scroll to verify background doesn't interfere
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  
  return await takeScreenshot(page, 'background-layering', 'Background images at bottom layer');
}

async function validateMobileBackground(page: Page) {
  console.log('\n📸 Validating Mobile Background (Cover, no letterboxing)...');
  
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  return await takeScreenshot(page, 'mobile-background-cover', 'Mobile background using cover (no letterboxing)');
}

async function validateDesktopBackground(page: Page) {
  console.log('\n📸 Validating Desktop Background...');
  
  // Set desktop viewport
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  return await takeScreenshot(page, 'desktop-background', 'Desktop background layout');
}

async function validateMainLandmark(page: Page) {
  console.log('\n📸 Validating Main Landmark (Accessibility)...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check for main element
  const mainElement = page.locator('main#main-content[role="main"]');
  const count = await mainElement.count();
  console.log(`   Found ${count} main landmark(s)`);
  
  return await takeScreenshot(page, 'main-landmark', 'Top-level main landmark');
}

async function main() {
  console.log('🎬 Starting Validation Screenshots...\n');
  console.log(`📁 Screenshots will be saved to: ${SCREENSHOT_DIR}\n`);
  
  // Create screenshot directory
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Take all validation screenshots
    await validateHeroOverlay(page);
    await validateLandingMask(page);
    await validateHeroTextShadows(page);
    await validateBackgroundImageLayering(page);
    await validateMobileBackground(page);
    await validateDesktopBackground(page);
    await validateMainLandmark(page);
    
    console.log('\n✅ All validation screenshots captured!');
    console.log(`📁 Location: ${SCREENSHOT_DIR}`);
    
  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
