# Tahap 7 — API Bridge Hardening

**Status:** HARDENED — STATIC REVIEW PASSED  
**Branch:** `stage-2-master-repository-lock`  
**Bridge:** `apps-script/Bridge.html`  
**PWA transport:** `docs/api-bridge.js`

## 1. Tujuan

Memperkuat transport PWA ↔ Apps Script tanpa mengubah business logic, database contract, role rules, atau fungsi backend.

## 2. Hardening yang diterapkan

### Origin validation

- Bridge hanya menerima origin yang dikonfigurasi backend.
- Origin dinormalisasi menjadi origin HTTPS yang valid.
- Wildcard `*` ditolak.
- Duplicate origin dibuang.

### Parent-window binding

Request harus berasal dari `window.top`/parent window yang meng-embed bridge. Origin saja tidak dianggap cukup untuk mengikat request ke frame PWA yang sah.

### Request validation

- Request ID wajib mengikuti format bridge yang dibuat PWA dan dibatasi panjangnya.
- Nama fungsi wajib berupa JavaScript identifier yang valid dan dibatasi panjangnya.
- Jumlah argumen dibatasi untuk mencegah payload struktur argumen yang tidak wajar.
- Request tanpa ID/fungsi yang valid diabaikan.

### Function allowlist

Backend tetap menjadi enforcement point. `pwaBridgeCall()` hanya menjalankan fungsi yang ada pada `PSB_PWA_BRIDGE_ALLOWED_FUNCTIONS`.

### Response correlation

PWA mencocokkan response dengan request ID yang masih pending. Response untuk ID yang tidak dikenal diabaikan.

### Timeout / reset

- Request memiliki timeout.
- Pending requests dibersihkan saat timeout.
- Reset bridge menolak seluruh pending requests.

### Session credential

Session token tetap tidak berada di URL bridge, konfigurasi publik, service-worker cache, atau transport endpoint.

## 3. Tidak diubah

Hardening ini tidak mengubah:

- database/schema;
- role authorization;
- business rules seleksi;
- payment/registration logic;
- Drive structure;
- production deployment;
- API function names atau signatures.

## 4. Static verification

Setelah perubahan bridge:

- seluruh 76 fungsi unik yang dipanggil PWA tetap berada dalam allowlist 79 fungsi;
- seluruh 79 fungsi allowlist tetap memiliki definisi backend;
- tidak ada perubahan pada pemetaan API PWA;
- Wali privacy fix dari Tahap 6 tetap berada di backend.

## 5. Production safety

Perubahan berada di source branch dan tidak otomatis membuat deployment production baru. Deployment production tetap tidak diubah dalam Tahap 7.

## 6. Tahap berikutnya

Setelah static review dan pengujian transport di environment non-production dinyatakan lulus, pekerjaan dapat dilanjutkan ke **Tahap 8 — Authentication & Session**.
