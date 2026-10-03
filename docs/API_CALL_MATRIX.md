# PSB Fathan Mubina — API Call Matrix

## Tahap 6 — Verifikasi Aktual PWA ↔ Backend

**Branch:** `stage-2-master-repository-lock`  
**Status:** VERIFIED AFTER FIX — TAHAP 6 READY TO LOCK  
**Source PWA:** `docs/index.html`  
**Source backend:** `apps-script/Code.gs`  
**Transport:** `docs/api-bridge.js` → Apps Script Bridge

## 1. Hasil Rekonsiliasi

- Bridge allowlist aktual: **79 fungsi**.
- Fungsi backend yang benar-benar dipanggil PWA melalui pola `server(...)`: **76 fungsi unik**.
- Total pemanggilan `server(...)` yang terdeteksi: **101**.
- Semua **76/76** fungsi unik yang dipanggil PWA terdapat di allowlist.
- Semua **79/79** fungsi allowlist memiliki definisi backend.
- Fungsi allowlist yang saat ini **tidak dipanggil PWA**: `getAppInfo`, `getPaymentsForRegistration`, `getRegistrationDocuments`.

## 2. Temuan Keamanan Penting

### FIXED — `getSelectionPageData` tidak lagi mengirim nilai kepada Wali

Backend memang membatasi `visibleScores` untuk Wali ke peserta miliknya, tetapi pada objek `detail` fungsi ini masih mengembalikan:

- `scores` untuk participant yang dipilih;
- `result` untuk registration yang dipilih.

Karena PWA memanggil `getSelectionPageData` untuk Wali, ini bertentangan dengan aturan yang sudah dikunci pada API Contract: **Wali hanya boleh menerima Keterangan Lulus/status dan tidak boleh menerima nilai/komponen nilai/perhitungan internal/ranking/catatan evaluator.**

Temuan ini adalah **backend response-surface issue**, bukan sekadar masalah tampilan frontend. Jangan ditutup dengan menyembunyikan elemen UI.

### Temuan tambahan yang perlu dicatat

`getRegistrationDocuments` tidak dipanggil oleh PWA dan hanya mendelegasikan ke `getDocumentOptions`, yang memiliki guard backend. Tidak ada bukti dari pemeriksaan ini bahwa fungsi tersebut dapat melewati authorization, tetapi keberadaannya di allowlist tidak diperlukan oleh PWA saat ini.

`getAppInfo` tidak dipanggil PWA dan bersifat diagnostic/read-only. `getPaymentsForRegistration` juga tidak dipanggil PWA meskipun tersedia di allowlist dan memiliki guard backend.

## 3. Matriks Lengkap

