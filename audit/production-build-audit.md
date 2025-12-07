# Production Build Audit

**Date (UTC):** 2025-11-29 12:09:40
**Command:** `npm run build`

## Summary
- Vite production build completed successfully with post-build verification scripts (`verify:app`, `verify:icons`, `verify:console`).
- No blocking errors detected. Dynamic/static import notice for `src/lib/errorReporter.ts` observed; informative only and does not prevent bundling.
- Node runtime during audit: v20.19.5 (matches project requirement range).

## Build Output Highlights
- Build duration: ~14s; 2,355 modules transformed.
- Largest assets (pre-gzip): `BACKGROUND_IMAGE1` SVG (~1.0 MB) and main JS bundle (~315 KB, 89 KB gzip).

## Post-Build Verification
- `verify:app`: Passed (local probe at http://127.0.0.1:4176/).
- `verify:icons`: Passed (icon set validated).
- `verify:console`: Passed (no disallowed console usage detected).

## Observations
- npm emitted warnings for unknown env config `http-proxy`; informational and non-blocking. Consider cleaning npm config if noise is undesirable.
- Reporter noted `src/lib/errorReporter.ts` being both statically and dynamically imported; no action required unless chunking is needed.

