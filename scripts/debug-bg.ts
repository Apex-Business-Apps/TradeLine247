import { chromium } from 'playwright';

async function debugBackgroundLayers() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the homepage
    await page.goto('http://localhost:4176/');
    await page.waitForLoadState('networkidle');

    // Collect background layer candidates
    const candidates = await page.evaluate(() => {
      const selectors = [
        '.landing-wallpaper',
        '.landing-mask',
        '.hero-bg',
        '.hero-gradient-overlay',
        '.hero-vignette',
        '[style*="background-image"]',
        '[style*="backgroundImage"]'
      ];

      const elements: any[] = [];

      selectors.forEach(selector => {
        const found = document.querySelectorAll(selector);
        found.forEach(el => {
          // Avoid duplicates
          if (!elements.some(e => e.element === el)) {
            const style = window.getComputedStyle(el);
            elements.push({
              selector,
              element: el,
              tagName: el.tagName,
              className: el.className,
              id: el.id,
              pointerEvents: style.pointerEvents,
              zIndex: style.zIndex,
              backgroundImage: style.backgroundImage,
              outerHTML: el.outerHTML.substring(0, 200) + '...'
            });
          }
        });
      });

      return elements;
    });

    console.log('Background layer candidates found:', candidates.length);
    console.log('='.repeat(80));

    // Filter for offenders
    const offenders = candidates.filter(el =>
      el.pointerEvents !== 'none' ||
      parseInt(el.zIndex) >= 10 ||
      el.backgroundImage === 'none'
    );

    if (offenders.length > 0) {
      console.log('OFFENDING ELEMENTS (pointer-events != none OR z-index >= 10 OR no background-image):');
      console.log('='.repeat(80));

      offenders.forEach((el, index) => {
        console.log(`\n${index + 1}. Selector: ${el.selector}`);
        console.log(`   Tag: ${el.tagName}`);
        console.log(`   Class: ${el.className || 'none'}`);
        console.log(`   ID: ${el.id || 'none'}`);
        console.log(`   pointer-events: ${el.pointerEvents}`);
        console.log(`   z-index: ${el.zIndex}`);
        console.log(`   background-image: ${el.backgroundImage.substring(0, 100)}...`);
        console.log(`   HTML: ${el.outerHTML}`);
      });
    } else {
      console.log('✅ No offending background layer elements found!');
    }

    console.log('\n' + '='.repeat(80));
    console.log('ALL BACKGROUND LAYER ELEMENTS:');
    console.log('='.repeat(80));

    candidates.forEach((el, index) => {
      console.log(`\n${index + 1}. Selector: ${el.selector}`);
      console.log(`   Tag: ${el.tagName}`);
      console.log(`   Class: ${el.className || 'none'}`);
      console.log(`   ID: ${el.id || 'none'}`);
      console.log(`   pointer-events: ${el.pointerEvents}`);
      console.log(`   z-index: ${el.zIndex}`);
      console.log(`   background-image: ${el.backgroundImage.substring(0, 100)}...`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugBackgroundLayers().catch(console.error);
