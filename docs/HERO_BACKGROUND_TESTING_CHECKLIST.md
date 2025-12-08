# Hero Background Responsiveness - Testing Checklist

**Branch**: `wallpaper-rollback-20251208`  
**Date**: 2025-12-08  
**Status**: Ready for Visual Verification

## ✅ Code Implementation Verified

- [x] Background removed from `#app-home` div in `Index.tsx`
- [x] Background scoped to `HeroRoiDuo` section only
- [x] Responsive Tailwind classes applied:
  - Mobile: `bg-contain bg-top bg-no-repeat bg-scroll`
  - Tablet+: `md:bg-cover md:bg-top`
  - Height: `min-h-screen lg:min-h-screen`
- [x] CSS conflict resolved (removed `background: transparent` override)
- [x] Overlays and gradients preserved
- [x] No linter errors

## 📱 Visual Testing Checklist

### Mobile (360px width) - iPhone SE / Small Android

**Screenshot Required**: `/screenshots/mobile-360px-hero.png`

- [ ] **Background Image**: Entire SVG wallpaper is visible (no cropping/zooming)
- [ ] **Background Size**: Uses `contain` - full image fits within viewport
- [ ] **Background Position**: Positioned at top (`bg-top`)
- [ ] **Background Attachment**: Scrolls with page (not fixed)
- [ ] **Hero Height**: Minimum full screen height (`min-h-screen`)
- [ ] **No Bleed**: Background ends cleanly at bottom of hero section
- [ ] **Text Readability**: Hero headline "Your 24/7 Ai Receptionist!" is clearly readable
- [ ] **Logo Visibility**: Logo is visible and properly positioned
- [ ] **Overlay**: Orange gradient overlay is visible but doesn't obscure content
- [ ] **Vignette**: Subtle vignette effect is present
- [ ] **Next Section**: BenefitsGrid section has NO background image (clean transition)

**DevTools Verification**:
```javascript
// Run in browser console
const hero = document.querySelector('section.hero-section');
const styles = window.getComputedStyle(hero);
console.log({
  backgroundSize: styles.backgroundSize, // Should be "contain"
  backgroundPosition: styles.backgroundPosition, // Should contain "top"
  backgroundAttachment: styles.backgroundAttachment, // Should be "scroll"
  minHeight: styles.minHeight // Should be >= 600px
});
```

### Tablet (768px width) - iPad Portrait

**Screenshot Required**: `/screenshots/tablet-768px-hero.png`

- [ ] **Background Size**: Switches to `cover` (immersive fill)
- [ ] **Background Position**: Still at top (`bg-top`)
- [ ] **Background Attachment**: Scrolls with page
- [ ] **Hero Height**: Full screen height maintained
- [ ] **Text Readability**: All hero text remains legible
- [ ] **Image Quality**: Background image scales properly without pixelation
- [ ] **No Bleed**: Background ends at hero bottom, no leak to next section

**DevTools Verification**:
```javascript
const hero = document.querySelector('section.hero-section');
const styles = window.getComputedStyle(hero);
console.log({
  backgroundSize: styles.backgroundSize, // Should be "cover"
  backgroundPosition: styles.backgroundPosition, // Should contain "top"
  backgroundAttachment: styles.backgroundAttachment // Should be "scroll"
});
```

### Desktop (1920px width) - Full HD

**Screenshot Required**: `/screenshots/desktop-1920px-hero.png`

- [ ] **Background Size**: Uses `cover` for full immersion
- [ ] **Background Position**: Top-aligned (`bg-top`)
- [ ] **Hero Height**: Full screen height (`min-h-screen`)
- [ ] **Visual Match**: Matches Dec 4, 2025 build behavior
- [ ] **Performance**: No jank or rendering issues
- [ ] **GPU Rendering**: Smooth scrolling, no repaints
- [ ] **Z-Index Layering**: Content above overlays, overlays above background

