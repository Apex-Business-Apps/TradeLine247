# A3 — Preview & Restore Sanity Report

**Date:** 2025-10-05  
**Build:** v4-20251005-embed-fix  
**Status:** ⚠️ PENDING MANUAL VERIFICATION

## Testing Scope

This report covers the validation of:
1. **Current build** in Preview (should render without frame-block errors)
2. **Restored "stable" builds** in Preview (should also render with correct headers)

## Code-Level Verification

### Files Modified in Embed Fix
✅ All critical files contain the correct embed-friendly configuration:

| File | Status | Key Changes |
|------|--------|------------|
| `public/sw.js` | ✅ Verified | X-Frame-Options removed, frame-ancestors allow-list added, cache bumped to `v4-embed-fix` |
| `index.html` | ✅ Verified | X-Frame-Options meta tag removed, CSP meta tag has correct frame-ancestors |
| `tests/security/embed-gate.spec.ts` | ✅ Created | Automated regression tests for headers and SW cache |
| `.github/workflows/ci.yml` | ✅ Updated | CI blocks builds that fail embed gate |
| `docs/EMBED_FIX_REPORT.md` | ✅ Created | Full documentation of root cause and fix |

### Expected Behavior

**Current Build:**
- ✅ Renders in Lovable Preview iframe
- ✅ No console errors like "Refused to display in a frame"
- ✅ Response headers show correct CSP, no X-Frame-Options

**Restored Builds:**
Once the fix is deployed and merged:
- ✅ Restoring ANY past build should apply the current SW and headers
- ✅ Service Worker scope covers all routes → even restored builds get protected
- ✅ No frame-block errors on restored builds

## Manual Testing Protocol

### Test 1: Current Build in Preview

**Steps:**
1. Open current build in Lovable Preview (you're viewing it now)
2. Open DevTools → Console
3. Look for errors containing: `"Refused to display"`, `"X-Frame-Options"`, or `"frame-ancestors"`
4. Open DevTools → Network → Reload page
5. Click root document request (`/` or `/index.html`)
6. Inspect Response Headers

**Expected Results:**
```
✅ Page renders (no blank screen)
✅ No frame-block errors in console
✅ Headers:
   - Content-Security-Policy present with frame-ancestors 'self' https://*.lovable.dev https://*.lovableproject.com https://*.lovable.app
   - X-Frame-Options: [absent]
   - X-Content-Type-Options: nosniff
   - Strict-Transport-Security: present
```

**If Test Fails:**
- Perform hard refresh (Ctrl+Shift+R)
- Check Service Worker status (DevTools → Application → Service Workers)
- Verify cache name includes `embed-fix`
- If still failing, unregister SW and clear cache

### Test 2: Restored Build #1 (Recent "Stable" Build)

**Steps:**
1. In Lovable chat history, identify a recent build (e.g., from yesterday)
2. Click "Restore" on that build
3. Wait for restore to complete
4. Open restored build in Preview
5. Repeat DevTools inspection (Console + Network)

**Expected Results:**
```
✅ Restored build renders in Preview
✅ No frame-block errors
✅ Headers match current build (same CSP, no X-Frame-Options)
```

**Why This Works:**
- Service Worker at `/sw.js` has application-wide scope
- Even restored builds fetch the current SW
- Current SW applies fixed headers to all responses
- Cache version mismatch triggers SW update immediately

### Test 3: Restored Build #2 (Older "Stable" Build)

**Steps:**
1. Identify an older stable build (e.g., from last week)
2. Click "Restore"
3. Open in Preview
4. Repeat DevTools inspection

**Expected Results:**
```
✅ Even old builds render in Preview
✅ Headers from current SW applied
✅ No frame-block errors
```

**Edge Case to Watch:**
If an old build had a DIFFERENT SW registration (different scope or file location), it might conflict. Solution:
- Unregister all SWs
- Hard refresh
- New SW takes over

## Regression Prevention

### Automated Testing
**File:** `tests/security/embed-gate.spec.ts`

Four test cases prevent regressions:
1. ✅ X-Frame-Options header must NOT be present
2. ✅ CSP must include correct frame-ancestors allow-list
3. ✅ Security baseline headers must be present
4. ✅ Service Worker cache must include `embed-fix` marker

**CI Integration:**
**File:** `.github/workflows/ci.yml` (embed-gate job)
- Runs on every PR and push to main/develop
- Blocks merge if any test fails
- Prevents accidental reintroduction of X-Frame-Options

### Manual Checklist (Pre-Release)

Before deploying to production:
- [ ] Run `npm run test:e2e` locally - embed-gate tests pass
- [ ] Test current build in Preview - renders without errors
- [ ] Test one restored build - also renders
- [ ] Check DevTools Network → Headers - no X-Frame-Options
- [ ] Verify Service Worker cache name includes `embed-fix`
- [ ] Check CI status - embed-gate job passed
- [ ] Review security scan results - no new issues

## Known Issues & Workarounds

### Issue: "Preview still blank after fix"

**Cause:** Service Worker cached old headers (stale cache)

**Solutions:**
1. **Hard refresh:** Ctrl+Shift+R / Cmd+Shift+R
2. **Unregister SW:**
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => 
     regs.forEach(r => r.unregister())
   );
   location.reload();
   ```
3. **Clear site data:** DevTools → Application → Clear storage
4. **Fresh profile test:** Use Chrome/Edge with `--user-data-dir=/tmp/test`

### Issue: "Restored build has different headers"

**Cause:** Restored build might have a conflicting SW registration

**Solution:**
- The current SW should override old SWs (same scope, newer version)
- If not, manually unregister and reload
- File a bug if restore doesn't pick up current SW

### Issue: "CI embed-gate test fails"

**Cause:** Code change reintroduced X-Frame-Options or broke frame-ancestors

**Solution:**
- Review PR diff - check `public/sw.js` and `index.html`
- Run tests locally: `npm run test:e2e tests/security/embed-gate.spec.ts`
- Fix and re-run CI

## Test Results Template

Use this template for manual testing:

```markdown
## Test Run: [Date]

