# Stage 32.2 — Apps Script integration

This directory contains a **staged backend patch only**. It is not automatically applied to production.

1. Add `Bridge.html` to Apps Script.
2. Add bridge functions from `Code.gs.patch`.
3. Change existing `doGet()` to `doGet(e)` and add the documented `?bridge=1` branch.
4. Add CONFIG key `PWA_ALLOWED_ORIGINS` = `https://appfathanmubina.github.io`.
5. Deploy a new Apps Script Web App version when integration QA is approved.
6. Test `/exec?bridge=1` before enabling authenticated PWA modules.

Security contract:
- Never allow `*` as an origin.
- Verify exact configured `event.origin` and require message source `psb-fm-pwa`. Apps Script HTML Service may wrap the Bridge in provider-owned browsing contexts, so the staged Bridge sends responses through `window.top` while retaining an exact PWA `targetOrigin` (never `*`).
- Require message source `psb-fm-pwa`.
- Dispatch only the explicit backend allowlist.
- Existing backend functions remain authoritative for session and role authorization.
- Session tokens are never placed in the iframe URL or Service Worker cache.
- Use existing `rpcSafe_()` for Date/object serialization.
- Internal helpers and raw data/config/Drive writers are not exposed.

No production Apps Script deployment is changed by this stage.