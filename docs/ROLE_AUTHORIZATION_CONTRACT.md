# PSB Fathan Mubina — Role Authorization Contract

## Tahap 10 — Kunci Aturan Role
**Status:** LOCKED
**Branch:** stage-2-master-repository-lock
**Authority:** apps-script/Code.gs
**Dependency:** Tahap 5 Database Contract, Tahap 6 API Contract, Tahap 9 PWA Module Migration

## 1. Tujuan
Dokumen ini mengunci aturan otorisasi berdasarkan role untuk aplikasi PSB Fathan Mubina.
Aturan ini mendokumentasikan boundary yang sudah digunakan backend. Tahap ini tidak membuat role baru dan tidak mengubah business logic yang sudah ada.
Prinsip utama: Frontend = presentation/gating; Backend = authorization authority.
Menyembunyikan menu atau tombol pada PWA tidak pernah dianggap sebagai kontrol keamanan.

## 2. Role Resmi
1. SUPERADMIN
2. ADMIN_PSB
3. VERIFIKATOR
4. SELEKSI
5. KEUANGAN
6. WALI

Role disimpan pada field USERS.role dan dibaca backend setelah session tervalidasi.

## 3. Prinsip Otorisasi
### 3.1 Session terlebih dahulu
Setiap API protected harus memvalidasi session, memperoleh user, membaca role, memeriksa role terhadap boundary fungsi, lalu menjalankan operasi.
### 3.2 Allowlist bukan izin role
Masuknya fungsi ke PSB_PWA_BRIDGE_ALLOWED_FUNCTIONS tidak memberikan hak akses.
Urutan kontrol: PWA → Bridge Allowlist → Session Validation → Role Authorization → Business Rule → Data/Drive.
### 3.3 Tidak ada privilege dari frontend
Client tidak boleh memperoleh privilege dengan mengubah role di JavaScript, menu, payload, URL, localStorage, atau sessionStorage.

## 4. Boundary per Role
### SUPERADMIN
Akses administratif tertinggi pada fungsi yang memang diizinkan backend: production/security, user management, audit, master data, pendaftaran, pembayaran, seleksi, pengumuman, komunikasi, chat administration, daftar ulang, monitoring, incident, reporting, dan verifikasi.
### ADMIN_PSB
Akses operasional administratif PSB yang luas, termasuk readiness read, audit, master data, pendaftaran, pembayaran, seleksi, pengumuman, notifikasi, chat, komunikasi, daftar ulang, monitoring, incident, reporting, dan verifikasi. Security maintenance serta kontrol production tertentu tetap khusus SUPERADMIN.
### VERIFIKATOR
Fokus pada verifikasi administrasi/dokumen: antrean, detail, dokumen, upload pada jalur yang diizinkan, verifikasi, dan finalisasi verifikasi. Reporting/monitoring/daftar ulang hanya sesuai boundary backend.
### SELEKSI
Fokus pada jadwal seleksi, peserta, status peserta, nilai, hasil seleksi, dan publikasi pengumuman. Tidak memperoleh fungsi pembayaran, user, master, dokumen verification, production/security, atau incident administratif kecuali backend mengizinkan.
### KEUANGAN
Fokus pada tagihan, pembayaran, verifikasi pembayaran, dan daftar ulang finansial. Tidak memperoleh fungsi nilai seleksi, verifikasi dokumen, user, master, atau production/security.
### WALI
Fokus pada data/proses milik sendiri: dashboard Wali, pendaftaran, dokumen, pembayaran, daftar ulang, pengumuman, notifikasi, chat, dan password.