| Backend API | Signature aktual | Caller PWA | Baris PWA | Tipe | Guard/otorisasi yang terdeteksi |
|---|---|---|---:|---|---|
| getAppInfo | — | Tidak dipanggil PWA | — | Read | getSessionUser_/internal check atau public |
| getPublicConfig | forceRefresh | boot, reloadCurrentData | 694, 955 | Read | getSessionUser_/internal check atau public |
| getPublicGallery | forceRefresh | loadPublicGallery | 841 | Read | getSessionUser_/internal check atau public |
| login | identifier, password | submitLogin | 895 | Read | getSessionUser_/internal check atau public |
| finalizeLogin | sessionToken | submitLogin | 895 | Read | getSessionUser_/internal check atau public |
| registerWali | payload | submitRegisterWali | 887 | Mutation | getSessionUser_/internal check atau public |
| validateSession | sessionToken | boot, reloadCurrentData | 715, 956 | Read | getSessionUser_/internal check atau public |
| logout | sessionToken | doLogout | 1946 | Read | getSessionUser_/internal check atau public |
| changePassword | sessionToken, currentPassword, newPassword | savePassword | 1935 | Mutation | getSessionUser_/internal check atau public |
| getProductionControlData | sessionToken | openGoLiveCenterUI | 1147 | Read | [SUPERADMIN, ADMIN_PSB] |
| setProductionControl | sessionToken, payload | saveProductionControlUI | 1160 | Read | SUPERADMIN |
| getGoLiveChecklist | sessionToken | openGoLiveCenterUI | 1145 | Read | [SUPERADMIN, ADMIN_PSB] |
| createProductionBackup | sessionToken | createProductionBackupUI | 1166 | Read | SUPERADMIN |
| runSecurityMaintenance | sessionToken | runSecurityMaintenanceUI | 1271 | Mutation | [SUPERADMIN] |
| getUserManagementData | sessionToken | loadUserManagementPage | 1727 | Read | SUPERADMIN |
| adminResetUserPassword | sessionToken, payload | saveAdminResetPassword | 1747 | Mutation | SUPERADMIN |
| createManualUser | sessionToken, payload | saveManualUser | 1716 | Mutation | SUPERADMIN |
| getAuditLogPageData | sessionToken, filters | warmNavigationData, loadAudit | 597, 1265 | Read | [SUPERADMIN, ADMIN_PSB] |
| getAcademicYearLifecycleData | sessionToken | warmNavigationData, renderMasterData, loadMasterData | 598, 1838, 1856 | Read | [SUPERADMIN, ADMIN_PSB] |
| setActiveAcademicYear | sessionToken, tahunAjaranId | activateAcademicYear | 1923 | Mutation | [SUPERADMIN, ADMIN_PSB] |
| getMasterDefinitions | sessionToken | warmNavigationData, renderMasterData | 598, 1837 | Read | [SUPERADMIN, ADMIN_PSB] |
| getMasterData | sessionToken, masterKey, includeInactive | warmNavigationData, loadMasterData, openMasterForm | 598, 1854, 1901 | Read | [SUPERADMIN, ADMIN_PSB] |
| saveMasterItem | sessionToken, masterKey, payload | saveMasterFromUI | 1916 | Mutation | [SUPERADMIN, ADMIN_PSB] |
| deactivateMasterItem | sessionToken, masterKey, id | deactivateMaster | 1928 | Mutation | [SUPERADMIN, ADMIN_PSB] |
| getRegistrationFormOptions | sessionToken | openRegistrationForm | 1525 | Read | [WALI, SUPERADMIN, ADMIN_PSB] |
| getWaliHomeData | sessionToken | renderHome | 1020 | Read | WALI |
| getMyRegistrations | sessionToken | initializeAfterLogin, renderRegistrationHub | 650, 1515 | Read | WALI,SUPERADMIN,ADMIN_PSB |
| getRegistrationList | sessionToken, filters | warmNavigationData, renderApplicants | 589, 1641 | Read | [SUPERADMIN, ADMIN_PSB, VERIFIKATOR] |
| getRegistrationDetail | sessionToken, registrationId | openRegistrationForm, viewRegistration | 1525, 1634 | Read | getSessionUser_/internal check atau public |
| getPaymentPageData | sessionToken, registrationId | initializeAfterLogin, renderPayments | 657, 1805 | Read | [WALI, SUPERADMIN, ADMIN_PSB, KEUANGAN] |
| getPaymentsForRegistration | sessionToken, registrationId | Tidak dipanggil PWA | — | Read | [WALI, SUPERADMIN, ADMIN_PSB, KEUANGAN] |
| createBill | sessionToken,payload | createBillUI | 1824 | Mutation | [SUPERADMIN, ADMIN_PSB, KEUANGAN] |
| submitPayment | sessionToken,payload | submitPaymentUpload | 1821 | Mutation | WALI,SUPERADMIN,ADMIN_PSB,KEUANGAN |
| verifyPayment | sessionToken,payload | verifyPaymentUI | 1822 | Mutation | [SUPERADMIN, ADMIN_PSB, KEUANGAN] |
| getSelectionPageData | sessionToken, registrationId | warmNavigationData, renderSelection, openSelectionDetailUI | 592, 1282, 1389 | Read | [WALI, SUPERADMIN, ADMIN_PSB, SELEKSI, VERIFIKATOR] |
| createSelectionSchedule | sessionToken,payload | createSelectionScheduleUI | 1323 | Mutation | [SUPERADMIN, ADMIN_PSB, SELEKSI] |
| updateSelectionScheduleStatus | sessionToken,payload | toggleSelectionScheduleUI | 1338 | Mutation | [SUPERADMIN, ADMIN_PSB, SELEKSI] |
| addSelectionParticipant | sessionToken,payload | addSelectionParticipantUI | 1372 | Mutation | [SUPERADMIN, ADMIN_PSB, SELEKSI] |
| addSelectionParticipantsBulk | sessionToken,payload | generateSelectionParticipantsUI | 1363 | Mutation | [SUPERADMIN, ADMIN_PSB, SELEKSI] |
| updateSelectionParticipantStatus | sessionToken,payload | updateParticipantStatusUI | 1373 | Mutation | [SUPERADMIN, ADMIN_PSB, SELEKSI] |
| saveSelectionScore | sessionToken,payload | saveSelectionScoreUI | 1400 | Mutation | [SUPERADMIN, ADMIN_PSB, SELEKSI] |
| saveSelectionResult | sessionToken,payload | saveSelectionResultUI | 1401 | Mutation | [SUPERADMIN, ADMIN_PSB, SELEKSI] |
| getAnnouncementPageData | sessionToken | warmNavigationData, renderAnnouncements | 593, 1406 | Read | [WALI, SUPERADMIN, ADMIN_PSB, SELEKSI, VERIFIKATOR] |
| publishAnnouncement | sessionToken,payload | publishAnnouncementUI | 1418 | Mutation | [SUPERADMIN, ADMIN_PSB, SELEKSI] |
| getNotifications | sessionToken | warmNavigationData, updateNotificationBadge, renderNotifications | 594, 1424, 1462 | Read | [WALI, SUPERADMIN, ADMIN_PSB, SELEKSI, VERIFIKATOR] |
| markNotificationRead | sessionToken,notificationId | markNotificationReadUI | 1467 | Mutation | [WALI, SUPERADMIN, ADMIN_PSB, SELEKSI, VERIFIKATOR] |
| markAllNotificationsRead | sessionToken | markAllNotificationsReadUI | 1468 | Mutation | [WALI, SUPERADMIN, ADMIN_PSB, SELEKSI, VERIFIKATOR] |
| getChatPageData | sessionToken | warmNavigationData, loadChatDataUI | 599, 1969 | Read | [WALI, SUPERADMIN, ADMIN_PSB] |
| getChatThread | sessionToken, threadId | loadChatThreadUI | 2087 | Read | [WALI, SUPERADMIN, ADMIN_PSB] |
| openChatThread | sessionToken, registrationId | openChatForRegistration | 2048 | Read | [WALI, SUPERADMIN, ADMIN_PSB] |
| sendChatMessage | sessionToken,threadId,rawMessage,attachmentPayload | sendChatMessageUI | 2112 | Mutation | [WALI, SUPERADMIN, ADMIN_PSB] |
| markChatThreadRead | sessionToken,threadId | openChatForRegistration, loadChatThreadUI | 2054, 2094 | Mutation | [WALI, SUPERADMIN, ADMIN_PSB] |
| closeChatThread | sessionToken,threadId | closeChatThreadUI | 2141 | Mutation | [SUPERADMIN, ADMIN_PSB] |
| cleanupChatRetention | sessionToken | cleanupChatRetentionUI | 2140 | Mutation | SUPERADMIN |
| runChatAutomationNow | sessionToken | runChatAutomationUI | 2139 | Mutation | SUPERADMIN |
| getCommunicationCenterData | sessionToken | loadCommunicationCenterUI | 1441 | Read | [SUPERADMIN, ADMIN_PSB] |
| sendCommunication | sessionToken, payload | sendCommunicationUI | 1456 | Mutation | [SUPERADMIN, ADMIN_PSB] |
| getReregistrationPageData | sessionToken | warmNavigationData, renderReregistration | 595, 1764 | Read | [WALI, SUPERADMIN, ADMIN_PSB, VERIFIKATOR, KEUANGAN] |
| openReregistration | sessionToken, registrationId | openReregistrationUI | 1776 | Read | [WALI, SUPERADMIN, ADMIN_PSB, VERIFIKATOR, KEUANGAN] |
| finalizeReregistration | sessionToken, registrationId | finalizeReregistrationUI | 1777 | Mutation | [SUPERADMIN, ADMIN_PSB, KEUANGAN] |
| getDashboardPageData | sessionToken | renderHome | 1015 | Read | [SUPERADMIN, ADMIN_PSB, VERIFIKATOR, SELEKSI, KEUANGAN] |
| getProductionReadiness | sessionToken | openProductionReadinessUI | 1130 | Read | SUPERADMIN,ADMIN_PSB |
| getMonitoringPageData | sessionToken | openMonitoringUI | 1096 | Read | [SUPERADMIN, ADMIN_PSB, VERIFIKATOR, SELEKSI, KEUANGAN] |
| getIncidentPageData | sessionToken | openIncidentCenterUI | 1116 | Read | [SUPERADMIN, ADMIN_PSB] |
| saveIncident | sessionToken,payload | saveIncidentUI | 1123 | Mutation | [SUPERADMIN, ADMIN_PSB] |
| closeIncident | sessionToken,incidentId,resolutionNote | closeIncidentUI | 1124 | Mutation | [SUPERADMIN, ADMIN_PSB] |
| getReportingPageData | sessionToken, filters | warmNavigationData, loadReports | 596, 1178 | Read | [SUPERADMIN, ADMIN_PSB, VERIFIKATOR, SELEKSI, KEUANGAN] |
| getAdvancedReportingData | sessionToken, filters | loadAdvancedReports | 1203 | Read | [SUPERADMIN, ADMIN_PSB, VERIFIKATOR, SELEKSI, KEUANGAN] |
| exportAdvancedReportingCsv | sessionToken, filters | exportAdvancedReports | 1245 | Read | [SUPERADMIN, ADMIN_PSB, VERIFIKATOR, SELEKSI, KEUANGAN] |
| getVerificationQueue | sessionToken, filters | warmNavigationData, renderVerification, loadVerificationQueue | 590, 1473, 1483 | Read | [SUPERADMIN, ADMIN_PSB, VERIFIKATOR] |
| getVerificationDetail | sessionToken, registrationId | openVerification | 1489 | Read | [SUPERADMIN, ADMIN_PSB, VERIFIKATOR] |
| getDocumentOptions | sessionToken, registrationId | loadDocumentsForRegistration | 1666 | Read | [WALI, SUPERADMIN, ADMIN_PSB, VERIFIKATOR] |
| getRegistrationDocuments | sessionToken, registrationId | Tidak dipanggil PWA | — | Read | getSessionUser_/internal check atau public |
| getDocumentPageData | sessionToken, registrationId | initializeAfterLogin, renderDocuments | 656, 1651 | Read | [WALI, SUPERADMIN, ADMIN_PSB, VERIFIKATOR] |
| uploadDocument | sessionToken, payload | submitDocumentUpload | 1691 | Mutation | [WALI, SUPERADMIN, ADMIN_PSB, VERIFIKATOR] |
| verifyDocument | sessionToken, payload | verifyDocumentUI | 1497 | Mutation | [SUPERADMIN, ADMIN_PSB, VERIFIKATOR] |
| saveRegistration | sessionToken, payload | saveRegistrationUI | 1579 | Mutation | [WALI, SUPERADMIN, ADMIN_PSB] |
| submitRegistration | sessionToken, registrationId | saveRegistrationUI, submitRegistrationUI | 1598, 1628 | Mutation | WALI,SUPERADMIN,ADMIN_PSB |
| finalizeVerification | sessionToken, payload | finalizeVerificationUI | 1507 | Mutation | [SUPERADMIN, ADMIN_PSB, VERIFIKATOR] |

