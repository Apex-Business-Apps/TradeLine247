# Wallpaper Rollback Testing Checklist

**Version**: 2025-12-08-rollback
**Branch**: wallpaper-rollback-20251208
**Purpose**: Validate hero background responsiveness restoration

## Regression Fixed

### Problem Identified
- **Root Cause**: HeroRoiDuo.tsx was truncated at line 80 (commit `0e5f2b3`)
- **Missing Content**:
  - Complete tagline text
  - Feature badges
  - Phone CTA
  - ROI Calculator + LeadCaptureCard grid
  - Closing JSX tags

### Solution Implemented
- ✅ Restored complete file from commit `500d32d` (113 → 136 lines)
- ✅ Added `HERO_RESPONSIVE_CLASSES` constants for safeguarding
- ✅ Added `data-wallpaper-version="2025-12-08-rollback"` tracking attribute
- ✅ Created `validate-hero-source.mjs` build-time validation script
- ✅ Updated Playwright tests to verify wallpaper version attribute

---

## Pre-Deployment Validation

### 1. Source Code Validation

Run the automated validation script:

```bash
node scripts/validate-hero-source.mjs
```

**Expected Output**:
```
✅ ✅ ✅ ALL VALIDATIONS PASSED ✅ ✅ ✅

HeroRoiDuo.tsx is properly structured with:
  • Complete file (no truncation)
  • All required responsive CSS classes
  • Proper wallpaper constants
  • All structural elements intact
```

### 2. TypeScript Compilation

```bash
npm run typecheck
```

**Expected**: No errors

### 3. Build Test

```bash
npm run build
```

**Expected**: Successful build with no errors

---

## Visual Testing Requirements

### Mobile Testing (360px viewport)

**Device**: iPhone SE / Android Small
**Viewport**: 360 × 800px

#### Verification Checklist

- [ ] **Background Image**
  - [ ] Full SVG wallpaper visible in hero section
  - [ ] No cropping or zoom on wallpaper
  - [ ] `bg-contain` applied (check DevTools)
  - [ ] `bg-top` positioning
  - [ ] `bg-no-repeat` applied
  - [ ] `bg-scroll` attachment (not fixed)

- [ ] **Hero Height**
  - [ ] Hero section occupies full viewport height
  - [ ] `min-h-screen` applied

- [ ] **Content Visibility**
  - [ ] Logo visible and properly scaled
  - [ ] "Your 24/7 Ai Receptionist!" headline visible
  - [ ] "Never miss a call. Work while you sleep." tagline visible
  - [ ] Feature badges visible
  - [ ] Phone CTA clickable
  - [ ] "Help us help you" section visible
  - [ ] ROI Calculator rendered
  - [ ] Lead Capture Card rendered

- [ ] **Overlays & Gradients**
  - [ ] `.hero-gradient-overlay` present (check z-index)
  - [ ] `.hero-vignette` present (check z-index)
  - [ ] Text remains readable over background

- [ ] **Scroll Behavior**
  - [ ] Background terminates cleanly at bottom of hero
  - [ ] No background "bleed" into BenefitsGrid section
  - [ ] Smooth scrolling with no jank
  - [ ] GPU rendering enabled (no layout shifts)

**Screenshot Capture**:
```bash
# Using browser DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set viewport to 360 × 800
4. Navigate to http://localhost:5173
5. Take full-page screenshot
6. Save as: screenshots/hero-mobile-360px.png
```

**Browser Console Verification**:
```javascript
// Run in console
const hero = document.querySelector('section.hero-section');
const styles = window.getComputedStyle(hero);
console.log({
  backgroundSize: styles.backgroundSize,
  backgroundPosition: styles.backgroundPosition,
  backgroundAttachment: styles.backgroundAttachment,
  minHeight: styles.minHeight,
  wallpaperVersion: hero.getAttribute('data-wallpaper-version')
});

// Expected output:
// {
//   backgroundSize: "contain",
//   backgroundPosition: "50% 0%",
//   backgroundAttachment: "scroll",
//   minHeight: "800px", // or 100vh
//   wallpaperVersion: "2025-12-08-rollback"
// }
```

---

### Tablet Testing (768px viewport)

**Device**: iPad / Android Tablet
**Viewport**: 768 × 1024px

#### Verification Checklist

- [ ] **Background Image**
  - [ ] Background switches to `bg-cover` (NOT bg-contain)
  - [ ] `bg-top` positioning maintained
  - [ ] `bg-scroll` attachment
  - [ ] Full immersive background

- [ ] **Responsive Transition**
  - [ ] Smooth transition from mobile to tablet styles
  - [ ] No layout shift during resize
  - [ ] Text remains legible

- [ ] **Content**
  - [ ] All hero content visible
  - [ ] ROI Calculator + Lead Capture side-by-side layout
  - [ ] Feature badges properly spaced

