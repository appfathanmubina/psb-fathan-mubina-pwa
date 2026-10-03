# PSB Fathan Mubina — SHEETS CONTRACT

Status: LOCKED — TAHAP 5
Date: 2026-10-03

This is the canonical header contract extracted from the current SetupDatabase.gs baseline. Header spelling and order are part of the application contract.

| Sheet | Headers, in canonical order |
|---|---|
| CONFIG | key, value, description, updatedAt |
| USERS | userId, name, phone, phoneNormalized, email, emailNormalized, passwordHash, passwordSalt, role, status, photoFileId, lastLoginAt, createdAt, updatedAt, mustChangePassword |
| SESSIONS | sessionId, userId, tokenHash, createdAt, expiresAt, lastSeenAt, status |
| AUDIT_LOG | auditId, timestamp, userId, action, module, recordId, oldValue, newValue, description, ipAddress |
| NOTIFICATIONS | notificationId, userId, title, message, type, isRead, createdAt, readAt |
| MASTER_TAHUN_AJARAN | tahunAjaranId, name, isActive, createdAt, updatedAt |
| MASTER_GELOMBANG | gelombangId, tahunAjaranId, name, startDate, endDate, isActive, createdAt, updatedAt |
| MASTER_JENJANG | jenjangId, name, isActive, createdAt, updatedAt |
| MASTER_KELAS | kelasId, jenjangId, name, isActive, createdAt, updatedAt |
| MASTER_DOKUMEN | documentTypeId, name, required, allowedMimeTypes, maxSizeMb, isActive, createdAt, updatedAt |
| MASTER_JENIS_PEMBAYARAN | paymentTypeId, name, amount, isActive, createdAt, updatedAt |
| REGISTRATIONS | registrationId, registrationNumber, userId, candidateId, tahunAjaranId, gelombangId, jenjangId, status, submittedAt, verifiedAt, completedAt, createdAt, updatedAt |
| CANDIDATES | candidateId, fullName, nik, birthPlace, birthDate, gender, birthOrder, familyStatus, photoFileId, createdAt, updatedAt |
| GUARDIANS | guardianId, userId, candidateId, relationship, fullName, nik, phone, email, occupation, education, isPrimary, createdAt, updatedAt |
| ADDRESSES | addressId, candidateId, addressType, addressLine, rt, rw, village, district, regency, province, postalCode, createdAt, updatedAt |
| SCHOOLS | schoolId, candidateId, schoolName, schoolType, npsn, address, graduationYear, createdAt, updatedAt |
| DOCUMENTS | documentId, registrationId, documentTypeId, fileId, fileName, fileUrl, mimeType, fileSize, status, uploadedAt, verifiedAt, verifiedBy, revisionNote |
| BILLS | billId, registrationId, paymentTypeId, amount, dueDate, status, createdAt, updatedAt |
| PAYMENTS | paymentId, billId, registrationId, amount, method, proofFileId, proofFileUrl, status, submittedAt, createdAt, updatedAt |
| PAYMENT_VERIFICATIONS | verificationId, paymentId, status, verifiedBy, verifiedAt, note |
| SELECTION_SCHEDULE | scheduleId, tahunAjaranId, name, selectionDate, location, isActive, createdAt, updatedAt |
| SELECTION_PARTICIPANTS | participantId, registrationId, scheduleId, status, createdAt, updatedAt |
| SELECTION_SCORES | scoreId, participantId, component, score, note, createdAt, updatedAt |
| SELECTION_RESULTS | resultId, registrationId, status, announcementDate, note, createdAt, updatedAt |
| REREGISTRATIONS | reregistrationId, registrationId, status, completedAt, note, createdAt, updatedAt |
| INCIDENTS | incidentId, category, priority, status, title, description, relatedModule, relatedRecordId, reportedBy, assignedTo, resolutionNote, createdAt, updatedAt, resolvedAt, closedAt |
| CHAT_THREADS | threadId, registrationId, waliUserId, adminUserId, subject, status, lastMessageAt, lastMessageBy, createdAt, updatedAt, closedAt |
| CHAT_MESSAGES | messageId, threadId, senderUserId, senderRole, message, attachmentFileId, attachmentName, attachmentMimeType, isRead, createdAt, readAt |

## Contract rules
1. Header names are case-sensitive at the application-contract level.
2. Header order is canonical for new/empty sheet creation; existing operational code may map by header where explicitly implemented.
3. Do not rename/remove/reorder headers as an ad-hoc fix.
4. New columns require a reviewed contract revision before implementation.
5. Data types are represented according to Apps Script/Sheets conventions; timestamps are Date values where written by backend, booleans may be stored as boolean values, and IDs/statuses are strings unless the existing function specifies otherwise.
6. No credentials, session tokens, or sensitive internal selection data may be exposed through public configuration.
