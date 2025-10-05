# Phase 5: Rollback & Restore Verification Playbook

**Purpose:** Verify rollback mechanisms work correctly and document procedures for production incidents.

---

## Rollback Scenarios

### Scenario 1: Bad Deployment (Immediate)

**Timeline:** 0-15 minutes after deployment

**Indicators:**
- 🚨 Spike in error rate (>10% of requests)
- 🚨 User reports of blank screens
- 🚨 Headers incorrect in production spot-checks
- 🚨 Automated monitoring alerts

**Immediate Actions:**

1. **Stop Traffic (if possible):**
   ```bash
   # If using load balancer
   # Route traffic to previous version
   ```

2. **Revert via Lovable Version History:**
   - Open Lovable editor
   - Click Edit History icon (top)
   - Find last known good version
   - Click "Restore"
   - Wait for rebuild

3. **Alternative: Git Revert:**
   ```bash
   # Identify bad commit
   git log --oneline -n 5
   
   # Revert bad commit
   git revert <commit-hash>
   git push origin main
   
   # Trigger deployment pipeline
   ```

4. **Force Service Worker Clear (Emergency):**
   - Add kill-switch to HTML temporarily:
   ```html
   <!-- Add to index.html head temporarily -->
   <script>
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.getRegistrations().then(regs => {
       regs.forEach(reg => reg.unregister());
       setTimeout(() => window.location.reload(), 100);
     });
   }
   </script>
   ```

5. **Communicate:**
   - Post status update: "Investigating issue, rolling back deployment"
   - Notify team in Slack/Discord
   - Update status page if external

**Success Criteria:**
- [ ] Error rate returns to baseline (<1%)
- [ ] No new user reports of issues
- [ ] Headers correct in spot-checks
- [ ] Monitoring alerts resolved

---

### Scenario 2: Gradual Degradation (Hours)

**Timeline:** 1-6 hours after deployment

**Indicators:**
- ⚠️ Slow increase in error rate
- ⚠️ Some users report issues, others don't
- ⚠️ Headers correct but SW adoption slow

**Analysis Actions:**

1. **Check SW Adoption Rate:**
   ```javascript
   // Run in browser console on production
   caches.keys().then(names => console.log(names));
   // Look for old cache names still present
   ```

2. **Review Logs:**
   - Filter for SW registration errors
   - Check CDN logs for cache hits on old SW
   - Review user agent distribution

3. **Segment Users:**
   - New vs. returning users
   - Browser type and version
   - Geographic distribution

**Mitigation (if not critical):**

1. **Accelerate SW Update:**
   ```javascript
   // Aggressive update check in src/main.tsx
   if ('serviceWorker' in navigator) {
     setInterval(() => {
       navigator.serviceWorker.getRegistrations().then(regs => {
         regs.forEach(reg => reg.update());
       });
     }, 60000);  // Check every minute temporarily
   }
   ```

2. **User Communication:**
   - In-app banner: "New version available. Refresh to update."
   - Provide manual refresh instructions

3. **Monitor Adoption:**
   - Track SW version distribution
   - Set target: 90% adoption in 24 hours

**Rollback Decision Tree:**
```
Is error rate > 5%?
├─ YES → Full rollback (Scenario 1)
└─ NO → Continue with accelerated update
       ├─ Is adoption progressing?
       │  ├─ YES → Monitor, wait for natural adoption
       │  └─ NO → Consider rollback
       └─ Are errors user-impacting?
          ├─ YES → Rollback
          └─ NO → Accept and document
```

---

## Lovable-Specific Restore Procedures

### Restoring via Edit History

**Steps:**

1. **Access History:**
   - Open project in Lovable editor
   - Click clock/history icon in top nav
   - Scroll to find stable version

2. **Identify Stable Version:**
   - Look for commit message: "feat: Implement regression gates..." (current stable)
   - Check timestamp matches last known good deployment
   - Preview if unsure

3. **Restore:**
   - Click "Restore" button on chosen version
   - Lovable rebuilds project from that point
   - Wait for build completion (2-5 minutes)

4. **Verify:**
   - Check preview pane loads correctly
   - Open DevTools > Network > Headers
   - Confirm correct headers applied
   - Test key user flows

**Limitations:**
- ⚠️ Restoring loses all commits after restored point
- ⚠️ Service Worker cache may still serve old version in user browsers
- ⚠️ Users must hard refresh to see restored version

---

### Restoring via GitHub

**Steps:**

1. **Find Last Known Good Commit:**
   ```bash
   git log --oneline --decorate
   # Find commit before issue introduced
   ```

