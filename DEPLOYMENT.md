# AutoRepAi Deployment Guide

## 🚀 Production Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, E2E)
- [ ] Security scan completed (no P0/P1 vulnerabilities)
- [ ] WCAG 2.2 AA accessibility audit passed
- [ ] Performance budgets met (LCP ≤ 2.5s, TTI ≤ 3.0s)
- [ ] Database migrations reviewed and tested on staging
- [ ] Secrets configured in production environment
- [ ] Compliance policies reviewed by legal
- [ ] Incident response team briefed

### Environment Setup

#### 1. Supabase Production Configuration

```bash
# Already connected to production Supabase project
# Project ID: niorocndzcflrwdrofsp
# URL: https://niorocndzcflrwdrofsp.supabase.co
```

**Required Secrets** (configure in Supabase Dashboard → Settings → Edge Functions):
- `AUTOVANCE_API_KEY` - Autovance DMS integration
- `DEALERTRACK_API_KEY` - Dealertrack integration credentials
- `DEALERTRACK_DEALER_ID` - Your Dealertrack dealer identifier
- `TWILIO_ACCOUNT_SID` - For SMS/WhatsApp (optional)
- `TWILIO_AUTH_TOKEN` - Twilio authentication
- `SENDGRID_API_KEY` - Email service (optional)
- `SENTRY_DSN` - Error tracking (optional)

#### 2. Web Deployment (Lovable Platform)

The app is deployed automatically via Lovable:

1. **Publish**: Click "Publish" button in Lovable editor
2. **Domain**: Configure custom domain in Project Settings → Domains
3. **Environment**: Production environment uses Supabase connection above

**Production URL**: 
- Staging: `https://8c580ccb-d2ed-4900-a1da-f3b4f211efc8.lovableproject.com`
- Custom: (Configure your domain)

#### 3. Mobile App Deployment

##### iOS (Apple App Store)

**Prerequisites**:
- Mac with Xcode 14+
- Apple Developer Account ($99/year)
- Provisioning profiles and certificates

**Steps**:
```bash
# 1. Export from Lovable to GitHub
# Click "Export to GitHub" in project settings

# 2. Clone and setup
git clone <your-github-repo>
cd autorepaica
npm install

# 3. Add iOS platform
npx cap add ios

# 4. Update dependencies
npx cap update ios

# 5. Build web assets
npm run build

# 6. Sync to iOS
npx cap sync ios

# 7. Open in Xcode
npx cap open ios

# 8. In Xcode:
# - Update Bundle Identifier (use your Apple Developer ID)
# - Select Development Team
# - Configure App Store Connect listing
# - Archive and upload to App Store Connect
```

**App Store Submission**:
1. Create app listing in App Store Connect
2. Upload screenshots (required sizes: 6.5", 5.5", 12.9")
3. Fill App Privacy questionnaire (data collection disclosure)
4. Submit for review (typically 24-48 hours)

##### Android (Google Play Store)

**Prerequisites**:
- Google Play Developer Account ($25 one-time)
- Android Studio installed
- Signing key generated

**Steps**:
```bash
# 1. Add Android platform
npx cap add android

# 2. Update dependencies
npx cap update android

# 3. Build web assets
npm run build

# 4. Sync to Android
npx cap sync android

# 5. Open in Android Studio
npx cap open android

# 6. Generate signed APK/AAB:
# Build → Generate Signed Bundle/APK
# - Create keystore (keep secure!)
# - Select "Android App Bundle" (required for Play Store)
# - Select release build variant
```

**Play Store Submission**:
1. Create app listing in Play Console
2. Upload AAB file to Internal Testing track first
3. Complete Store Listing (description, screenshots, category)
4. Fill Content Rating questionnaire
5. Set up pricing and distribution
6. Promote to Production when ready

### Post-Deployment

#### Health Checks

Monitor these endpoints:
- Frontend: `https://your-domain.com` (should return 200)
- API Health: `https://niorocndzcflrwdrofsp.supabase.co/rest/v1/` (should return API schema)
- Edge Functions: Check Supabase Dashboard → Functions → Logs

#### Monitoring Setup

1. **Supabase Dashboard**:
   - Database: Monitor connection pool, slow queries
   - Auth: Track signup/login rates, failures
   - Storage: Monitor usage and bandwidth
   - Functions: Check invocation rates, errors

2. **Performance** (optional Sentry setup):
   ```bash
   # Add to secrets if using Sentry
   SENTRY_DSN=your-sentry-dsn
   ```

3. **Compliance Audit**:
   - Review consent logs weekly: `SELECT * FROM consents ORDER BY created_at DESC LIMIT 100`
   - Export audit events monthly: `SELECT * FROM audit_events WHERE created_at > NOW() - INTERVAL '30 days'`

#### Security Headers

Ensure these headers are set (automatically configured in Lovable deployment):
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=(), microphone=()
```

### Rollback Procedure

If critical issues are detected:

1. **Web App**: Revert in Lovable editor using version history
2. **Database**: Restore from Supabase backup (Dashboard → Database → Backups)
3. **Mobile**: Cannot rollback client apps immediately (users must update)
   - Push hotfix build ASAP
   - Use feature flags to disable problematic features server-side

### Scaling Considerations

**Database**:
- Supabase Pro tier supports ~100k daily active users
- Monitor connection pool usage in Dashboard
- Add read replicas if read-heavy (contact Supabase support)

**Edge Functions**:
- Auto-scales with traffic
- Rate limits: 500 req/10s per IP by default
- Upgrade Supabase plan for higher limits

**CDN**:
- Static assets automatically cached globally via Lovable CDN
- 99.9% uptime SLA

### Compliance Reminders

- **Data Retention**: Review `audit_events` and `interactions` tables quarterly; archive/delete per retention policy
- **Consent Refresh**: Prompt users to reconfirm consent annually (CASL requirement)
- **Security Audits**: Annual penetration test recommended for dealer compliance
- **Privacy Policy**: Update and version in git; link from footer

### Support & Escalation

- **P0 (Critical)**: Follow RUNBOOK.md incident response
- **Supabase Issues**: support@supabase.com or Dashboard support chat
- **Lovable Platform**: Contact Lovable account manager
- **DMS Integrations**: Autovance/Dealertrack support portals

---

## Mobile Hot-Reload Development

For faster mobile development, the Capacitor config points to the Lovable sandbox:

```typescript
server: {
  url: 'https://8c580ccb-d2ed-4900-a1da-f3b4f211efc8.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

To test on device:
1. Ensure device is on same network (for local dev) OR use sandbox URL
2. `npx cap run ios` or `npx cap run android`
3. Changes in Lovable editor appear instantly on device

**Before Production Release**: Update `capacitor.config.ts` to remove `server.url` so app uses bundled assets.

---

Built with ❤️ • Last updated: 2025-10-01
