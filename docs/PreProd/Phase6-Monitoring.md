# Phase 6: Monitoring & Alerting

**Status:** ⏳ PENDING  
**Date:** 2025-10-08

## Required Monitors

1. **Uptime:** 30-second checks on / (UptimeRobot/Checkly)
2. **Header Sentinel:** GitHub Actions every 5 min checking for X-Frame-Options
3. **Error Tracking:** Sentry for client/server errors (≥1% rate alert)
4. **Supabase Metrics:** DB CPU >80%, 5xx >1%, auth rate limits

## Setup
- Create monitoring accounts
- Configure alert recipients (email + Slack)
- Test alert delivery
- Document baselines

**Gate:** ✅ PASS when all 4 layers deployed and verified
