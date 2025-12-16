Baseline Build Record — 2025-12-15  
Stable Build Label: GOODBUILD-2025-12-15-4e01370

## Overview
- Purpose: lock in a known-good visual baseline restoring mobile/desktop hero wallpaper behavior from commit `4e01370` (“fix: build blocker + bg visibility + mobile viewport”).
- Branch: `main`
- Result: Build and typecheck succeeded locally; changes pushed to origin.

## Source of Truth
- Commit: `7911eb28` (push to `origin/main`)
- Change summary: revert visual/UI files to match commit `4e01370` while leaving all non-visual areas untouched.
- Scope (touched): `src/index.css`, `src/pages/Index.tsx`, `src/components/*`, `tailwind.config.ts`
- Explicitly untouched (per directive): `codemagic.yaml`, `package.json`, `package-lock.json`, `ios/`, `android/`, `supabase/`, `server/`, header/footer logic beyond visual revert, backend/API routes.

## Commands Executed
- `npm run build` — ✅ passed (vite production build; known dynamic import warning only)
- `npm run typecheck` — ✅ passed
- `git checkout 4e01370 -- src/index.css`
- `git checkout 4e01370 -- src/pages/Index.tsx`
- `git checkout 4e01370 -- src/components/`
- `git checkout 4e01370 -- tailwind.config.ts`
- `git add src/ tailwind.config.ts`
- `git commit -m "fix(urgent): revert visual files to 4e01370 - mobile bg fix for investor demo"`
- `git pull --rebase origin main`
- `git push origin HEAD:main`

## Build Output Snapshot
- Build tool: Vite v5.4.21
- Status: Success (`✓ built in ~11.7s`)
- Notable warning: vite reporter notes `src/lib/errorReporter.ts` is both statically and dynamically imported; pre-existing, no action taken.

## Expected Visual State (Baseline)
- Hero background shows AI receptionist face, non-repeating, with gradient overlay.
- `#app-home` / `.hero-bg` use scroll attachment and cover sizing consistent with 4e01370.
- Mobile viewport uses safe-height (`--vh-safe`) behavior; background fixed issues resolved.
- CTAs, header, and footer unchanged functionally; overlays and text shadows match the good commit.

## Manual Verification Checklist (to run post-deploy)
- Mobile and desktop: hero face visible, background not looping.
- Gradient overlay present; text remains legible.
- CTA buttons visible/clickable.
- Header/footer unchanged and functional.
- No visual regressions in dashboard/sections components.
- Vercel deploy reports “Ready”.

## Risks / Notes
- No dependency or native platform files touched.
- Warning about mixed static/dynamic import (errorReporter) remains; previously accepted.
- If future changes alter background assets, re-validate `#app-home` and `.hero-bg` rules.

## Next Actions
- Confirm Vercel deployment status for this commit.
- Capture mobile and desktop screenshots to attach to this record if desired.

