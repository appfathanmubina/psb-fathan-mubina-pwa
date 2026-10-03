# PSB Fathan Mubina — Backend API Contract

## Tahap 6 — Lock Backend API Contract

**Status:** LOCKED BASELINE  
**Branch:** `stage-2-master-repository-lock`  
**Backend source:** `apps-script/Code.gs`  
**Bridge source:** `apps-script/Bridge.html`  
**PWA transport:** `docs/api-bridge.js`

---

## 1. Tujuan

Dokumen ini mengunci kontrak komunikasi antara PWA GitHub Pages dan backend Google Apps Script.

Kontrak ini tidak membuat API/business rule baru. Ia mendokumentasikan fungsi backend yang sudah ada dan jalur pemanggilannya.

Prinsip utama:

`PWA → API Bridge → Apps Script → Spreadsheet/Drive`

PWA tidak boleh mengakses Spreadsheet atau Drive secara langsung.

---

## 2. Authority

| Layer | Authority |
|---|---|
| PWA | UI, navigation, presentation, request orchestration |
| API Bridge | transport, origin validation, request correlation |
| Apps Script | authentication, authorization, business rules, validation, mutation |
| Spreadsheet | database authority |
| Google Drive | managed file storage authority |

Frontend hiding is not authorization.

---

## 3. Authentication Contract

Authenticated operations use the existing backend session model.

Contract:

- login uses identifier + password;
- backend verifies password using its existing hashing/salt implementation;
- successful authentication creates a server-side session;
- session token is a credential;
- backend validates session and role for protected operations;
- logout invalidates the session;
- idle timeout and TTL remain backend-controlled;
- login throttling/temporary lock remains backend-controlled;
- password change remains backend-controlled;
- `mustChangePassword` remains backend-controlled.

### Credential handling

Session tokens MUST NOT be:

- placed in URLs;
- written into service-worker caches;
- sent to analytics;
- written to ordinary application logs;
- exposed through public configuration.

---

## 4. Public / Bootstrap API

| Function | Auth | Purpose |
|---|---|---|
| `getAppInfo` | Public | Application/backend diagnostics |
| `getPublicConfig` | Public | Public application configuration |
| `getPublicGallery` | Public | Public gallery |
| `login` | Public | Authenticate user |
| `registerWali` | Public | Register prospective guardian |

`getAppInfo` is diagnostic/read-only and must not expose secrets, tokens, passwords, Spreadsheet IDs, or Drive credentials.

---

## 5. Current Bridge Allowlist

The current `PSB_PWA_BRIDGE_ALLOWED_FUNCTIONS` in `Code.gs` contains **79 function names**.

This is an important reconciliation with the older Stage 32.2 documentation, which stated 76 frontend server functions plus `getAppInfo`. The current source allowlist is the authoritative count for Tahap 6.

### Authentication / session

- `login`
- `finalizeLogin`
- `registerWali`
- `validateSession`
- `logout`
- `changePassword`

### Production / security controls

- `getProductionControlData`
- `setProductionControl`
- `getGoLiveChecklist`
- `createProductionBackup`
- `runSecurityMaintenance`

These functions remain subject to their existing backend role gates. Presence in the bridge allowlist does not grant permission.

### User management / audit

- `getUserManagementData`
- `adminResetUserPassword`
- `createManualUser`
- `getAuditLogPageData`

### Academic year / master data

- `getAcademicYearLifecycleData`
- `setActiveAcademicYear`
- `getMasterDefinitions`
- `getMasterData`
- `saveMasterItem`
- `deactivateMasterItem`

### Registration

- `getRegistrationFormOptions`
- `getWaliHomeData`
- `getMyRegistrations`
- `getRegistrationList`
- `getRegistrationDetail`
- `saveRegistration`
- `submitRegistration`

### Payment

- `getPaymentPageData`
- `getPaymentsForRegistration`
- `createBill`
- `submitPayment`
- `verifyPayment`

### Selection

- `getSelectionPageData`
- `createSelectionSchedule`
- `updateSelectionScheduleStatus`
- `addSelectionParticipant`
- `addSelectionParticipantsBulk`
- `updateSelectionParticipantStatus`
- `saveSelectionScore`
- `saveSelectionResult`

### Announcement

- `getAnnouncementPageData`
- `publishAnnouncement`

### Notification

- `getNotifications`
- `markNotificationRead`
- `markAllNotificationsRead`

### Chat

- `getChatPageData`
- `getChatThread`
- `openChatThread`
- `sendChatMessage`
- `markChatThreadRead`
- `closeChatThread`
- `cleanupChatRetention`
- `runChatAutomationNow`

The last two are operational/maintenance functions and must retain their existing backend authorization. They are not public APIs merely because they appear in the bridge allowlist.

### Communication

- `getCommunicationCenterData`
- `sendCommunication`

### Re-registration

- `getReregistrationPageData`
- `openReregistration`
- `finalizeReregistration`

### Dashboard / monitoring / incident

- `getDashboardPageData`
- `getProductionReadiness`
- `getMonitoringPageData`
- `getIncidentPageData`
- `saveIncident`
- `closeIncident`

### Reporting

- `getReportingPageData`
- `getAdvancedReportingData`
- `exportAdvancedReportingCsv`

### Verification / documents

- `getVerificationQueue`
- `getVerificationDetail`
- `getDocumentOptions`
- `getRegistrationDocuments`
- `getDocumentPageData`
- `uploadDocument`
- `verifyDocument`
- `finalizeVerification`

