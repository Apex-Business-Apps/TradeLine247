# Landing Page Opacity & Translucency Values - Complete Reference

**Page**: `src/pages/Index.tsx`  
**Date**: 2025-12-15

---

## Global Landing Page Layers

### 1. **Landing Wallpaper** (`.landing-wallpaper`)
- **Location**: `src/pages/Index.tsx` line 67-72, `src/styles/landing.css` line 26-42
- **Opacity**: **100%** (`opacity: 1`)
- **Background Image**: `BACKGROUND_IMAGE1.svg`
- **Z-Index**: `-1` (bottom layer)
- **Pointer Events**: `none`
- **Background Attachment**: `scroll` (changed from `fixed`)

### 2. **Landing Mask** (`.landing-mask`)
- **Location**: `src/pages/Index.tsx` line 73-77, `src/styles/landing.css` line 44-52
- **Overlay Opacity**: **65%** (`hsl(var(--brand-orange-primary) / 0.65)`)
- **Z-Index**: `1`
- **Pointer Events**: `none`
- **Color**: Brand orange at 65% opacity

---

## Section-by-Section Opacity Values

### **Section 1: Hero Section** (`HeroRoiDuo`)

**Location**: `src/sections/HeroRoiDuo.tsx`

#### Hero Overlay Layers:
1. **Hero Orange Overlay** (inline style)
   - **Opacity**: **40%** (`hsl(var(--brand-orange-primary) / 0.4)`)
   - **Location**: Line 40-46
   - **Z-Index**: `-10`
   - **Position**: `absolute inset-0`

2. **Hero Gradient** (`.hero-gradient`)
   - **Status**: **DISABLED** (`display: none`)
   - **Location**: `src/index.css` line 1386-1389
   - **Z-Index**: N/A

3. **Hero Gradient Overlay** (`.hero-gradient-overlay`)
   - **Opacity**: **40%** (`hsl(var(--brand-orange-primary) / 0.4)`)
   - **Location**: `src/index.css` line 1397-1403
   - **Z-Index**: `1`
   - **Note**: Applied but may be hidden on landing page

4. **Hero Vignette** (`.hero-vignette`)
   - **Status**: **DISABLED** (`display: none`)
   - **Location**: `src/index.css` line 1434-1441
   - **Previous**: Dark radial gradient (removed for clarity)

#### Hero Content Elements:
5. **Logo Opacity**
   - **Opacity**: **80%** (`opacity-80` class)
   - **Location**: Line 61
   - **Element**: Official logo image

6. **Logo Drop Shadow**
   - **Shadow Opacity**: **10%** (`hsl(0 0% 0% / 0.1)`)
   - **Location**: Line 64
   - **Filter**: `drop-shadow(0 4px 8px hsl(0 0% 0% / 0.1))`

7. **Phone Number Button**
   - **Background**: `bg-white` (100% white, no opacity)
   - **Backdrop Blur**: `backdrop-blur-sm`
   - **Border**: `border-primary/20` (20% opacity)
   - **Location**: Line 87

8. **Hero Text Shadows**
   - **Shadow 1**: `rgba(255, 107, 53, 0.45)` = **45% brand orange**
   - **Shadow 2**: `rgba(255, 107, 53, 0.35)` = **35% brand orange**
   - **Location**: `src/index.css` lines 1829-1834, 1717-1734

---

### **Section 2: Benefits Grid** (`BenefitsGrid`)

**Location**: `src/components/sections/BenefitsGrid.tsx`

1. **Card Background**
   - **Opacity**: **80%** (`bg-card/80`)
   - **Backdrop Blur**: `backdrop-blur-sm`
   - **Hover**: `hover:bg-card` (100% opacity)
   - **Location**: Line 43

2. **Card Shadow on Hover**
   - **Shadow Opacity**: **10%** (`hover:shadow-primary/10`)
   - **Location**: Line 43

3. **Icon Background**
   - **Background**: `bg-[#FFE5D9]` (solid color, no opacity)
   - **Icon Shadow on Hover**: `group-hover:shadow-current/20` (20% opacity)
   - **Location**: Line 47