**DevTools Verification**:
```javascript
const hero = document.querySelector('section.hero-section');
const styles = window.getComputedStyle(hero);
console.log({
  backgroundSize: styles.backgroundSize, // Should be "cover"
  backgroundPosition: styles.backgroundPosition, // Should contain "top"
  minHeight: styles.minHeight // Should be >= 600px
});

// Check z-index layering
const overlay = hero.querySelector('.hero-gradient-overlay');
const vignette = hero.querySelector('.hero-vignette');
const content = hero.querySelector('.container');
console.log({
  overlayZ: window.getComputedStyle(overlay).zIndex, // Should be "1"
  vignetteZ: window.getComputedStyle(vignette).zIndex, // Should be "2"
  contentZ: window.getComputedStyle(content).zIndex // Should be "10"
});
```

## 🔍 Scroll Behavior Testing

**Screenshot Required**: `/screenshots/scroll-behavior.png`

- [ ] **Scroll Down**: Background image scrolls with hero section
- [ ] **No Fixed Attachment**: Background doesn't stay fixed on mobile
- [ ] **Clean Transition**: Background ends exactly at hero bottom
- [ ] **No Bleed**: Next section (BenefitsGrid) has no background image
- [ ] **Smooth Scrolling**: No jank or stuttering during scroll

**Test Steps**:
1. Load homepage
2. Scroll slowly down past hero section
3. Verify background ends cleanly
4. Verify next section has no background

## 🎨 Overlay & Gradient Verification

**Screenshot Required**: `/screenshots/overlays-verified.png`

- [ ] **Gradient Overlay**: Orange overlay (`rgba(255, 107, 53, 0.20)`) is visible
- [ ] **Vignette**: Subtle dark vignette effect is present
- [ ] **Opacity**: Overlays don't obscure hero text
- [ ] **Z-Index**: Correct layering (background < overlay < vignette < content)

## ⚡ Performance Verification

- [ ] **LCP**: Largest Contentful Paint ≤ 2.5s
- [ ] **CLS**: Cumulative Layout Shift ≤ 0.05
- [ ] **No Console Errors**: Check browser console for errors
- [ ] **Image Load**: Background image loads without errors
- [ ] **GPU Acceleration**: Uses GPU for background rendering (check in DevTools Layers panel)

**Performance Test**:
```javascript
// Run in browser console after page load
const perfData = performance.getEntriesByType('navigation')[0];
console.log({
  domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
  loadComplete: perfData.loadEventEnd - perfData.loadEventStart
});

// Check for background image load
const bgImage = new Image();
bgImage.src = '/src/assets/BACKGROUND_IMAGE1.svg';
bgImage.onload = () => console.log('Background image loaded successfully');
bgImage.onerror = () => console.error('Background image failed to load');
```

## 🚫 Regression Testing

### Must NOT Break

- [ ] **Hero Content**: All text, buttons, logo remain functional
- [ ] **Layout Structure**: No layout shifts or broken components
- [ ] **Other Pages**: Secondary pages unaffected (no background on non-hero pages)
- [ ] **Mobile Navigation**: Header/navigation still works
- [ ] **Forms**: ROI calculator and lead capture forms functional
- [ ] **Animations**: Hero animations still work (fade-in, etc.)

## 📸 Screenshot Comparison

Compare screenshots against Dec 4, 2025 build:

1. **Mobile (360px)**: Should show full SVG wallpaper, no cropping
2. **Tablet (768px)**: Should show immersive cover background
3. **Desktop (1920px)**: Should match previous production build

## ✅ Final Verification

- [ ] All mobile tests pass
- [ ] All tablet tests pass  
- [ ] All desktop tests pass
- [ ] Scroll behavior verified
- [ ] Overlays verified
- [ ] Performance metrics acceptable
- [ ] No regressions detected
- [ ] Screenshots captured and reviewed

## 🚀 Deployment Readiness

- [ ] Code reviewed
- [ ] Tests passing
- [ ] Visual verification complete
- [ ] Screenshots documented
- [ ] Ready for merge to main
- [ ] Vercel preview URL: `_________________`

---

**Testing Instructions**:

1. Start dev server: `npm run dev`
2. Open browser DevTools
3. Test each breakpoint (360px, 768px, 1920px)
4. Capture screenshots at each breakpoint
5. Test scroll behavior
6. Verify overlays and gradients
7. Check performance metrics
8. Document any issues

**Automated Tests**: Run `npm run test:e2e -- tests/hero-background.spec.ts`

