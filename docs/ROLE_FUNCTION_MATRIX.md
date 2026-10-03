# PSB Fathan Mubina — Role Function Matrix

## Tahap 10 — Kunci Aturan Role
**Status:** LOCKED
**Authority:** apps-script/Code.gs
**Reference:** docs/API_CALL_MATRIX.md

| Function | SUPERADMIN | ADMIN_PSB | VERIFIKATOR | SELEKSI | KEUANGAN | WALI |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| getProductionControlData | ✓ | ✓ | — | — | — | — |
| setProductionControl | ✓ | — | — | — | — | — |
| getGoLiveChecklist | ✓ | ✓ | — | — | — | — |
| createProductionBackup | ✓ | — | — | — | — | — |
| runSecurityMaintenance | ✓ | — | — | — | — | — |
| getUserManagementData | ✓ | — | — | — | — | — |
| adminResetUserPassword | ✓ | — | — | — | — | — |
| createManualUser | ✓ | — | — | — | — | — |
| getAuditLogPageData | ✓ | ✓ | — | — | — | — |
| getAcademicYearLifecycleData | ✓ | ✓ | — | — | — | — |
| setActiveAcademicYear | ✓ | ✓ | — | — | — | — |
| getMasterDefinitions | ✓ | ✓ | — | — | — | — |
| getMasterData | ✓ | ✓ | — | — | — | — |
| saveMasterItem | ✓ | ✓ | — | — | — | — |
| deactivateMasterItem | ✓ | ✓ | — | — | — | — |
| getRegistrationFormOptions | ✓ | ✓ | — | — | — | ✓ |
| getWaliHomeData | — | — | — | — | — | ✓ |
| getMyRegistrations | ✓ | ✓ | — | — | — | ✓ |
| getRegistrationList | ✓ | ✓ | ✓ | — | — | — |
| getRegistrationDetail | * | * | * | — | — | — |
| getPaymentPageData | ✓ | ✓ | — | — | ✓ | ✓ |
| getPaymentsForRegistration | ✓ | ✓ | — | — | ✓ | ✓ |
| createBill | ✓ | ✓ | — | — | ✓ | — |
| submitPayment | ✓ | ✓ | — | — | ✓ | ✓ |
| verifyPayment | ✓ | ✓ | — | — | ✓ | — |
| getSelectionPageData | ✓ | ✓ | ✓ | ✓ | — | ✓** |
| createSelectionSchedule | ✓ | ✓ | — | ✓ | — | — |
| updateSelectionScheduleStatus | ✓ | ✓ | — | ✓ | — | — |
| addSelectionParticipant | ✓ | ✓ | — | ✓ | — | — |
| addSelectionParticipantsBulk | ✓ | ✓ | — | ✓ | — | — |
| updateSelectionParticipantStatus | ✓ | ✓ | — | ✓ | — | — |
| saveSelectionScore | ✓ | ✓ | — | ✓ | — | — |
| saveSelectionResult | ✓ | ✓ | — | ✓ | — | — |
| getAnnouncementPageData | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| publishAnnouncement | ✓ | ✓ | — | ✓ | — | — |
| getNotifications | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| markNotificationRead | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| markAllNotificationsRead | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| getChatPageData | ✓ | ✓ | — | — | — | ✓ |
| getChatThread | ✓ | ✓ | — | — | — | ✓ |
| openChatThread | ✓ | ✓ | — | — | — | ✓ |
| sendChatMessage | ✓ | ✓ | — | — | — | ✓ |
| markChatThreadRead | ✓ | ✓ | — | — | — | ✓ |
| closeChatThread | ✓ | ✓ | — | — | — | — |
| cleanupChatRetention | ✓ | — | — | — | — | — |
| runChatAutomationNow | ✓ | — | — | — | — | — |
| getCommunicationCenterData | ✓ | ✓ | — | — | — | — |
| sendCommunication | ✓ | ✓ | — | — | — | — |
| getReregistrationPageData | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| openReregistration | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| finalizeReregistration | ✓ | ✓ | — | — | ✓ | — |
| getDashboardPageData | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| getProductionReadiness | ✓ | ✓ | — | — | — | — |
| getMonitoringPageData | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| getIncidentPageData | ✓ | ✓ | — | — | — | — |
| saveIncident | ✓ | ✓ | — | — | — | — |
| closeIncident | ✓ | ✓ | — | — | — | — |
| getReportingPageData | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| getAdvancedReportingData | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| exportAdvancedReportingCsv | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| getVerificationQueue | ✓ | ✓ | ✓ | — | — | — |
| getVerificationDetail | ✓ | ✓ | ✓ | — | — | — |
| getDocumentOptions | ✓ | ✓ | ✓ | — | — | ✓ |
| getRegistrationDocuments | * | * | * | — | — | * |
| getDocumentPageData | ✓ | ✓ | ✓ | — | — | ✓ |
| uploadDocument | ✓ | ✓ | ✓ | — | — | ✓ |
| verifyDocument | ✓ | ✓ | ✓ | — | — | — |
| finalizeVerification | ✓ | ✓ | ✓ | — | — | — |
| saveRegistration | ✓ | ✓ | — | — | — | ✓ |
| submitRegistration | ✓ | ✓ | — | — | — | ✓ |

**Catatan:**
- * = fungsi memiliki guard/ownership logic; tanda ini bukan akses universal.
- ** = WALI boleh menerima hasil/status yang diperuntukkan baginya, tetapi response wajib mengikuti Wali privacy contract dan tidak boleh mengirim nilai, score, ranking, atau catatan internal.
- ✓ = role tercantum pada boundary backend terdokumentasi; tetap wajib session, ownership, status, dan business-rule checks.

## Aturan Lock
1. PWA boleh menyembunyikan menu sesuai role, tetapi backend wajib menolak unauthorized call.
2. Role baru tidak boleh ditambahkan tanpa revisi kontrak.
3. Perubahan allowed roles adalah perubahan security-sensitive dan harus melalui review.
4. Database tidak berubah pada Tahap 10.
5. Production deployment tidak berubah pada Tahap 10.