# Tahap 7 — API Bridge Hardening

## Purpose

Connect the GitHub Pages PWA to the existing Apps Script backend without using
`google.script.run` from the PWA itself.

Architecture:

`GitHub Pages PWA → hidden Apps Script Bridge iframe → google.script.run → backend`

## Transport

- PWA and Apps Script communicate with `postMessage`.
- The bridge validates the immediate parent window.
- The bridge accepts only configured GitHub Pages origins.
- The PWA validates the bridge content origin before accepting responses.
- Requests are correlated with IDs and have timeouts.
- Session tokens are not placed in the bridge URL.
- Service Worker continues to cache only the static app shell.

## Backend allowlist

The Stage 31 frontend invokes 76 server functions. Stage 32.2 exposes those
functions through an explicit allowlist, plus read-only `getAppInfo` for
diagnostics.

The backend remains responsible for authentication, session validation,
authorization, data isolation, mutations, Drive operations, and audit rules.

## Tahap 7 hardening status

Current bridge hardening includes exact configured HTTPS origin validation, parent-window binding, request ID/function-name validation, argument-count guard, request correlation, timeout/reset handling, and backend function allowlist enforcement.

See `docs/TAHAP_7_API_BRIDGE_HARDENING.md` for the locked hardening contract.

## Production safety

The backend changes are stored under `backend/` as a staged patch. They are
**not deployed to the production Apps Script application by this commit**.

The existing production deployment therefore remains unchanged.

## Integration

See `backend/INTEGRATION.md` for the exact Apps Script integration point.