4. **Text Opacity**
   - **Subtitle**: `text-foreground/90` (90% opacity)
   - **Location**: Line 32

---

### **Section 3: Impact Strip** (`ImpactStrip`)

**Location**: `src/components/sections/ImpactStrip.tsx`

1. **Card Background**
   - **Opacity**: **90%** (`bg-background/90`)
   - **Backdrop Blur**: `backdrop-blur-sm`
   - **Hover**: `hover:bg-background/95` (95% opacity)
   - **Location**: Line 41
   - **Note**: Increased from 50% to 90% for WCAG contrast

2. **Icon Background Gradient**
   - **From**: `from-primary/20` (20% opacity)
   - **To**: `to-primary/5` (5% opacity)
   - **Location**: Line 45

---

### **Section 4: How It Works** (`HowItWorks`)

**Location**: `src/components/sections/HowItWorks.tsx`

1. **Text Opacity**
   - **Subtitle**: `text-foreground/90` (90% opacity)
   - **Location**: Line 26

2. **Icon Background**
   - **Background**: `bg-primary/10` (10% opacity)
   - **Hover**: `group-hover:bg-primary/20` (20% opacity)
   - **Location**: Line 43

---

### **Section 5: Quick Actions Card** (`QuickActionsCard`)

**Location**: `src/components/dashboard/QuickActionsCard.tsx`

*Note: Need to check this component for opacity values*

---

### **Section 6: Trust Badges Slim** (`TrustBadgesSlim`)

**Location**: `src/components/sections/TrustBadgesSlim.tsx`

1. **Section Border**
   - **Border Opacity**: **10%** (`border-white/10`)
   - **Backdrop Blur**: `backdrop-blur-sm`
   - **Location**: Line 11

---

### **Section 7: Lead Capture Form** (`LeadCaptureForm`)

**Location**: `src/components/sections/LeadCaptureForm.tsx`

1. **Success Card Background**
   - **From**: `from-green-50/80` (80% opacity)
   - **To**: `to-emerald-50/80` (80% opacity)
   - **Backdrop Blur**: `backdrop-blur-sm`
   - **Location**: Line 179

2. **Form Card Background**
   - **Opacity**: **95%** (`bg-card/95`)
   - **Backdrop Blur**: `backdrop-blur-sm`
   - **Border**: `border-primary/20` (20% opacity)
   - **Location**: Line 222

3. **Button Hover**
   - **Hover Opacity**: **90%** (`hover:opacity-90`)
   - **Location**: Line 362 (in LeadCaptureCard component)

---

### **Section 8: Lead Capture Card** (`LeadCaptureCard`)

**Location**: `src/components/sections/LeadCaptureCard.tsx`

1. **Success Card Background**
   - **From**: `from-green-50/80` (80% opacity)
   - **To**: `to-emerald-50/80` (80% opacity)
   - **Backdrop Blur**: `backdrop-blur-sm`
   - **Location**: Line 179

2. **Form Card Background**
   - **Opacity**: **95%** (`bg-card/95`)
   - **Backdrop Blur**: `backdrop-blur-sm`
   - **Border**: `border-primary/20` (20% opacity)
   - **Location**: Line 222

3. **Input Focus Ring**
   - **Ring Opacity**: `focus:ring-primary` (default, typically 100%)
   - **Border Hover**: `hover:border-primary/50` (50% opacity)
   - **Location**: Lines 250, 265, 279, 292

---

### **Section 9: Footer** (`Footer`)

**Location**: `src/components/layout/Footer.tsx`

1. **Partner Logo Background**
   - **Opacity**: **80%** (`bg-white/80`)
   - **Location**: Line 134

---

## Summary Table: All Opacity Values