### Current Build
- Preview URL: [URL]
- Renders: ✅ / ❌
- Frame-block errors: ✅ None / ❌ [error message]
- X-Frame-Options header: ✅ Absent / ❌ Present: [value]
- CSP frame-ancestors: ✅ Correct / ❌ [actual value]
- SW cache name: ✅ embed-fix / ❌ [actual name]

### Restored Build #1
- Build ID: [ID or date]
- Preview URL: [URL]
- Renders: ✅ / ❌
- Frame-block errors: ✅ None / ❌ [error message]
- Headers: ✅ Match current / ❌ Different

### Restored Build #2
- Build ID: [ID or date]
- Preview URL: [URL]
- Renders: ✅ / ❌
- Frame-block errors: ✅ None / ❌ [error message]
- Headers: ✅ Match current / ❌ Different

### CI Status
- embed-gate job: ✅ Passed / ❌ Failed
- Test run link: [CI URL]

### Notes
[Any observations, edge cases, or issues discovered]
```

## Next Steps

### Immediate Actions (User)
1. **Manual verification required:**
   - Open current Preview
   - Check DevTools Console for errors
   - Check DevTools Network for headers
   - Document results in test template above

2. **Restore test:**
   - Restore 2 previous stable builds
   - Test each in Preview
   - Confirm both render without errors

3. **Fresh session test:**
   - Open in incognito or fresh browser profile
   - Verify SW installs correctly
   - Check cache name includes `embed-fix`

### Follow-Up (If Issues Found)
- If current build renders but restored builds fail → investigate SW scope conflicts
- If headers still wrong → check for CDN/proxy injecting headers
- If CI tests fail → review code changes for regressions
- If nothing works → escalate with evidence (screenshots, console logs, HAR file)

## Code References

- **Service Worker:** `public/sw.js`
- **HTML Entry:** `index.html`
- **Test Suite:** `tests/security/embed-gate.spec.ts`
- **CI Config:** `.github/workflows/ci.yml` (embed-gate job)
- **Root Cause Analysis:** `docs/EMBED_FIX_REPORT.md`
- **Security Fix Doc:** `docs/security/CREDIT_APP_SECURITY_FIX.md` (separate issue)

## Conclusion

✅ **Code-level verification complete:**
- All files contain correct embed-friendly configuration
- Automated tests prevent regressions
- CI blocks broken builds

⚠️ **Manual verification pending:**
- User must test current build in live Preview
- User must test 2 restored builds
- Results must be documented using template above

**Once manual testing confirms all 3 scenarios pass (current + 2 restored builds), the embed fix is fully validated and production-ready.**
