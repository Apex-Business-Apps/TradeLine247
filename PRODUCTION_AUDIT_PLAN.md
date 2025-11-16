# Production Audit Plan - autorepai

**Date**: 2025-01-16  
**Repository**: https://github.com/apexbusiness-systems/autorepai  
**Auditor**: Senior Full-Stack Engineer + SRE

---

## 1. Scope & Discovery Summary

### Repository Confirmation
✅ **Correct Repo**: `https://github.com/apexbusiness-systems/autorepai.git` (verified via `git remote -v`)

### Build Tooling
- **Framework**: Vite 5.4.19 + React 18.3.1 + TypeScript 5.8.3
- **Node Version**: 20.x (required)
- **Package Manager**: npm >=10.0.0
- **Bundler**: Vite (with Terser minification)
- **Mobile**: Capacitor 7.4.3 (iOS/Android support)
- **Backend**: Express.js server (`server.mjs`) for production serving

### Main App Entry Points
- **Primary**: `src/main.tsx` → `src/App.tsx`
- **Routing**: React Router v7.9.4 with route-based code splitting
- **Index Route**: Eagerly loaded (not lazy) for FCP optimization
- **Other Routes**: Lazy loaded for performance

### CI/CD Workflows
Located in `.github/workflows/`:
1. **ci.yml** - Main CI pipeline (build, lint, test, e2e, a11y, lighthouse)
2. **app-deploy.yml** - Vercel deployment (triggered on tags `stable-*`)
3. **security.yml** - Security gates (Twilio webhook validation)
4. **ios-build.yml** - iOS build pipeline
5. **release-ios.yml** - iOS release workflow
6. **db-migrate.yml** - Database migrations
7. **db-repair.yml** - Database repair operations
8. **codeql-analysis.yml** - CodeQL security scanning
9. **security-scan.yml** - Additional security scanning
10. **supabase-secrets-sync.yml** - Secrets synchronization
11. **status-bridge.yml** - Status reporting
12. **k6-smoke.yml** - Load testing
13. **ci-lighthouse.yml** - Lighthouse CI
14. **auto-merge-lovable.yml** - Auto-merge automation

### Test Setup
- **Unit/Integration**: Vitest 2.1.5 with jsdom
- **E2E**: Playwright 1.55.1
- **Coverage**: v8 provider with thresholds (80% lines/functions, 75% branches)
- **Test Scripts**: 
  - `npm test` - Local test run
  - `npm run test:ci` - CI test run
  - `npm run test:ci:coverage` - Coverage report

### Critical Production Surfaces

#### Build Pipeline
- **Build Command**: `npm run build` (Vite build)
- **Post-build**: `npm run verify:app && npm run verify:icons` (automatic)
- **Verification Scripts**:
  - `scripts/verify-app.cjs` - Validates built SPA
  - `scripts/verify_icons.mjs` - Validates icon assets
  - `scripts/verify-public-env.mjs` - Validates public env vars

#### Environment Configuration
- **Public Vars** (VITE_*): Supabase URL, anon key, project ID
- **Secret Vars**: Twilio credentials, Supabase service role key
- **Security Guard**: `ALLOW_INSECURE_TWILIO_WEBHOOKS` must be `false` in production
- **Validation**: `scripts/predeploy-security.sh` blocks insecure deployments

#### Error Logging / Monitoring
- **Error Observability**: `src/utils/errorObservability.ts` (production only)
- **Error Reporter**: `src/lib/errorReporter.ts` (localStorage + backend)
- **Performance Monitor**: `src/lib/performanceMonitor.ts` (Core Web Vitals)
- **Boot Sentinel**: `src/lib/bootSentinel.ts` (mount failure detection)
- **Web Vitals**: Custom telemetry via `/api/vitals` endpoint

#### Platform-Specific Configs
- **Mobile**: Capacitor config (`capacitor.config.ts`)
- **iOS**: Fastlane setup in `fastlane/` directory
- **PWA**: Service worker (`public/sw.js`), manifest
- **Server**: Express server with rate limiting, security headers

---

## 2. Audit Areas to Check

### Build
- [ ] Build scripts are sensible and not duplicative
- [ ] No known warnings or TODOs in build process
- [ ] Post-build verification works correctly
- [ ] Source maps configuration (currently disabled - verify if needed)
- [ ] Chunk splitting strategy is optimal

### Runtime / Production Config
- [ ] Environment variable usage is secure
- [ ] Error handling is comprehensive
- [ ] Feature flags are properly managed
- [ ] Edge cases are handled (network failures, timeouts)
- [ ] Rate limiting is properly configured
- [ ] Security headers are correct

### Tests
- [ ] Unit tests exist and are stable
- [ ] Integration tests cover critical paths
- [ ] E2E tests are not flaky
- [ ] Test coverage meets thresholds
- [ ] CI test execution is reliable

### CI/CD
- [ ] All workflows are valid and not broken
- [ ] Build, test, and deploy run correctly in automation
- [ ] Security gates are effective
- [ ] Status reporting works
- [ ] No unnecessary workflow runs

### Performance & Reliability
- [ ] No obvious bottlenecks
- [ ] Timeouts are reasonable
- [ ] Retry logic is present where needed
- [ ] Fallbacks exist for critical operations
- [ ] Memory leaks are prevented

---

## 3. Safety Constraints (Will Not Violate)

✅ Do not break the current working build  
✅ Be conservative with dependencies  
✅ No force pushes - only new branch + PR  
✅ No secret exposure  
✅ Idempotent changes only  
✅ Stop and document if unsure

---

## Next Steps

1. Perform full production audit (read-only)
2. Create Issue Register with all findings
3. Apply fixes only after audit is complete
4. Verify all changes with tests and build
5. Create PR with comprehensive summary

