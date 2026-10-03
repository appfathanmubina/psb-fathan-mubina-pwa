# PSB Fathan Mubina — DATABASE SCHEMA

Status: LOCKED — TAHAP 5
Date: 2026-10-03
Baseline: PSB_Fathan_Mubina_Stage_32_Deploy_AppsScript_v32.3.5.zip
Canonical baseline SHA-256: 4b2d33602972675f2bc5f53b7f8900248a4499658f2e68df2a0efda41ea4c28c

## 1. Authority
Google Spreadsheet is the database authority. Google Apps Script is the only application data-access layer. PWA must not access Spreadsheet or Drive directly.

## 2. Canonical sheet inventory
The current SetupDatabase.gs defines 28 sheets:

### Core/security
- CONFIG
- USERS
- SESSIONS
- AUDIT_LOG
- NOTIFICATIONS

### Master
- MASTER_TAHUN_AJARAN
- MASTER_GELOMBANG
- MASTER_JENJANG
- MASTER_KELAS
- MASTER_DOKUMEN
- MASTER_JENIS_PEMBAYARAN

### Registration
- REGISTRATIONS
- CANDIDATES
- GUARDIANS
- ADDRESSES
- SCHOOLS
- DOCUMENTS

### Payment
- BILLS
- PAYMENTS
- PAYMENT_VERIFICATIONS

### Selection
- SELECTION_SCHEDULE
- SELECTION_PARTICIPANTS
- SELECTION_SCORES
- SELECTION_RESULTS

### Re-registration, monitoring, communication
- REREGISTRATIONS
- INCIDENTS
- CHAT_THREADS
- CHAT_MESSAGES

## 3. Identity model
Records use application IDs, not Spreadsheet row numbers, as stable identities. The current generator uses a prefix plus a UUID fragment, e.g. USR-..., REG-..., CND-..., DOC-..., BIL-..., PAY-....

## 4. Relationship model
- USERS.userId -> REGISTRATIONS.userId, GUARDIANS.userId, SESSIONS.userId, NOTIFICATIONS.userId, AUDIT_LOG.userId, CHAT_MESSAGES.senderUserId.
- REGISTRATIONS.candidateId -> CANDIDATES.candidateId.
- CANDIDATES.candidateId -> GUARDIANS.candidateId, ADDRESSES.candidateId, SCHOOLS.candidateId.
- REGISTRATIONS.registrationId -> DOCUMENTS.registrationId, BILLS.registrationId, SELECTION_PARTICIPANTS.registrationId, SELECTION_RESULTS.registrationId, REREGISTRATIONS.registrationId, CHAT_THREADS.registrationId.
- BILLS.billId -> PAYMENTS.billId; PAYMENTS.paymentId -> PAYMENT_VERIFICATIONS.paymentId.
- SELECTION_SCHEDULE.scheduleId -> SELECTION_PARTICIPANTS.scheduleId; SELECTION_PARTICIPANTS.participantId -> SELECTION_SCORES.participantId.
- CHAT_THREADS.threadId -> CHAT_MESSAGES.threadId.
- Master IDs are referenced by the corresponding operational records.

## 5. Selection confidentiality
SELECTION_SCORES is internal selection data. WALI users must never receive score, ranking, component, or internal evaluation data. The backend must enforce this; frontend hiding is not authorization.

## 6. Mutation rule
All create/update/delete operations must pass through authorized Apps Script functions. Direct client-side Spreadsheet/Drive mutation is prohibited.

## 7. Schema change rule
No sheet, header, ID semantics, relationship, or storage rule may be changed casually. Any change requires an explicit reviewed database-contract update in a later controlled Tahap.

## 8. Non-goals of this lock
This document does not create, rebuild, migrate, seed, delete, or alter live data. It records the existing contract only.
