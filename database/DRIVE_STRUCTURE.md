# PSB Fathan Mubina — DRIVE STRUCTURE

Status: LOCKED — TAHAP 5
Date: 2026-10-03

## 1. Authority
Google Drive is the file/document storage authority. Files are managed by authorized Apps Script backend functions; PWA must not directly manipulate Drive.

## 2. Canonical hierarchy
The current setup contract creates/ensures:

PSB Fathan Mubina/
└── 2027-2028/
    ├── Pendaftaran/
    ├── Dokumen Santri/
    ├── Bukti Pembayaran/
    ├── Hasil Seleksi/
    └── Daftar Ulang/

The root folder name is defined by PSB_SETUP.ROOT_FOLDER_NAME and the active-year folder by PSB_SETUP.YEAR_FOLDER_NAME.

## 3. Stored identifiers
The backend stores the Spreadsheet and Drive identifiers in Script Properties, including:
- PSB_SPREADSHEET_ID
- PSB_ROOT_FOLDER_ID
- PSB_DRIVE_ROOT_ID
- PSB_DRIVE_YEAR_ID

These identifiers are backend configuration and must not be placed in public PWA configuration.

## 4. File-domain mapping
- Pendaftaran: registration-related files.
- Dokumen Santri: applicant/candidate supporting documents.
- Bukti Pembayaran: payment proof files.
- Hasil Seleksi: selection-result/report files where applicable.
- Daftar Ulang: re-registration files.

Exact file placement and naming remain controlled by the existing Apps Script functions unless explicitly revised in a later contract change.

## 5. Security rules
1. Drive file IDs and storage internals are not public data.
2. A user may only receive file metadata/links authorized for that role and record.
3. WALI must not receive internal selection-score files or internal evaluation artifacts.
4. Uploads must pass backend validation for authorization, file type/size and target record.
5. Deleting or moving production files requires an authorized backend operation and audit trail where supported.

## 6. Change rule
Do not rename, move, delete, or recreate the canonical folders merely to improve organization. A Drive contract revision must be reviewed before implementation.

## 7. Non-goals of this lock
This document records the existing Drive contract. It does not create folders, move files, or alter Drive data.
