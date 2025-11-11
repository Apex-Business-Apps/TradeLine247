# Color Contrast Fix Plan - WCAG 2 AA Compliance

## CRITICAL FAILURES

### Yellow Text Violations (7 instances) - BLOCKING CI
**Problem:** `text-yellow-600` (#ca8a04) = 2.8:1 contrast on white - FAILS WCAG AA (needs 4.5:1)
**Fix:** Replace with `text-amber-800` (#92400e) = 5.5:1 contrast ✓

1. Auth.tsx:376 - Password strength "Good"
2. Auth.tsx:377 - Password strength conditional
3. ops/MessagingHealth.tsx:72 - Warning badge
4. ops/MessagingHealth.tsx:79 - Rate badge
5. dashboard/ServiceHealth.tsx:70 - Warning icon
6. dashboard/ServiceHealth.tsx:84-85 - Warning badge
7. dashboard/ServiceHealth.tsx:101 - Warning badge

### Green Icon Violations (35 instances)
**Problem:** `text-green-500` = May not meet 4.5:1 ratio
**Fix:** Replace with `text-[hsl(142,85%,25%)]` (brand-green-dark) = 5.76:1 ✓

Priority files:
- Features.tsx:111
- Pricing.tsx:160
- ThankYou.tsx:32-33
- All integration pages (15 instances)
- ops/MessagingHealth.tsx:58,71,78
- ops/VoiceHealth.tsx (10 instances)
- dashboard/ServiceHealth.tsx:68,79-80,99
- dashboard/new/WelcomeHeader.tsx:167

### Status Badge Violations
**Files:** IntegrationsGrid.tsx, all integration pages
**Fix:** Use verified WCAG AA compliant colors

## EXECUTION ORDER

1. Fix yellow text (7 files) - HIGHEST PRIORITY
2. Fix green icons (35 instances across 12 files)
3. Add aria-hidden to decorative icons
4. Test with axe-core locally
5. Verify Lighthouse score

## VERIFICATION

```bash
npm run test:e2e -- tests/e2e/a11y-smoke.spec.ts
npm run lighthouse
```

Expected: 0 color-contrast violations