---

## 6. Read vs Mutation

The following classification is contractual at the business level.

### Read / query operations

Examples:

- `getPublicConfig`
- `getPublicGallery`
- `getWaliHomeData`
- `getMyRegistrations`
- `getRegistrationList`
- `getRegistrationDetail`
- `getPaymentPageData`
- `getPaymentsForRegistration`
- `getSelectionPageData`
- `getAnnouncementPageData`
- `getNotifications`
- `getChatPageData`
- `getChatThread`
- `getCommunicationCenterData`
- `getReregistrationPageData`
- `getDashboardPageData`
- `getMonitoringPageData`
- `getIncidentPageData`
- `getReportingPageData`
- `getAdvancedReportingData`
- `getVerificationQueue`
- `getVerificationDetail`
- `getRegistrationDocuments`

### High-risk mutations

These remain entirely backend-authoritative:

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
- `addSelectionParticipantsBulk`
- `updateSelectionParticipantStatus`
- `saveSelectionScore`
- `saveSelectionResult`
- `publishAnnouncement`
- `openReregistration`
- `finalizeReregistration`
- `saveIncident`
- `closeIncident`
- `sendCommunication`
- chat mutations
- user/master/security mutations

The PWA MUST NOT reproduce or bypass these business rules.

---

## 7. Role Contract

The production roles are:

- `SUPERADMIN`
- `ADMIN_PSB`
- `VERIFIKATOR`
- `SELEKSI`
- `KEUANGAN`
- `WALI`

The backend remains the authoritative source for role authorization.

### Wali Santri special privacy rule

A Wali may receive selection status/result information that is intended for the guardian, including the final **Keterangan Lulus/status**.

A Wali MUST NOT receive:

- individual selection scores;
- score components;
- total/internal score calculations;
- ranking;
- internal evaluator notes;
- internal selection notes;
- hidden administrative evaluation data.

This restriction applies even if a user manipulates the PWA or directly attempts to invoke an allowed function.

---

## 8. Document / Drive Contract

Document operations remain backend-controlled.

The PWA may submit an upload request through the bridge, but:

- authorization is checked server-side;
- ownership/registration association is checked server-side;
- file type/size validation remains server-side;
- Drive destination is selected server-side;
- returned metadata is filtered server-side.

The PWA MUST NOT receive arbitrary Drive access.

---

## 9. Response Contract

The backend uses `rpcSafe_` before returning backend results through the bridge.

Therefore:

- Date values must be serialized into JSON-safe values;
- nested objects must remain JSON-safe;
- the bridge must not reinterpret backend business results;
- `success`, `message`, and backend error codes should be preserved when supplied;
- transport errors and backend business errors remain distinguishable.

The PWA may present an error to the user, but it must not silently convert a failed mutation into a successful state.

---

## 10. Bridge Transport Contract

Current transport:

`GitHub Pages PWA → hidden Apps Script Bridge iframe → postMessage → google.script.run`

Required properties:

- request IDs;
- response correlation;
- timeout;
- exact trusted origins;
- explicit bridge source marker;
- explicit backend function allowlist;
- no wildcard target origin for normal requests;
- no session token in bridge URL.

The transport layer does not replace backend authorization.

---

## 11. Forbidden API Surface

The bridge MUST NOT expose:

- underscore/internal helpers;
- raw Spreadsheet helpers;
- raw row lookup helpers;
- password hashing helpers;
- arbitrary Drive operations;
- arbitrary CONFIG writes;
- arbitrary Spreadsheet writes;
- maintenance helpers without explicit authorization;
- functions that bypass session/role checks;
- debugging functions that reveal secrets;
- credentials, Script Properties, or storage IDs unnecessarily.

Adding a function to the allowlist requires review against this contract.

---

## 12. Change Control

Until this contract is deliberately revised:

1. Existing backend function names are not renamed casually.
2. Existing parameters are not changed without API review.
3. Existing response semantics are not changed without API review.
4. New PWA calls must map to an existing approved backend function or be explicitly added to this contract.
5. Frontend-only authorization is never considered sufficient.
6. Any bridge allowlist change requires documentation.
7. Database changes must follow the Tahap 5 Database Contract.
8. Production Apps Script deployment is not part of an ordinary source/documentation change.
9. Breaking API changes require a versioned contract and migration plan.

---

## 13. Contract Version

**API Contract:** v1  
**Database Contract dependency:** Tahap 5 — locked  
**Bridge baseline:** Stage 32.x existing implementation  
**Canonical source:** Apps Script baseline locked in Tahap 2–4

### Known documentation discrepancy

Older `docs/API_BRIDGE.md` states that the bridge exposes 76 frontend server functions plus `getAppInfo`. The current `PSB_PWA_BRIDGE_ALLOWED_FUNCTIONS` contains 79 function names. For Tahap 6, the current source allowlist is authoritative; the older count is retained only as historical documentation and must not be used as the current contract count.

---

## 14. Tahap 6 Completion Criteria

Tahap 6 is considered complete when:

- [x] Backend source identified
- [x] Bridge source identified
- [x] Current allowlist documented
- [x] Public/bootstrap operations documented
- [x] Authentication/session boundary documented
- [x] Role boundary documented
- [x] Read/mutation boundary documented
- [x] Wali selection-score privacy rule documented
- [x] Drive boundary documented
- [x] Response serialization documented
- [x] Forbidden API surface documented
- [x] API change-control rule documented

**No production code is changed by this contract document.**