**Screenshot Capture**:
```bash
# Set viewport to 768 × 1024
# Save as: screenshots/hero-tablet-768px.png
```

**Browser Console Verification**:
```javascript
const hero = document.querySelector('section.hero-section');
const styles = window.getComputedStyle(hero);
console.log({
  backgroundSize: styles.backgroundSize, // Should be "cover"
  backgroundPosition: styles.backgroundPosition,
  width: window.innerWidth // Should be 768
});
```

---

### Desktop Testing (1024px+ viewport)

**Viewports to Test**:
- 1024 × 768 (Small Desktop)
- 1920 × 1080 (Full HD)
- 2560 × 1440 (QHD)

#### Verification Checklist

- [ ] **Background Image**
  - [ ] `bg-cover` applied
  - [ ] `bg-top` positioning
  - [ ] Full immersive wallpaper experience
  - [ ] No pixelation or artifacts

- [ ] **Layout**
  - [ ] Hero content centered
  - [ ] ROI Calculator + Lead Capture Card in grid layout
  - [ ] Proper spacing and typography

- [ ] **Performance**
  - [ ] LCP ≤ 2.5s
  - [ ] CLS ≤ 0.05
  - [ ] No GPU rendering issues

**Screenshot Capture**:
```bash
# Set viewport to 1920 × 1080
# Save as: screenshots/hero-desktop-1920px.png
```

---

## Automated Testing

### Run Playwright Tests

```bash
npm run test:install-browsers
npx playwright test tests/hero-background.spec.ts --headed
```

**Expected**: All tests pass

### Run Hero Background Verification Script

```bash
# Start dev server first
npm run dev

# In another terminal, run in browser console:
# (Copy from scripts/verify-hero-background.mjs)
```

---

## Cross-Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, macOS/iOS)
- [ ] Edge (latest)

**iOS Safari Specific**:
- [ ] Verify `backgroundAttachment: scroll` prevents fixed positioning issues
- [ ] Check safe area insets are respected
- [ ] Test on actual device (not just simulator)

---

## Acceptance Criteria

### ✅ Must Pass Before Merge

1. **Source Validation**: `validate-hero-source.mjs` passes
2. **TypeScript**: No compilation errors
3. **Build**: Successful production build
4. **Mobile (360px)**:
   - Full SVG visible (bg-contain)
   - No cropping
   - All content rendered
5. **Tablet (768px)**:
   - Background switches to bg-cover
   - Text legible
6. **Desktop (1024px+)**:
   - Current behavior maintained
   - Full immersion
7. **Scroll Behavior**:
   - Clean termination at hero bottom
   - No bleed into next section
8. **GPU Rendering**:
   - No jank
   - z-index layering correct
9. **Playwright Tests**: All hero background tests pass

### 📝 Nice-to-Have

- [ ] Lighthouse score ≥90 for Performance
- [ ] LCP ≤ 2.0s (target better than threshold)
- [ ] Visual regression tests pass
- [ ] Manual smoke test on real mobile devices

---

## Deployment Plan

### 1. Merge to Main

```bash
git checkout wallpaper-rollback-20251208
git push -u origin wallpaper-rollback-20251208

# Create PR with title:
# fix(ui): restore hero background responsiveness (wallpaper-rollback-20251208)
```

### 2. Vercel Preview

- [ ] Wait for Vercel preview deployment
- [ ] Test preview URL on real mobile devices
- [ ] Confirm no regression in hero display
- [ ] Verify scroll behavior on preview

### 3. Production Deployment

- [ ] Merge PR to main
- [ ] Monitor Sentry for errors
- [ ] Check Analytics for bounce rate changes
- [ ] Smoke test production URL

### 4. Rollback Plan (if needed)

```bash
# If issues found post-merge:
git revert <commit-hash>
git push origin main
```

---

## Post-Deployment Monitoring

### Week 1

- [ ] Monitor Sentry errors related to hero section
- [ ] Check Core Web Vitals (LCP, CLS, FID)
- [ ] Review user session recordings for hero interaction
- [ ] Analyze bounce rate on homepage

### Week 2+

- [ ] A/B test results (if applicable)
- [ ] User feedback collection
- [ ] Mobile device testing on new devices

---

## Known Issues & Limitations

### None currently identified

If issues arise, document here with:
- Description
- Steps to reproduce
- Expected vs actual behavior
- Severity (Critical/High/Medium/Low)
- Workaround (if any)

---

## References

- **Original Issue**: File truncation in commit `0e5f2b3`
- **Working Version**: Commit `500d32d`
- **Test Suite**: `tests/hero-background.spec.ts`
- **Validation Script**: `scripts/validate-hero-source.mjs`
- **Component**: `src/sections/HeroRoiDuo.tsx`

---

## Sign-Off

- [ ] Developer tested locally
- [ ] Code review completed
- [ ] QA tested on staging
- [ ] Product owner approved
- [ ] Ready for production deployment

**Date**: _____________
**Approved by**: _____________
