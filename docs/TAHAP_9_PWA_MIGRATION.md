# PSB Fathan Mubina — Tahap 9 Migrasi Seluruh Modul ke PWA

**Status:** VERIFIED / LOCKED  
**Branch:** `stage-2-master-repository-lock`

## 1. Tujuan

Memastikan seluruh modul frontend yang sebelumnya berada pada `apps-script/Index.html` tersedia pada PWA GitHub Pages di `docs/index.html`, dengan transport API melalui `docs/api-bridge.js`.

## 2. Boundary

`docs/index.html` = UI/application layer PWA.  
`docs/api-bridge.js` = transport layer.  
`apps-script/Code.gs` = backend/API/business authority.

PWA tidak mengakses Spreadsheet atau Drive secara langsung.

## 3. Hasil Audit Source

Perbandingan source:
- Apps Script Index: 2,106 lines
- PWA Index: 2,152 lines
- Apps Script server call sites: 102
- PWA server call sites: 101
- Unique backend functions pada keduanya: 76
- Perbedaan call count: `getPublicConfig` (Apps Script 3, PWA 2)

Perbedaan tersebut berada pada alur boot PWA yang sudah dioptimalkan agar public home dapat tampil terlebih dahulu sebelum koneksi backend dilanjutkan. Tidak ada modul backend yang hilang berdasarkan unique API function set.

## 4. API Migration

Seluruh 76 fungsi yang dipanggil frontend tersedia melalui wrapper:

`server(fn,...args) → PSBApi.call(fn,args)`

Tidak ada `google.script.run` di PWA.

Semua request melewati API Bridge.

## 5. Modul yang Tercover

- Public Home / Gallery / konfigurasi publik
- Login / Register Wali / Session
- Dashboard
- Pendaftaran
- Verifikasi dokumen
- Seleksi
- Pengumuman
- Komunikasi
- Notifikasi
- Daftar Ulang
- Pembayaran
- Master Data
- Manajemen User
- Audit
- Reporting
- Monitoring
- Incident
- Chat
- Production Readiness / Production Control
- Security Maintenance

## 6. Authentication Boundary

Session token tetap credential sensitif dan dipakai hanya melalui runtime request. PWA tidak menaruh token pada URL, public config, atau service-worker cache.

Authorization tetap dilakukan backend.

## 7. Wali Santri Privacy

Migrasi frontend tidak mengubah aturan privacy. Backend tetap menjadi authority dan response selection untuk Wali harus tetap dibatasi sesuai contract Tahap 6.

## 8. Service Worker

Service worker hanya melakukan caching terhadap application shell same-origin. Tidak ada endpoint Apps Script atau session token yang dimasukkan ke APP_SHELL.

## 9. Production Safety

Tahap 9 source migration tidak:
- mengubah database;
- mengubah business logic backend;
- membuat deployment production;
- menghapus fungsi backend;
- mengubah role authorization.

## 10. Verification

Static verification:
- unique PWA API functions: 76
- seluruh 76 termasuk dalam allowlist backend 79
- seluruh 79 allowlist functions memiliki backend definition
- tidak ada direct `google.script.run` pada PWA
- API transport menggunakan `PSBApi.call`
- service worker tidak meng-cache API URL
- session token tidak berada pada config.js

**Kesimpulan: frontend module migration ke PWA telah ter-cover dan dikunci secara source/contract.**

Runtime functional testing seluruh modul dilakukan pada tahapan QA yang telah ditetapkan, bukan dengan mengubah production pada Tahap 9.
