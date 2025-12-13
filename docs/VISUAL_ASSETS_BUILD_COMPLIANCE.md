# Visual Assets & Wallpaper - Build Compliance

**Date:** 2025-01-XX  
**Status:** ✅ **100% COMPLIANT WITH PLAYBOOK 3**  
**Requirement:** Visual & UX consistency checks integrated into build pipeline

---

## ✅ IMPLEMENTATION SUMMARY

Visual asset validation has been integrated into both iOS and Android build workflows per **Playbook 3 - Stable UI/UX & Backend Release Criteria**.

---

## 🔍 VISUAL ASSET VALIDATION IN BUILD

### **iOS Workflow**

**Location:** `codemagic.yaml` (after Quality gates, before Build web assets)

```yaml
- name: Verify visual assets
  script: |
    set -eo pipefail
    STRICT_ICONS=true npm run verify:icons
    node scripts/validate-hero-source.mjs
```

### **Android Workflow**

**Location:** `codemagic.yaml` (after Quality gates, before Playwright smoke)

```yaml
- name: Verify visual assets
  script: |
    set -eo pipefail
    STRICT_ICONS=true npm run verify:icons
    node scripts/validate-hero-source.mjs
```

---

## ✅ VALIDATION CHECKS IMPLEMENTED

### **1. Icon Verification** (`npm run verify:icons`)

**Script:** `scripts/verify_icons.mjs`

**Checks:**
- ✅ Master SVG exists: `public/assets/brand/icon_master.svg`
- ✅ Required PNG icons exist:
  - `icon-192.png`, `icon-512.png`
  - `maskable-192.png`, `maskable-512.png`
  - iOS icons: `iPhoneApp180.png`, `iPhoneSpotlight120.png`, `iPadApp152.png`, `iPadApp167.png`
  - iOS AppIcon: `icon-1024.png` (no alpha channel)
- ✅ Icon dimensions match specifications
- ✅ iOS AppIcon asset catalog structure correct

**Strict Mode:**
- When `STRICT_ICONS=true`, build **FAILS** if any icons are missing or invalid
- Production builds use strict mode to prevent broken app submissions

---

### **2. Hero/Wallpaper Validation** (`validate-hero-source.mjs`)

**Script:** `scripts/validate-hero-source.mjs`

**Checks:**
- ✅ Hero component file completeness (no truncation)
- ✅ Required responsive CSS classes present:
  - `min-h-screen`
  - `bg-contain`, `md:bg-cover`
  - `bg-top`, `bg-no-repeat`, `bg-scroll`
- ✅ Required imports present:
  - Background image import
  - Logo import
  - Component imports
- ✅ Wallpaper constants defined:
  - `HERO_RESPONSIVE_CLASSES`
  - `HERO_INLINE_STYLES`
  - `data-wallpaper-version` attribute
- ✅ Structural elements intact:
  - Hero gradient overlay
  - Hero vignette
  - Grid structure
- ✅ Component structure integrity

**Failure Behavior:**
- ❌ **Errors** → Build FAILS (critical issues)
- ⚠️ **Warnings** → Build continues (non-critical recommendations)

---

## 📋 PLAYBOOK 3 COMPLIANCE

### **Visual & UX Consistency Requirements**

| Playbook Requirement | Implementation | Status |
|---------------------|----------------|--------|
| **Design system consistency** | ✅ Lint + typecheck validates code patterns | ✅ |
| **Hero & landing views** | ✅ Hero validation ensures wallpaper/background integrity | ✅ |
| **Icon assets** | ✅ Icon verification ensures all required assets present | ✅ |
| **Visual assets validated** | ✅ Both checks run before build | ✅ |
| **Strict mode for production** | ✅ `STRICT_ICONS=true` enforced | ✅ |

**Compliance Score: 5/5 = 100%** ✅

---

## 🚨 BUILD FAILURE CONDITIONS

The build will **FAIL** if:

1. **Missing Icons** (STRICT_ICONS=true):
   - Any required icon file missing
   - Icon dimensions incorrect
   - iOS AppIcon with alpha channel

2. **Hero Component Errors**:
   - Missing required CSS classes
   - Missing wallpaper constants
   - Broken component structure
   - Truncated file

---

## ✅ BUILD SUCCESS CONDITIONS

The build will **PASS** if:

1. ✅ All required icons present and correctly sized
2. ✅ Hero component structure intact
3. ✅ All wallpaper constants present
4. ✅ Responsive CSS classes correct
5. ✅ No critical validation errors

---

## 📊 INTEGRATION POINT

### **Execution Order:**

```
iOS Workflow:
1. Install dependencies
2. Quality gates (lint, typecheck, unit tests)
3. ✅ Verify visual assets ← NEW
4. Playwright smoke tests
5. Build web assets
6. Sync Capacitor
7. Install CocoaPods
8. Set iOS version numbers
9. Configure code signing
10. Build archive and IPA

Android Workflow:
1. Install dependencies
2. Quality gates (lint, typecheck, unit tests)
3. ✅ Verify visual assets ← NEW
4. Playwright smoke tests
5. Set Android version numbers
6. Build Android App Bundle
```

---

## 🎯 VALIDATION OUTPUT

### **Success Output:**

```
✅ Icon set verified.
✅ ✅ ✅ ALL VALIDATIONS PASSED ✅ ✅ ✅

HeroRoiDuo.tsx is properly structured with:
  • Complete file (no truncation)
  • All required responsive CSS classes
  • Proper wallpaper constants
  • All structural elements intact
```

### **Failure Output:**

```
❌ ERROR: MISSING: public/assets/brand/icon-512.png
❌ Icon verification failed. Build cannot continue in strict mode.

OR

❌ ❌ ❌ VALIDATION FAILED ❌ ❌ ❌
ERRORS:
  ❌ Missing required CSS class: bg-contain
🚨 DO NOT DEPLOY - Hero component has critical issues!
```

---

## 🔧 MAINTENANCE

### **Adding New Visual Asset Checks:**

1. Create validation script in `scripts/`
2. Add to "Verify visual assets" step in `codemagic.yaml`
3. Ensure script exits with code 1 on errors
4. Document in this file

### **Updating Icon Requirements:**

1. Update `scripts/verify_icons.mjs` `mustExist` array
2. Update `dimChecks` object if dimensions change
3. Test with `STRICT_ICONS=true npm run verify:icons`

### **Updating Hero Validation:**

1. Update `scripts/validate-hero-source.mjs` validation rules
2. Test with `node scripts/validate-hero-source.mjs`
3. Update this documentation

---

## ✅ COMPLIANCE CHECKLIST

- [x] Icon verification integrated into build pipeline
- [x] Hero/wallpaper validation integrated into build pipeline
- [x] Strict mode enabled for production builds
- [x] Validation runs before assets are built
- [x] Build fails on critical visual asset issues
- [x] Both iOS and Android workflows validated
- [x] Playbook 3 requirements met

---

## 📝 RELATED DOCUMENTATION

- `docs/APPLE_ICON_WORKFLOW.md` - iOS icon generation workflow
- `docs/WALLPAPER_ROLLBACK_TESTING_CHECKLIST.md` - Wallpaper testing procedures
- `scripts/verify_icons.mjs` - Icon verification script
- `scripts/validate-hero-source.mjs` - Hero component validation script

---

**Status:** ✅ **100% COMPLIANT**  
**Last Updated:** 2025-01-XX  
**Verified By:** DevOps SRE / Software Architect

