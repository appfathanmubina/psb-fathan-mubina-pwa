# PSB Fathan Mubina — Backend Contract Audit

## Stage 32.0

Source: final Apps Script baseline ZIP.

### 1. Baseline inventory

The baseline contains three source files:

| File | Responsibility |
|---|---|
| `Code.gs` | Web entry point, authentication, authorization, business logic, persistence, Drive, reporting, chat, notifications, security |
| `Index.html` | Existing Apps Script frontend and UI |
| `SetupDatabase.gs` | Spreadsheet schema, configuration defaults, initial setup and controlled test-data utilities |

The baseline contains approximately 175 top-level backend functions and approximately 233 frontend function definitions.

### 2. Existing frontend transport

The existing frontend has a single server wrapper around `google.script.run` and uses it for backend calls. The audit found 76 unique backend function names invoked by the current frontend.

The new PWA must replace this transport with an explicit bridge while preserving backend function semantics.

### 3. Public / bootstrap operations

The baseline exposes these operations without a normal logged-in role gate:

- `doGet`
- `getAppInfo`
- `getPublicGallery`
- `getPublicConfig`
- `login`
- `registerWali`

There are also maintenance/automation functions in the Apps Script source that are not appropriate for arbitrary browser exposure, including session cleanup and chat automation helpers. These must not be added to the PWA bridge simply because they are callable functions.

### 4. Authentication/session contract

The baseline uses:

- login by identifier + password;
- password hashing with per-user salt;
- session token creation;
- session validation;
- logout/invalidation;
- idle/TTL controls;
- login failure throttling/temporary lock;
- password change;
- `mustChangePassword`;
- server-side role checks.

The PWA must treat the returned session token as a credential and keep it out of URLs, logs, analytics payloads, and service-worker caches.

### 5. Roles

The production role model is:

- SUPERADMIN
- ADMIN_PSB
- VERIFIKATOR
- SELEKSI
- KEUANGAN
- WALI

Role authorization is defined by backend role groups, including:

- production controls: SUPERADMIN, ADMIN_PSB
- security maintenance: SUPERADMIN
- audit: SUPERADMIN, ADMIN_PSB
- master data: SUPERADMIN, ADMIN_PSB
- registration editing: WALI, SUPERADMIN, ADMIN_PSB
- registration administration: SUPERADMIN, ADMIN_PSB, VERIFIKATOR
- payment viewing: WALI, SUPERADMIN, ADMIN_PSB, KEUANGAN
- payment management: SUPERADMIN, ADMIN_PSB, KEUANGAN
- selection administration: SUPERADMIN, ADMIN_PSB, SELEKSI
- selection viewing: WALI, SUPERADMIN, ADMIN_PSB, SELEKSI, VERIFIKATOR
- announcement administration: SUPERADMIN, ADMIN_PSB, SELEKSI
- announcement viewing: WALI, SUPERADMIN, ADMIN_PSB, SELEKSI, VERIFIKATOR
- reregistration viewing: WALI, SUPERADMIN, ADMIN_PSB, VERIFIKATOR, KEUANGAN
- reregistration administration: SUPERADMIN, ADMIN_PSB, KEUANGAN
- dashboard/reporting/monitoring: operational staff roles as defined by the backend
- incident management: SUPERADMIN, ADMIN_PSB
- verification: SUPERADMIN, ADMIN_PSB, VERIFIKATOR
- document access: WALI, SUPERADMIN, ADMIN_PSB, VERIFIKATOR

The PWA navigation must derive from this contract; it must not become a new authorization system.

### 6. Functional domains

The backend contract covers these domains:

1. Public configuration/gallery
2. Authentication/session
3. Production/security controls
4. User management
5. Academic-year and master data
6. Registration
7. Verification and documents
8. Payments
9. Selection
10. Announcements
11. Notifications
12. Chat
13. Communication center
14. Re-registration
15. Dashboard/monitoring/incidents
16. Reporting/export

### 7. Mutation rule

High-risk mutations remain backend-authoritative. Examples include:

- `saveRegistration`
- `submitRegistration`
- `uploadDocument`
- `verifyDocument`
- `finalizeVerification`
- `createBill`
- `submitPayment`
- `verifyPayment`
- `createSelectionSchedule`
- `addSelectionParticipant`
- `saveSelectionScore`
- `saveSelectionResult`
- `publishAnnouncement`
- `openReregistration`
- `finalizeReregistration`
- `saveIncident`
- `closeIncident`
- `sendCommunication`
- chat mutations

The PWA must not implement alternate business rules for these operations.

### 8. File handling

Google Drive remains the storage authority for registration documents and other managed files. Upload requests must go through the backend authorization/access checks and must not be converted into an independent client-side storage system.

### 9. RPC serialization

The baseline contains `rpcSafe_` to convert Date values and nested objects into JSON-safe values before returning mutation results. The bridge must preserve this JSON-safe contract.

### 10. Explicit non-goals for the bridge

The bridge must not expose:

- internal underscore helpers;
- raw spreadsheet helpers;
- password hashing helpers;
- row lookup helpers;
- arbitrary Drive operations;
- arbitrary configuration writes;
- maintenance helpers that are not user-facing;
- functions that bypass the existing session/role authorization.

### 11. Contract status

This document is the audit baseline. The actual allowlist for the PWA bridge will be produced in the implementation stage after mapping each PWA screen/action to an existing backend function.