| Section | Element | Opacity Value | Type | Location |
|---------|---------|--------------|------|----------|
| **Global** | Landing Wallpaper | **100%** | Image opacity | `landing.css:41` |
| **Global** | Landing Mask | **65%** | Orange overlay | `landing.css:51` |
| **Hero** | Hero Orange Overlay | **40%** | Orange overlay | `HeroRoiDuo.tsx:43` |
| **Hero** | Hero Gradient Overlay | **40%** | Orange overlay | `index.css:1400` |
| **Hero** | Logo | **80%** | Image opacity | `HeroRoiDuo.tsx:61` |
| **Hero** | Logo Shadow | **10%** | Black shadow | `HeroRoiDuo.tsx:64` |
| **Hero** | Text Shadow 1 | **45%** | Orange shadow | `index.css:1829` |
| **Hero** | Text Shadow 2 | **35%** | Orange shadow | `index.css:1829` |
| **Hero** | Button Border | **20%** | Primary border | `HeroRoiDuo.tsx:87` |
| **Benefits** | Card Background | **80%** | Card opacity | `BenefitsGrid.tsx:43` |
| **Benefits** | Card Hover Shadow | **10%** | Primary shadow | `BenefitsGrid.tsx:43` |
| **Benefits** | Icon Hover Shadow | **20%** | Current shadow | `BenefitsGrid.tsx:47` |
| **Benefits** | Subtitle Text | **90%** | Foreground | `BenefitsGrid.tsx:32` |
| **Impact** | Card Background | **90%** | Background | `ImpactStrip.tsx:41` |
| **Impact** | Card Hover | **95%** | Background | `ImpactStrip.tsx:41` |
| **Impact** | Icon Gradient From | **20%** | Primary | `ImpactStrip.tsx:45` |
| **Impact** | Icon Gradient To | **5%** | Primary | `ImpactStrip.tsx:45` |
| **HowItWorks** | Subtitle Text | **90%** | Foreground | `HowItWorks.tsx:26` |
| **HowItWorks** | Icon Background | **10%** | Primary | `HowItWorks.tsx:43` |
| **HowItWorks** | Icon Hover | **20%** | Primary | `HowItWorks.tsx:43` |
| **TrustBadges** | Border | **10%** | White border | `TrustBadgesSlim.tsx:11` |
| **LeadCapture** | Success Card From | **80%** | Green-50 | `LeadCaptureForm.tsx:179` |
| **LeadCapture** | Success Card To | **80%** | Emerald-50 | `LeadCaptureForm.tsx:179` |
| **LeadCapture** | Form Card | **95%** | Card | `LeadCaptureForm.tsx:222` |
| **LeadCapture** | Form Border | **20%** | Primary | `LeadCaptureForm.tsx:222` |
| **LeadCapture** | Input Hover Border | **50%** | Primary | `LeadCaptureCard.tsx:250` |
| **LeadCapture** | Button Hover | **90%** | Button opacity | `LeadCaptureCard.tsx:362` |
| **Footer** | Logo Background | **80%** | White | `Footer.tsx:134` |

---

## Key Findings

### Highest Opacity Values:
- **Landing Wallpaper**: 100% (fully visible)
- **Form Card**: 95% (nearly opaque)
- **Impact Cards**: 90% (high opacity for contrast)
- **Hero Text Shadow**: 45% (strongest shadow)

### Lowest Opacity Values:
- **Icon Gradient End**: 5% (very subtle)
- **Logo Shadow**: 10% (subtle depth)
- **Icon Background**: 10% (subtle highlight)
- **Trust Badge Border**: 10% (subtle separation)

### Most Common Opacity Values:
- **80%**: Logo, Benefits cards, Success cards, Footer logos
- **90%**: Impact cards, Subtitles
- **40%**: Hero overlays
- **20%**: Borders, Icon gradients start, Hover effects

---

## Notes

1. **Hero Section**: Uses 40% orange overlay (inline) + 40% orange overlay (CSS class) - may be redundant
2. **Hero Vignette**: Disabled (`display: none`) to show wallpaper clearly
3. **Hero Gradient**: Disabled (`display: none`) - no longer used
4. **Impact Cards**: Increased from 50% to 90% for WCAG contrast compliance
5. **All cards**: Use `backdrop-blur-sm` for glass morphism effect
6. **Text shadows**: Use brand orange at 45% and 35% opacity for depth
