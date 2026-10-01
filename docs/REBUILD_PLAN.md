# PSB Fathan Mubina — PWA Rebuild Plan

## Stage sequence

### Stage 32.0 — Foundation & Architecture Audit
Completed in this commit.

Deliverables:
- repository boundary
- architecture contract
- backend contract audit
- production safety boundary
- GitHub Pages target structure

### Stage 32.1 — PWA Foundation
Planned:
- `docs/index.html`
- `docs/styles.css`
- `docs/app.js`
- `docs/config.js`
- `docs/manifest.json`
- `docs/service-worker.js`
- icon asset structure
- initial responsive/mobile-first shell

No production Apps Script change.

### Stage 32.2 — Apps Script API Bridge
Planned:
- bridge endpoint/adapter in the separate Apps Script integration branch/package
- explicit function allowlist
- origin validation
- JSON-safe response contract
- PWA request client

The production Apps Script `main` remains untouched until the bridge has passed QA.

### Stage 32.3 — Authentication & Session
Planned:
- login
- register WALI
- session persistence
- session validation
- logout
- change-password flow
- must-change-password flow

### Stage 32.4 — Module Migration
Planned migration domains:
- WALI
- admin/operator
- verification
- payments
- selection
- announcements
- notifications
- chat
- communication
- reregistration
- reporting
- master data
- monitoring/incident
- production/security administration

### Stage 32.5 — Offline / Installability
Planned:
- app shell caching
- manifest
- service worker update lifecycle
- installability
- offline shell
- online recovery
- no protected-data/session caching

### Stage 32.6 — Production QA / Go-Live Candidate
Required verification:
- GitHub Pages serving
- HTTPS
- Apps Script /exec reachability
- origin allowlist
- login/session
- every role
- registration
- document upload
- payment
- selection
- announcement
- reregistration
- chat
- reporting/export
- Android installation
- offline -> online recovery
- service-worker update

Only after this QA should any final production integration be considered.

## Production safety rule

PWA development must not alter the production Apps Script repository's `main` branch or production deployment as a side effect of an intermediate PWA stage.
