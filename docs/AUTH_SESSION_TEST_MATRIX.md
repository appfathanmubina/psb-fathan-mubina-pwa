# PSB Fathan Mubina — Authentication & Session Test Matrix

## Tahap 8 — Verification Matrix

**Status:** STATIC CONTRACT VERIFIED
**Branch:** `stage-2-master-repository-lock`

| ID | Test | Expected |
|---|---|---|
| AUTH-01 | Login dengan credential valid | success + sessionToken |
| AUTH-02 | Login password salah | gagal, generic message |
| AUTH-03 | Login user non-ACTIVE | gagal |
| AUTH-04 | Identifier/password kosong | gagal |
| AUTH-05 | Login failures mencapai limit | temporary lock |
| AUTH-06 | Login setelah lock berakhir | dapat mencoba kembali |
| SES-01 | Session dibuat setelah login | ACTIVE |
| SES-02 | Session record | tokenHash, bukan raw token |
| SES-03 | validateSession token valid | success + public user |
| SES-04 | token kosong | gagal |
| SES-05 | token tidak valid | gagal |
| SES-06 | session status non-ACTIVE | gagal |
| SES-07 | absolute TTL terlewati | session berakhir |
| SES-08 | idle timeout terlewati | session berakhir |
| SES-09 | valid session activity | last activity dapat diperbarui sesuai mekanisme existing |
| SES-10 | logout | session menjadi LOGOUT |
| SES-11 | token setelah logout | tidak valid |
| PWD-01 | password lama benar | password dapat diubah |
| PWD-02 | password lama salah | gagal |
| PWD-03 | password baru < 6 karakter | gagal |
| PWD-04 | password baru sama dengan password lama | gagal |
| PWD-05 | password berubah | salt/hash baru |
| PWD-06 | password berubah | mustChangePassword=false |
| PWD-07 | password berubah | session lain dicabut |
| PUB-01 | publicUser response | hanya field yang diizinkan |
| PUB-02 | response login | tidak mengandung password/hash/salt |
| SEC-01 | token di URL | prohibited |
| SEC-02 | token di service-worker cache | prohibited |
| SEC-03 | token di public config | prohibited |
| SEC-04 | token di ordinary log | prohibited |
| SEC-05 | bridge allowlist dianggap authorization | prohibited |
| SEC-06 | PWA menentukan role authorization | prohibited |

## Static verification result

Source inspection confirms:
- login flow exists;
- server-side session creation exists;
- token hash is stored in SESSIONS;
- absolute TTL and idle timeout exist;
- logout invalidation exists;
- password change and other-session revocation exist;
- login throttling exists;
- public user sanitization exists;
- no authentication source change is required for this contract lock.

## Runtime verification boundary

Runtime authentication tests must be performed in the TEST Apps Script environment created under Tahap 7A.

Production is not used as a test environment.

**Tahap 8 contract synchronization: COMPLETE.**