2. **Create Rollback Branch:**
   ```bash
   git checkout -b rollback-to-stable
   git reset --hard <good-commit-hash>
   git push origin rollback-to-stable --force
   ```

3. **Trigger Lovable Sync:**
   - Lovable auto-syncs from GitHub
   - Or manually trigger via Lovable UI
   - Wait for rebuild

4. **Verify in Lovable Preview:**
   - Check preview loads
   - Verify headers
   - Test functionality

**When to Use GitHub Rollback:**
- ✅ You have GitHub integration enabled
- ✅ You need to preserve git history
- ✅ You want to create a rollback branch for review

---

## Historical Build Testing

### Test Plan: Two Stable Builds

**Objective:** Verify historical builds can be restored and work in both embedded and top-level preview.

#### Build A: Pre-Embed-Fix (Historical)

**Commit:** `ce8cffe` - "feat: Implement regression gates and monitors"  
**Expected Headers:**
- ❌ X-Frame-Options: DENY (old behavior)
- ❌ CSP frame-ancestors: 'none' (old behavior)

**Test Steps:**

1. **Restore Build A:**
   - In Lovable, restore to commit `ce8cffe`
   - Wait for rebuild

2. **Test Embedded Preview:**
   - Open Lovable preview pane (right side)
   - **Expected:** ❌ Blank screen (X-Frame-Options blocks embedding)
   - Open DevTools console
   - **Expected:** Error: "Refused to display in a frame..."

