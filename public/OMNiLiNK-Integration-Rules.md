# APEX OMNiLiNK Port Rules (Per-App, Cursor-Safe)

ROLE  
You are working inside an APEX ecosystem app that can connect to the **OMNiLiNK hub**.

This app exposes or will expose a **single OMNiLiNK Port** – a small integration module that handles all communication with OMNiLiNK.

Your job when asked to work on OMNiLiNK is to:
- Keep the Port **optional by default**.
- Keep its behavior **consistent** with other APEX apps.
- Avoid touching unrelated code.

These rules are safe to commit and describe only app-side behavior.

---

## 1. Port Location & Structure

- The OMNiLiNK Port lives under:

  - `src/integrations/omnlink/` (or an equivalent path appropriate for this stack).

- Inside that folder, expect or create:

  - `config`   → reads env/config and decides whether OMNiLiNK is:
    - `enabled`
    - `disabled`
    - `misconfigured`
  - `types`    → defines `OmniLinkEvent` and any related types used by this app.
  - `adapter`  → `OmniLinkAdapter` or `OmniLinkClient`, with a small, clear API.
  - `index`    → re-exports the adapter/config/types as the single public surface.

You should always route OMNiLiNK interactions through this Port, not scatter them across the codebase.

---

## 2. Env & Config (Standard Names)

The app MUST use these environment variables as the single source of truth:

- `OMNILINK_ENABLED`    → `"true"` / `"false"`
- `OMNILINK_BASE_URL`   → URL of the OMNiLiNK hub
- `OMNILINK_TENANT_ID`  → tenant id / routing id for this app

Behavior:

- If `OMNILINK_ENABLED` is false or missing:
  - The Port is **disabled**, and the app should behave exactly as if OMNiLiNK did not exist.
- If `OMNILINK_ENABLED` is true:
  - The Port expects a valid base URL and tenant id.
  - Missing values = “enabled but misconfigured”.

Do not hard-code secrets or URLs.

---

## 3. Adapter Behavior

The adapter (e.g. `OmniLinkAdapter`) should:

- Expose a small API, for example:

  - `isEnabled(): boolean`
  - `sendEvent(event: OmniLinkEvent): Promise<void>`
  - Optional helpers: `syncOnce()`, `pullUpdates()`, etc.

- When the Port is **disabled**:
  - `isEnabled()` returns false.
  - Other methods should be safe no-ops (or log a low-noise warning).
  - The rest of the app must keep working.

- When the Port is **enabled & configured**:
  - Use `OMNILINK_BASE_URL` and `OMNILINK_TENANT_ID` from config.
  - Follow the existing HTTP/client patterns in this repo.

Do not introduce a second, parallel integration path; everything goes through this one adapter.

---

## 4. Health & Verification

If the app has an HTTP server:

- Add or maintain `GET /health/omnlink` that returns JSON like:

  ```json
  {
    "status": "disabled" | "ok" | "error",
    "details": {
      "enabled": true/false,
      "baseUrlConfigured": true/false,
      "tenantConfigured": true/false
    }
  }