## 4. Kesimpulan Verifikasi

### Lulus

1. Tidak ditemukan pemanggilan PWA ke fungsi backend yang berada di luar allowlist.
2. Tidak ditemukan nama fungsi allowlist yang tidak memiliki definisi backend.
3. Signature backend untuk fungsi yang dipanggil dapat diidentifikasi dan dicocokkan dengan jalur caller PWA.
4. Jalur autentikasi utama PWA menggunakan `login` → `finalizeLogin` dan session token dikirim sebagai argumen RPC, bukan sebagai parameter URL bridge.
5. PWA menggunakan satu wrapper `server(fn,...args)` yang meneruskan request ke `PSBApi.call(fn,args)`.

### Verifikasi Ulang — Lulus

- **Wali selection privacy:** lulus pada static source verification. Response `detail` untuk Wali tidak lagi mengandung `scores` atau `participant`; result yang dikirim dibatasi ke field publik.
- **API allowlist:** 76 fungsi unik yang dipanggil PWA tetap seluruhnya berada dalam allowlist 79 fungsi.
- **Backend definitions:** 79/79 fungsi allowlist tetap memiliki definisi backend.

Perbaikan telah diterapkan pada `apps-script/Code.gs` dalam commit `8acda8de245d141c9e3c4735fdbada975cc90c36`. Verifikasi source setelah perubahan menunjukkan jalur Wali tidak lagi membentuk `detail.scores` atau `detail.participant`, sementara jalur non-Wali tetap mempertahankan `scores` dan `participant`.

## 5. Aturan Penutupan

Tahap 6 baru boleh dinyatakan **LOCKED COMPLETE** setelah blocker di atas diperbaiki dan diverifikasi ulang terhadap source PWA + backend. Setelah itu baru boleh masuk **Tahap 7 — API Bridge Hardening**.