3. **Test Top-Level Preview:**
   - Copy staging URL
   - Open in new tab (not embedded)
   - **Expected:** ✅ App loads (X-Frame-Options doesn't affect top-level)

4. **Document Results:**
   - Screenshot of blank embedded preview
   - Screenshot of console error
   - Screenshot of working top-level preview

**Conclusion:** Historical build confirms embed issue existed.

---

#### Build B: Post-Embed-Fix (Current Stable)

**Commit:** `HEAD` - "feat: Fix embed headers and add gates"  
**Expected Headers:**
- ✅ X-Frame-Options: ABSENT
- ✅ CSP frame-ancestors: Lovable domains

**Test Steps:**

1. **Restore Build B:**
   - In Lovable, restore to latest commit
   - Wait for rebuild
   - Hard refresh Lovable editor (Ctrl+Shift+R)

2. **Test Embedded Preview:**
   - Open Lovable preview pane
   - **Expected:** ✅ App loads correctly
   - Open DevTools > Network > Doc > Headers
   - **Expected:** No X-Frame-Options, CSP has frame-ancestors

3. **Test Top-Level Preview:**
   - Copy staging URL
   - Open in new tab
   - **Expected:** ✅ App loads correctly

4. **Test Clean Browser Profile:**
   - Open new incognito window
   - Navigate to staging URL
   - **Expected:** ✅ App loads with correct headers (no cached old SW)

**Conclusion:** Current build works in all environments.

---

### Restore Verification Matrix

| Build | Embedded Preview | Top-Level | Clean Profile | Status |
|-------|----------------|-----------|---------------|--------|
| Pre-Embed-Fix (ce8cffe) | ❌ Blank | ✅ Works | ✅ Works | Expected |
| Post-Embed-Fix (HEAD) | ✅ Works | ✅ Works | ✅ Works | ✅ PASS |

**Key Insight:** Embed issue only affects preview iframe, not direct URL access.

---

## Production Rollback Procedures

### Pre-Rollback Checklist

- [ ] Confirm issue is deployment-related (not external)
- [ ] Identify last known good version
- [ ] Notify stakeholders of impending rollback
- [ ] Take snapshot of current logs/metrics
- [ ] Document issue for post-mortem

### Rollback Execution

1. **Trigger Rollback:**
   - Via Lovable: Restore to stable version
   - Via GitHub: Revert commit and push
   - Via CI/CD: Redeploy previous tag/version

2. **Force Cache Clear:**
   ```bash
   # If using CDN (e.g., Cloudflare)
   curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
     -H "Authorization: Bearer {api_token}" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
   ```

3. **Monitor Rollback:**
   - Watch error rate drop
   - Check user reports cease
   - Verify headers in production

4. **User Communication:**
   - In-app: "Issue resolved. Please refresh."
   - Email: "We've resolved the issue. No action needed."
   - Status page: "Incident resolved"

### Post-Rollback

- [ ] Issue post-mortem document
- [ ] Identify root cause
- [ ] Update runbook if new scenario
- [ ] Add regression test if applicable
- [ ] Plan fix for rolled-back change

---

## Service Worker Persistence Issues

### Problem: Old SW Cached in Users' Browsers

**Even after rollback, some users still see old version due to SW cache.**

**Solutions:**

1. **Natural Attrition (Passive):**
   - Wait for users to naturally hard refresh
   - SW updates on next visit after 24 hours (default behavior)
   - Acceptable for non-critical issues

2. **Aggressive Update (Active):**
   ```javascript
   // Add to src/main.tsx temporarily
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.getRegistrations().then(regs => {
       regs.forEach(reg => {
         reg.update();  // Force update check
         reg.unregister();  // Nuclear option
       });
     });
   }
   ```

3. **User Instructions:**
   - Provide clear instructions: "Press Ctrl+Shift+R to refresh"
   - Include GIF/video showing hard refresh
   - Send push notification if app supports it

---

## Rollback Testing Schedule

### Quarterly Rollback Drills

**Objective:** Ensure team can execute rollback quickly under pressure.

**Procedure:**

1. **Pre-Drill:**
   - Schedule 30-minute drill
   - Notify team (don't notify users - staging only)
   - Prepare "bad" commit to rollback

2. **During Drill:**
   - Deploy "bad" commit to staging
   - Set timer: 15 minutes to complete rollback
   - Follow rollback playbook
   - Document any friction points

3. **Post-Drill:**
   - Review rollback time (target: <10 minutes)
   - Update playbook if steps unclear
   - Celebrate success or document improvements

**Next Drill:** 2025-04-01

---

## Escalation Procedures

### Severity Levels

**P0 - Critical (Production Down):**
- Complete site outage
- All users affected
- **Response:** Immediate rollback, all hands on deck

**P1 - High (Major Feature Broken):**
- Key functionality broken (e.g., checkout, login)
- Subset of users affected
- **Response:** Rollback within 30 minutes

**P2 - Medium (Minor Feature Broken):**
- Non-critical feature broken
- Small subset of users affected
- **Response:** Rollback or hotfix within 2 hours

**P3 - Low (Cosmetic Issue):**
- Visual bug, no functional impact
- **Response:** Fix in next release, no rollback

### Escalation Chain

1. **Developer** - Identifies issue, attempts quick fix
2. **Tech Lead** - Decides rollback vs. hotfix (15 min SLA)
3. **CTO** - Escalated if P0/P1 and no resolution path
4. **CEO** - Escalated if customer-facing communication needed

---

## Communication Templates

### Internal: Slack Announcement

```
🚨 PRODUCTION INCIDENT
Severity: P1
Issue: [Brief description]
Impact: [User-facing impact]
Action: Rolling back to [version]
ETA: [time]
War room: [Zoom link]
```

### External: Status Page Update

```
We're investigating reports of [issue]. Our team is working on a fix.

Update (5 minutes later):
We've identified the issue and are rolling back to a stable version. 
ETA: [time]

Update (15 minutes later):
Rollback complete. The issue is resolved. Please refresh your browser.
```

### User-Facing: In-App Banner

```
⚠️ We've resolved a technical issue. Please refresh the page to ensure 
you're on the latest version. [Refresh Now Button]
```

---

## Rollback Success Criteria

- [ ] Error rate returns to baseline (<1%)
- [ ] No new user reports of the issue
- [ ] Headers verified correct in production
- [ ] Key user flows tested and functional
- [ ] Monitoring alerts resolved
- [ ] Post-mortem scheduled
- [ ] Communication sent to users (if applicable)

---

## Post-Mortem Template

**Incident:** [Title]  
**Date:** [Date]  
**Duration:** [Start time] - [End time]  
**Severity:** [P0/P1/P2/P3]

**Timeline:**
- HH:MM - Issue detected
- HH:MM - Rollback initiated
- HH:MM - Rollback completed
- HH:MM - Verified resolved

**Root Cause:**
[What caused the issue]

**Resolution:**
[How it was resolved]

**Action Items:**
- [ ] [Prevent recurrence action 1]
- [ ] [Improve detection action 2]
- [ ] [Faster response action 3]

**Lessons Learned:**
[What we learned from this incident]

---

## References

**Internal:**
- `docs/B3-SW-Release-Checklist.md` - SW deployment procedures
- `docs/P4-SW-Checklist.md` - SW freshness checks
- `docs/EMBED_FIX_REPORT.md` - Historical embed issue

**External:**
- [Incident Response Best Practices](https://response.pagerduty.com/)
- [Google SRE Book - Incident Management](https://sre.google/sre-book/managing-incidents/)

---

**Last Updated:** 2025-01-05  
**Next Review:** After any production incident