## 5. Matriks Modul
| Modul | SUPERADMIN | ADMIN_PSB | VERIFIKATOR | SELEKSI | KEUANGAN | WALI |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Public / Bootstrap | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Authentication / Session | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Dashboard operasional | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Dashboard Wali | — | — | — | — | — | ✓ |
| Pendaftaran | ✓ | ✓ | ✓ | — | — | ✓ |
| Verifikasi Dokumen | ✓ | ✓ | ✓ | — | — | ✓ |
| Pembayaran | ✓ | ✓ | — | — | ✓ | ✓ |
| Seleksi | ✓ | ✓ | ✓ | ✓ | — | ✓* |
| Pengumuman | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Notifikasi | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Chat | ✓ | ✓ | — | — | — | ✓ |
| Komunikasi Center | ✓ | ✓ | — | — | — | — |
| Daftar Ulang | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Master Data | ✓ | ✓ | — | — | — | — |
| Manajemen User | ✓ | — | — | — | — | — |
| Audit | ✓ | ✓ | — | — | — | — |
| Monitoring | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Incident | ✓ | ✓ | — | — | — | — |
| Reporting | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Production Readiness / Control | ✓ | ✓** | — | — | — | — |
| Security Maintenance | ✓ | — | — | — | — | — |

* WALI hanya menerima data seleksi yang memang diperuntukkan baginya dan wajib mengikuti privacy contract.
** ADMIN_PSB memiliki read boundary pada fungsi tertentu; mutation production tertentu khusus SUPERADMIN.

## 6. Function-Level Authorization
Detail fungsi-per-fungsi mengikuti docs/API_CALL_MATRIX.md. Boundary penting: user management SUPERADMIN; audit SUPERADMIN/ADMIN_PSB; master SUPERADMIN/ADMIN_PSB; payment mutations SUPERADMIN/ADMIN_PSB/KEUANGAN; selection mutations SUPERADMIN/ADMIN_PSB/SELEKSI; announcement publication SUPERADMIN/ADMIN_PSB/SELEKSI; communication center SUPERADMIN/ADMIN_PSB; chat administration SUPERADMIN/ADMIN_PSB; retention/automation SUPERADMIN; re-registration finalization SUPERADMIN/ADMIN_PSB/KEUANGAN; incident SUPERADMIN/ADMIN_PSB; reporting SUPERADMIN/ADMIN_PSB/VERIFIKATOR/SELEKSI/KEUANGAN; document verification SUPERADMIN/ADMIN_PSB/VERIFIKATOR; registration save/submit WALI/SUPERADMIN/ADMIN_PSB.

## 7. Wali Santri — Privacy Boundary
WALI boleh menerima status proses, Keterangan Lulus/status hasil seleksi, tanggal pengumuman bila memang tersedia, data pendaftaran sendiri, pembayaran sendiri, dokumen sendiri, dan komunikasi yang ditujukan kepadanya.
WALI tidak boleh menerima nilai individual, komponen nilai, total/internal score, ranking, catatan evaluator, catatan seleksi internal, participant data internal yang tidak diperlukan, atau field administratif internal lainnya.
Larangan berlaku pada response backend, bukan hanya tampilan PWA.

## 8. Multi-role
Jika satu user memiliki lebih dari satu role, backend dapat menganggap authorized bila salah satu role termasuk allowed roles. Response tetap harus mengikuti privacy/data boundary dan ownership.

## 9. Aturan Perubahan Role
Perubahan role adalah security-sensitive mutation: hanya fungsi administratif berwenang, melalui backend authorization, diaudit, tidak melalui direct Spreadsheet access dari frontend. Role baru memerlukan revisi Role Contract.

## 10. Deny-by-Default
Role tidak tercantum → akses ditolak. Session tidak valid → akses ditolak. User tidak ACTIVE → akses ditolak. Resource di luar ownership/boundary → akses ditolak atau response dibatasi sesuai business rule.

## 11. Kriteria Lock
- [x] daftar role resmi dikunci
- [x] backend-authoritative dikunci
- [x] boundary modul dikunci
- [x] boundary fungsi mengacu API Call Matrix
- [x] Wali privacy dikunci
- [x] multi-role rule dikunci
- [x] deny-by-default dikunci
- [x] tidak ada perubahan production deployment
- [x] tidak ada perubahan database schema

**Tahap berikutnya:** Tahap 11 — Desain UI/UX Mobile Profesional.