# OMNiLiNK MANIFESTO (LITE)

## 1. Purpose

OMNiLiNK is the **integration bus** for the APEX ecosystem.  
This app has a **single, optional OMNiLiNK port** so it can publish/consume events without being hard‑coupled.

This document explains **why** the port exists and **how** to use it safely.

## 2. Principles

1. **Optional by default**  
   The app must run correctly with OMNiLiNK off or unreachable.

2. **Single integration port**  
   All OMNiLiNK logic lives behind one adapter/client module instead of being scattered.

3. **No secrets in code**  
   All keys/URLs live in env/config, never in the repo.

4. **Observable**  
   There is a healthcheck (endpoint or CLI) to see if OMNiLiNK is disabled/ok/error.

5. **Reversible**  
   Turning OMNiLiNK off is as simple as flipping an env flag and redeploying.

## 3. This App’s OMNiLiNK Port

- **APP_NAME:** TradeLine 24/7  
- **Primary role:** AI receptionist platform (voice/SMS + dashboard)  
- **OMNiLiNK role:**  
  - Publishes: operational events (e.g., call/session/task events) when enabled  
  - Consumes: future shared settings or directives (none required today)

- **Port location:** `src/integrations/omnlink/`  
- **Main entry:** `OmniLinkClient.ts` (exported via `src/integrations/omnlink/index.ts`)  
- **Key methods:** `isEnabled()`, `sendEvent(...)`, `healthCheck(...)`

## 4. How to Enable OMNiLiNK (For Admins)

1. **Get OMNiLiNK details** from your APEX / OMNiLiNK account.  
2. **Set env vars** (names used here):
   - `OMNILINK_ENABLED=true`
   - `OMNILINK_BASE_URL=...`
   - `OMNILINK_TENANT_ID=...`
   - Any extra keys documented in `docs/OMNILINK_ENABLEMENT_GUIDE.md`.

3. **Deploy / restart** the app.  
4. **Run the healthcheck**:
   - CLI: `npm run omnlink:health`  
   - or HTTP: `https://<your-app>/health/omnlink`

5. Confirm the healthcheck reports OMNiLiNK as **enabled/ok**.

If something is wrong, set `OMNILINK_ENABLED=false`, redeploy, and the app will behave as before.

## 5. Safety & Rollback

- When OMNiLiNK is **disabled**, the port should no‑op and not affect core features.  
- When **enabled but misconfigured**, the app should still boot; only the healthcheck and logs should show errors.  
- To fully disable OMNiLiNK:
  1. Set `OMNILINK_ENABLED=false` (or remove OMNiLiNK env vars).  
  2. Redeploy / restart.  
  3. Confirm healthcheck reports “disabled (OK)”.

## 6. Engineer Reference

- **Adapter module:** `src/integrations/omnlink/OmniLinkClient.ts`  
- **Types:** `src/integrations/omnlink/types.ts`  
- **Tests:** `src/integrations/omnlink/__tests__/omnlink.test.ts`  
- **Healthcheck:** `/health/omnlink` (HTTP) or `npm run omnlink:health` (CLI)  

Keep this section in sync when you update the OMNiLiNK port.

