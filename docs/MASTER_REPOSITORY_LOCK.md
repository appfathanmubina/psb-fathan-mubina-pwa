# MASTER REPOSITORY & SOURCE CODE LOCK — PSB Fathan Mubina

Status: LOCKED FOR TAHAP 2
Date: 2026-10-03

## 1. Master repository

Repository:
appfathanmubina/psb-fathan-mubina-pwa

Default branch:
main

Tahap 2 working branch:
stage-2-master-repository-lock

Production rule:
- main is the production/reference branch.
- Tahap work is performed on a dedicated branch first.
- No direct production overwrite is performed during intermediate Tahap.

## 2. Source baseline received for this Tahap

Source package:
PSB_Fathan_Mubina_Stage_32_Deploy_AppsScript_v32.3.5.zip

Package SHA-256:
4b2d33602972675f2bc5f53b7f8900248a4499658f2e68df2a0efda41ea4c28c

Files in package:
- AppsScript/Code.gs — 3,495 lines
- AppsScript/Index.html — 2,108 lines
- AppsScript/SetupDatabase.gs — 634 lines
- AppsScript/Bridge.html — 53 lines
- README_DEPLOY.txt — 25 lines

The package is the source baseline for the repository migration work. Its contents must not be functionally changed merely for repository organization.

## 3. Existing GitHub PWA baseline

The current repository already contains:
- docs/ — PWA frontend and static assets
- backend/Bridge.html
- backend/Code.gs.patch
- backend/SetupDatabase.gs.patch
- backend/INTEGRATION.md
- docs/API_BRIDGE.md
- docs/ARCHITECTURE.md
- docs/BACKEND_CONTRACT.md
- docs/REBUILD_PLAN.md

The existing backend patch files are documentation/integration artifacts, not a replacement for the complete Apps Script source baseline.

## 4. Target repository direction

The repository will become the master source location for both:

/docs
PWA frontend and static web assets

/apps-script
Complete Google Apps Script source

/database
Database/schema/Drive contracts

/docs
Architecture, API, deployment, and QA documentation

This Tahap does not yet refactor backend functions into many .gs files. That is a later controlled change only if approved.

## 5. Runtime authority

GitHub:
- source control
- version history
- collaboration
- PWA hosting through GitHub Pages

Google Apps Script:
- backend runtime
- authentication
- authorization
- API
- Spreadsheet access
- Drive access
- audit/security controls

Google Spreadsheet:
- database authority

Google Drive:
- document/file storage authority

## 6. Non-negotiable rules

1. Do not rebuild the database.
2. Do not delete existing backend functions without explicit approval.
3. Do not change backend behavior merely to reorganize files.
4. Do not expose internal helper functions through the bridge merely because they exist.
5. Frontend visibility is not authorization; backend authorization remains authoritative.
6. Session tokens must not be placed in URLs, service-worker cache, or public configuration.
7. Production Apps Script deployment must not be changed as a side effect of intermediate repository work.
8. Every later change must follow the numbered Tahap roadmap.
9. The roadmap remains fixed through Tahap 26; improvements or changes may be introduced inside the appropriate Tahap after review.
10. The database and API contracts are locked before later UI/performance work.

## 7. Important baseline discrepancy

The uploaded source package has SHA-256:
4b2d33602972675f2bc5f53b7f8900248a4499658f2e68df2a0efda41ea4c28c

The repository documentation previously referenced another baseline package SHA-256:
7d918c75dfdc38176885165d1f9aefa9baa34f4abb9355f139fd3059e55040a1

Therefore these are not assumed byte-identical. The discrepancy is recorded and will be reconciled during the controlled source migration. No file is declared canonical over the other merely because it exists in GitHub.

## 8. Tahap 2 completion condition

Tahap 2 is considered complete when:
- the master repository/branch strategy is established;
- the source baseline is explicitly recorded;
- the current GitHub PWA baseline is recorded;
- the production/runtime boundaries are locked;
- the discrepancy between package and repository baseline is documented;
- no production backend behavior has been changed.

Tahap berikutnya:
TAHAP 3 — PINDAHKAN SELURUH SOURCE APPS SCRIPT KE GITHUB
