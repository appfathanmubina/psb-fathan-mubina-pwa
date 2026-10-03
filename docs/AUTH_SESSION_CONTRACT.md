# PSB Fathan Mubina — Authentication & Session Contract

## Tahap 8 — Authentication & Session

**Status:** LOCKED — CONTRACT SYNCHRONIZED
**Branch:** `stage-2-master-repository-lock`
**Backend:** `apps-script/Code.gs`
**Database:** Google Spreadsheet
**Session store:** `SESSIONS`

## 1. Tujuan

Mengunci perilaku authentication dan session yang sudah ada tanpa membuat ulang database, tanpa mengubah business function, dan tanpa deployment production.

## 2. Authentication Flow

`PWA → Bridge → login(identifier,password) → USERS → createSession_() → sessionToken`

Login:
- identifier dan password wajib;
- user harus berstatus ACTIVE;
- password diverifikasi menggunakan hash + salt yang sudah ada;
- login failure menggunakan throttling;
- login berhasil membuat session baru;
- response hanya mengembalikan public user fields dan credential session.

## 3. Password

Backend menggunakan SHA-256 atas kombinasi password + salt yang sudah ada.

Salt dibuat ulang saat password berubah.

Password, passwordHash, dan passwordSalt tidak boleh masuk response public user.

## 4. Session

Session record disimpan di sheet `SESSIONS`.

Backend menyimpan hash token, bukan token mentah.

Session memiliki:
- sessionId;
- userId;
- tokenHash;
- createdAt;
- expiresAt;
- lastActivityAt;
- status.

Default authentication controls:
- absolute TTL: 480 menit;
- idle timeout: 30 menit;
- maksimum login attempts: 5;
- lock duration: 10 menit.

Nilai CONFIG, jika tersedia dan valid, tetap menjadi override runtime sesuai implementasi existing.

## 5. Session Lifecycle

### Login
Membuat session ACTIVE.

### Validate
`validateSession()` memeriksa:
- token;
- status session;
- absolute expiration;
- idle timeout;
- status user.

### Activity
Validation dengan touch dapat memperbarui last activity sesuai mekanisme cache/backend yang sudah ada.

### Logout
Mengubah session menjadi LOGOUT dan membersihkan cache terkait.

### Expired
Session dapat berakhir karena:
- EXPIRED;
- IDLE_TIMEOUT;
- atau status non-ACTIVE lainnya.

## 6. Password Change

`changePassword()`:
- membutuhkan session valid;
- memverifikasi password lama;
- password baru minimal 6 karakter;
- password baru harus berbeda;
- membuat salt/hash baru;
- menonaktifkan `mustChangePassword`;
- mencabut session lain milik user;
- membersihkan cache user;
- mencatat audit.

## 7. Login Throttling

Failure counter dan temporary lock menggunakan CacheService.

Pesan kegagalan tidak boleh membocorkan apakah identifier terdaftar.

## 8. Public User Contract

`publicUser_()` hanya mengekspos:
- userId
- name
- phone
- email
- role
- status
- photoFileId

Tidak mengekspos credential atau internal authentication fields.

## 9. Credential Handling

Session token adalah credential sensitif.

MUST NOT:
- dimasukkan ke URL;
- dimasukkan ke public config;
- disimpan dalam service-worker cache;
- dikirim ke analytics;
- ditulis ke ordinary logs;
- diekspos melalui public bootstrap/config.

Token hanya dikirim sebagai bagian request runtime menuju backend.

## 10. Authorization Boundary

Bridge allowlist bukan authorization.

Alur protected API:

`request → backend session validation → role/ownership check → business operation`

PWA tidak boleh menjadi sumber keputusan authorization.

## 11. Production Safety

Tahap 8 tidak:
- mengubah Spreadsheet production;
- mengubah deployment production;
- menjalankan `clasp push` ke production;
- membuat deployment production;
- mengubah struktur USERS/SESSIONS;
- mengganti fungsi authentication yang sudah ada.

## 12. Change Control

Perubahan terhadap authentication/session setelah dokumen ini di-lock harus menjadi perubahan terkontrol pada tahap yang relevan dan tidak boleh dilakukan sebagai refactor diam-diam.

**Tahap 8 Authentication & Session Contract: LOCKED.**
