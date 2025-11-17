# Production Release Playbook

**Version:** v0.1.0-prod-2025-10-30
**Date:** October 30, 2025
**Status:** Production Hardening Complete

## Quick Reference

```bash
# Emergency Rollback (if needed)
git revert -m 1 <merge_commit_sha>
git push origin main

# Or deploy previous tag
git checkout v0.1.0-prod-2025-10-30-pre
./deploy.sh

# Check production health
curl -I https://www.tradeline247ai.com/
curl -I https://www.tradeline247ai.com/compare
curl -I https://www.tradeline247ai.com/security
curl -I https://www.tradeline247ai.com/contact
```

## Pre-Deployment Checklist

- [ ] All CI checks passing (ci/build, ci/lint, ci/test, ci/lighthouse)
- [ ] Playwright smoke tests pass locally
- [ ] Manual smoke test of critical pages
- [ ] .env variables configured on hosting
- [ ] .htaccess deployed to production
- [ ] Service worker unregistered
- [ ] Error observability active

## Deployment Steps

### 1. Tag the Release

```bash
git tag -a v0.1.0-prod-2025-10-30 -m "Production hardening release"
git push origin v0.1.0-prod-2025-10-30
```

### 2. Deploy to Production

```bash
# Build production bundle
npm ci
npm run build

# Verify dist/
ls -la dist/index.html
ls -la dist/.htaccess

# Deploy (method depends on hosting)
# For IONOS/Apache: upload dist/ contents
# For Vercel: vercel --prod
```

### 3. Post-Deploy Verification

```bash
# Test critical pages (200 status)
curl -I https://www.tradeline247ai.com/
curl -I https://www.tradeline247ai.com/pricing
curl -I https://www.tradeline247ai.com/compare
curl -I https://www.tradeline247ai.com/security
curl -I https://www.tradeline247ai.com/contact

# Test direct navigation (no 404)
# Open in private browser window:
https://www.tradeline247ai.com/compare
https://www.tradeline247ai.com/security
https://www.tradeline247ai.com/contact

# Check console (F12) - should see:
# "[SW] Service worker unregistered"
# "[ERROR OBSERVABILITY] Initialized successfully"
# No red errors
```

### 4. Monitor

- [ ] Check Supabase dashboard (auth/DB activity)
- [ ] Monitor console errors (browser DevTools)
- [ ] Verify Lighthouse CI report uploaded
- [ ] Check error logs (if external service configured)

## Rollback Procedure

### Option 1: Revert Merge Commit

```bash
# Find the merge commit
git log --oneline --merges -10

# Revert it (use -m 1 for first parent)
git revert -m 1 <merge_commit_sha>
git push origin main

# Redeploy
npm ci && npm run build
# Upload dist/
```

### Option 2: Deploy Previous Tag

```bash
# Checkout previous known-good tag
git checkout v0.1.0-prod-2025-10-30-pre

# Rebuild and deploy
npm ci && npm run build
# Upload dist/
```

### Option 3: Hotfix Forward

```bash
# Create hotfix branch
git checkout -b hotfix/emergency-fix-$(date +%Y-%m-%d)

# Make minimal fix
# Test locally
npm run build && npm run preview

# Commit, push, create PR
git add .
git commit -m "hotfix: [description]"
git push origin HEAD

# Create PR, get approval, merge, deploy
```

## Health Checks

### Automated (CI)

- **ci/build**: Vite build succeeds, dist/index.html exists
- **ci/lint**: ESLint passes with max-warnings=0
- **ci/test**: Vitest unit tests + Playwright smoke tests pass
- **ci/lighthouse**: Performance ≥60%, Accessibility ≥90%, SEO ≥85%

### Manual (Post-Deploy)

1. **Page Load Test**
   - Open each critical page in private window
   - Verify content loads correctly
   - Check F12 console for errors

2. **Routing Test**
   - Direct navigate to /compare
   - Direct navigate to /security
   - Direct navigate to /contact
   - All should return 200, not 404

3. **PWA Test**
   - Check Application tab in DevTools
   - Should show "No service workers registered"
   - Prevents stale cache issues

4. **Error Observability Test**
   - Check console on page load
   - Should see "[ERROR OBSERVABILITY] Initialized successfully"
   - Intentionally cause error (e.g., click broken link)
   - Should see "[ERROR CAPTURE]" log

## Known Issues & Workarounds

### Issue: "Supabase disabled in this environment"

**Cause:** Missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` in `.env`

**Fix:**
```bash
# Add to .env (or hosting env vars)
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Or use alias:
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
```

### Issue: 404 on /compare, /security, /contact

**Cause:** Missing SPA rewrite rules on server

**Fix for Apache:**
```apache
# Ensure .htaccess is in root next to index.html
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /index.html [L]
```

**Fix for Vercel:**
```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### Issue: Stale app version after deploy

**Cause:** Service worker caching old version

**Fix:**
```javascript
// Already implemented in main.tsx
// Service worker is unregistered on boot
// Users will get fresh version on next visit
// Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

## Emergency Contacts

**Technical Lead:** [Your Name]
**DevOps:** [Team Contact]
**Hosting Support:** IONOS/Vercel Support
**Supabase Support:** support@supabase.com

## Post-Incident Review Template

```markdown
## Incident Summary
**Date:** YYYY-MM-DD
**Duration:** HH:MM
**Severity:** Low/Medium/High

## What Happened
[Description of the issue]

## Root Cause
[Technical cause]

## Resolution
[How it was fixed]

## Prevention
[What will prevent this in the future]

## Action Items
- [ ] Update monitoring
- [ ] Add test coverage
- [ ] Document workaround
```

## Version History

- **v0.1.0-prod-2025-10-30**: Production hardening
  - Node 20.x lock
  - All routes restored
  - SPA rewrites added
  - Playwright smoke tests
  - Lighthouse CI with budgets
  - Error observability
  - Service worker unregistered
