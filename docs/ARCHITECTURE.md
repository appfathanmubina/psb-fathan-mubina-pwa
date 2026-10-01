# PSB Fathan Mubina — PWA Architecture

## Stage 32.0 — PWA Rebuild Foundation & Architecture Audit

### 1. Baseline

The rebuild starts from the final Apps Script production baseline:

- `Code.gs`
- `Index.html`
- `SetupDatabase.gs`
- Baseline ZIP SHA-256: `7d918c75dfdc38176885165d1f9aefa9baa34f4abb9355f139fd3059e55040a1`

The Apps Script production application remains the authoritative backend. This repository is only for the new PWA client and its supporting client-side assets.

### 2. Target architecture

```
Android / Desktop
       |
       v
GitHub Pages PWA
       |
       | HTTPS API bridge
       v
Apps Script Web App (/exec)
       |
       +--> Authentication / Session
       +--> Authorization / Role checks
       +--> Spreadsheet database
       +--> Google Drive files
       +--> Notifications / Chat / Reporting
```

The PWA must never become a second source of truth for PSB data.

### 3. Repository / deployment boundary

- Apps Script production repository: separate and protected.
- PWA repository: this repository.
- PWA GitHub Pages target: `main` + `/docs`.
- Production Apps Script `main` must not be modified as part of ordinary PWA stages.
- PWA work must be staged and independently verified before any final production integration.

### 4. Client responsibilities

The PWA owns:

- installable app shell
- responsive/mobile-first UI
- navigation and presentation state
- local non-sensitive UI cache
- API request orchestration
- PWA manifest
- service worker
- offline shell/update handling

The PWA must not own:

- authentication truth
- session validity
- role authorization
- registration status truth
- payment truth
- selection results
- document verification truth
- audit truth
- Drive file authority

### 5. Backend responsibilities

Apps Script remains responsible for:

- login and password hashing
- session creation, validation and invalidation
- role authorization
- all registration/payment/selection/reregistration mutations
- Google Drive upload/storage
- Spreadsheet persistence
- audit logging
- operational/security controls
- chat and notifications

### 6. PWA API bridge rule

The current Apps Script baseline is a native Apps Script web application. Its existing `Index.html` calls backend functions through `google.script.run`.

A GitHub Pages PWA is a different origin, so it cannot reuse `google.script.run` directly. The new implementation therefore needs an explicit Apps Script bridge endpoint/origin adapter.

The bridge must:

1. accept only explicitly allowed function names;
2. validate the request shape;
3. preserve the existing backend session-token model;
4. never receive credentials as a persistent bridge configuration;
5. return JSON-safe values;
6. enforce origin allowlisting;
7. keep authorization inside the backend function itself;
8. never expose internal helper functions merely because they exist in `Code.gs`.

### 7. Security principle

Frontend visibility is not authorization.

Every sensitive backend operation must continue to validate the session and role server-side. Hiding a PWA button is only a UI concern.

### 8. Offline principle

Offline mode is limited to the application shell and safe UI state.

The PWA must not treat a locally stored session as proof that the user is authenticated while offline. Protected data should be refreshed/validated against Apps Script when connectivity returns.

### 9. Brand assets

Brand configuration remains backend/config driven. The PWA should consume the configured application name/icon/logo rather than introducing a competing hardcoded brand source.

### 10. Stage 32.0 outcome

Stage 32.0 establishes the boundary and contract before implementation. No production Apps Script source is changed by this stage.
