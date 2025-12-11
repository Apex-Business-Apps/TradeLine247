/**
 * Hero Background Verification Script
 * 
 * Run this in browser console to verify hero background implementation
 * 
 * Usage: Copy and paste into browser console on homepage
 */

(function verifyHeroBackground() {
  console.log('🔍 Hero Background Verification');
  console.log('================================\n');

  const heroSection = document.querySelector('section.hero-section');
  const appHome = document.querySelector('#app-home');

  if (!heroSection) {
    console.error('❌ Hero section not found!');
    return;
  }

  // Check hero section background
  const heroStyles = window.getComputedStyle(heroSection);
  const heroBgImage = heroStyles.backgroundImage;
  const heroBgSize = heroStyles.backgroundSize;
  const heroBgPosition = heroStyles.backgroundPosition;
  const heroBgAttachment = heroStyles.backgroundAttachment;
  const heroMinHeight = heroStyles.minHeight;

  console.log('✅ Hero Section Background:');
  console.log(`   Image: ${heroBgImage.includes('BACKGROUND_IMAGE1') ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Size: ${heroBgSize}`);
  console.log(`   Position: ${heroBgPosition}`);
  console.log(`   Attachment: ${heroBgAttachment}`);
  console.log(`   Min Height: ${heroMinHeight}\n`);

  // Check app-home does NOT have background
  const appHomeStyles = window.getComputedStyle(appHome);
  const appHomeBg = appHomeStyles.backgroundImage;

  console.log('✅ App Home Container:');
  console.log(`   Background: ${appHomeBg === 'none' ? '✅ None (correct)' : '❌ Has background (should be none)'}\n`);

  // Check responsive classes
  const viewportWidth = window.innerWidth;
  const heroClasses = heroSection.className;

  console.log('✅ Responsive Classes:');
  console.log(`   Viewport Width: ${viewportWidth}px`);
  console.log(`   Has bg-contain: ${heroClasses.includes('bg-contain') ? '✅' : '❌'}`);
  console.log(`   Has bg-cover: ${heroClasses.includes('bg-cover') ? '✅' : '❌'}`);
  console.log(`   Has bg-top: ${heroClasses.includes('bg-top') ? '✅' : '❌'}`);
  console.log(`   Has bg-scroll: ${heroClasses.includes('bg-scroll') ? '✅' : '❌'}`);
  console.log(`   Has min-h-screen: ${heroClasses.includes('min-h-screen') ? '✅' : '❌'}\n`);

  // Check overlays
  const gradientOverlay = heroSection.querySelector('.hero-gradient-overlay');
  const vignette = heroSection.querySelector('.hero-vignette');

  console.log('✅ Overlays & Gradients:');
  console.log(`   Gradient Overlay: ${gradientOverlay ? '✅ Present' : '❌ Missing'}`);
  console.log(`   Vignette: ${vignette ? '✅ Present' : '❌ Missing'}\n`);

  if (gradientOverlay) {
    const overlayZ = window.getComputedStyle(gradientOverlay).zIndex;
    console.log(`   Overlay Z-Index: ${overlayZ}`);
  }

  if (vignette) {
    const vignetteZ = window.getComputedStyle(vignette).zIndex;
    console.log(`   Vignette Z-Index: ${vignetteZ}\n`);
  }

  // Verify content visibility
  const headline = heroSection.querySelector('h1');
  const logo = heroSection.querySelector('img[alt*="Logo"]');

  console.log('✅ Content Visibility:');
  console.log(`   Headline: ${headline && headline.offsetParent !== null ? '✅ Visible' : '❌ Hidden'}`);
  console.log(`   Logo: ${logo && logo.offsetParent !== null ? '✅ Visible' : '❌ Hidden'}\n`);

  // Expected values based on viewport
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const isDesktop = viewportWidth >= 1024;

  console.log('✅ Expected Behavior:');
  if (isMobile) {
    console.log('   📱 Mobile Mode (< 768px)');
    console.log(`   Expected: bg-contain, bg-top, bg-scroll`);
    console.log(`   Actual Size: ${heroBgSize}`);
    console.log(`   Match: ${heroBgSize.includes('contain') ? '✅' : '❌'}`);
  } else if (isTablet) {
    console.log('   📱 Tablet Mode (768px - 1023px)');
    console.log(`   Expected: bg-cover, bg-top, bg-scroll`);
    console.log(`   Actual Size: ${heroBgSize}`);
    console.log(`   Match: ${heroBgSize.includes('cover') ? '✅' : '❌'}`);
  } else {
    console.log('   💻 Desktop Mode (≥ 1024px)');
    console.log(`   Expected: bg-cover, bg-top`);
    console.log(`   Actual Size: ${heroBgSize}`);
    console.log(`   Match: ${heroBgSize.includes('cover') ? '✅' : '❌'}`);
  }

  console.log('\n✅ Verification Complete!');
  console.log('📸 Take screenshots at: 360px, 768px, 1920px');
  console.log('📋 See docs/HERO_BACKGROUND_TESTING_CHECKLIST.md for full checklist');
})();





