/**
 * PSB FATHAN MUBINA
 * Code.gs
 * STAGE 19 - END-TO-END QA & BUG HARDENING
 * Based on Stage 18 - Professional UI Refinement
 *
 * QA hardening: draft validation allows optional fields; submit enforces strict required fields;
 * registration edit role is aligned with PSB_REGISTRATION_EDIT_ROLES.
 *
 * Fokus: login No. HP / Email, password hash, session, logout,
 * change password, authorization, brute-force protection, audit.
 */


/*
 * STAGE 32.3 — PWA API BRIDGE INTEGRATION
 * Minimal integration for the GitHub Pages PWA.
 * Existing backend functions remain authoritative for authentication,
 * session validation, role authorization, and business rules.
 */
const PSB_PWA_BRIDGE_VERSION = '32.3.0';

const PSB_PWA_BRIDGE_ALLOWED_FUNCTIONS = Object.freeze([
  'getAppInfo','getPublicConfig','getPublicGallery',
  'login','finalizeLogin','registerWali','validateSession','logout','changePassword',
  'getProductionControlData','setProductionControl','getGoLiveChecklist','createProductionBackup','runSecurityMaintenance',
  'getUserManagementData','adminResetUserPassword','createManualUser','getAuditLogPageData',
  'getAcademicYearLifecycleData','setActiveAcademicYear','getMasterDefinitions','getMasterData','saveMasterItem','deactivateMasterItem',
  'getRegistrationFormOptions','getWaliHomeData','getMyRegistrations','getRegistrationList','getRegistrationDetail',
  'getPaymentPageData','getPaymentsForRegistration','createBill','submitPayment','verifyPayment',
  'getSelectionPageData','createSelectionSchedule','updateSelectionScheduleStatus','addSelectionParticipant','addSelectionParticipantsBulk','updateSelectionParticipantStatus','saveSelectionScore','saveSelectionResult',
  'getAnnouncementPageData','publishAnnouncement',
  'getNotifications','markNotificationRead','markAllNotificationsRead',
  'getChatPageData','getChatThread','openChatThread','sendChatMessage','markChatThreadRead','closeChatThread','cleanupChatRetention','runChatAutomationNow',
  'getCommunicationCenterData','sendCommunication',
  'getReregistrationPageData','openReregistration','finalizeReregistration',
  'getDashboardPageData','getProductionReadiness','getMonitoringPageData','getIncidentPageData','saveIncident','closeIncident',
  'getReportingPageData','getAdvancedReportingData','exportAdvancedReportingCsv',
  'getVerificationQueue','getVerificationDetail','getDocumentOptions','getRegistrationDocuments','getDocumentPageData','uploadDocument','verifyDocument',
  'saveRegistration','submitRegistration','finalizeVerification'
]);

function getPwaBridgeConfig() {
  const raw = String(getConfig_('PWA_ALLOWED_ORIGINS') || '').trim();
  const configured = raw.split(',').map(function(x){ return String(x || '').trim(); }).filter(Boolean);
  const origins = configured.length ? configured : ['https://appfathanmubina.github.io'];
  return {
    success: true,
    bridgeVersion: PSB_PWA_BRIDGE_VERSION,
    appName: getConfig_('APP_NAME') || 'PSB Fathan Mubina',
    allowedOrigins: origins
  };
}

function pwaBridgeCall(functionName, args) {
  const fn = String(functionName || '').trim();
  if (PSB_PWA_BRIDGE_ALLOWED_FUNCTIONS.indexOf(fn) < 0) {
    return {
      success: false,
      code: 'BRIDGE_FUNCTION_NOT_ALLOWED',
      message: 'Fungsi API bridge tidak diizinkan.'
    };
  }

  const callArgs = Array.isArray(args) ? args : [];

  try {
    const handler = globalThis[fn];
    if (typeof handler !== 'function') {
      return {
        success: false,
        code: 'BRIDGE_FUNCTION_NOT_FOUND',
        message: 'Fungsi backend tidak ditemukan.'
      };
    }
    return rpcSafe_(handler.apply(null, callArgs));
  } catch (e) {
    console.error('PWA bridge backend error: ' + e);
    return {
      success: false,
      code: 'BRIDGE_BACKEND_ERROR',
      message: String(e && e.message || 'Terjadi kesalahan pada backend.')
    };
  }
}


const PSB_AUTH = {
  SESSION_TTL_MINUTES: 480,
  SESSION_IDLE_MINUTES: 30,
  MAX_ATTEMPTS: 5,
  LOCK_MINUTES: 10
};

const PSB_ROLES = ['SUPERADMIN','ADMIN_PSB','VERIFIKATOR','SELEKSI','KEUANGAN','WALI'];
const PSB_AUDIT_ACCESS_ROLES = ['SUPERADMIN','ADMIN_PSB'];
const PSB_SECURITY_ADMIN_ROLES = ['SUPERADMIN'];
const PSB_PRODUCTION_ADMIN_ROLES = ['SUPERADMIN','ADMIN_PSB'];
const PSB_PRODUCTION_VERSION = '30.14';
const PSB_COMMUNICATION_ROLES = ['SUPERADMIN','ADMIN_PSB'];
const PSB_COMMUNICATION_RECIPIENT_ROLES = ['WALI','SUPERADMIN','ADMIN_PSB','VERIFIKATOR','SELEKSI','KEUANGAN'];
const PSB_CHAT_ACCESS_ROLES = ['WALI','SUPERADMIN','ADMIN_PSB'];
const PSB_CHAT_ADMIN_ROLES = ['SUPERADMIN','ADMIN_PSB'];

function doGet(e) {
  const bridgeMode = e && e.parameter && String(e.parameter.bridge || '') === '1';
  if (bridgeMode) {
    return HtmlService.createTemplateFromFile('Bridge').evaluate()
      .setTitle('PSB Fathan Mubina — API Bridge')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  const output = HtmlService.createTemplateFromFile('Index').evaluate();

  // PENTING untuk Apps Script HTML Service:
  // meta viewport yang ditulis langsung di Index.html dapat diabaikan oleh
  // sandbox HTML Service. Google mendokumentasikan bahwa viewport harus
  // ditambahkan melalui HtmlOutput.addMetaTag(). Tanpa ini, Android dapat
  // memberi iframe viewport desktop-width sehingga UI terlihat seperti
  // halaman desktop yang diperkecil.
  output.addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover');

  return output
    .setTitle('PSB Fathan Mubina')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAppInfo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const props = PropertiesService.getScriptProperties();
  return {
    success: true,
    appName: 'PSB Fathan Mubina',
    activeYear: getConfig_('ACTIVE_YEAR') || '2027/2028',
    spreadsheetIdConfigured: !!(props.getProperty('PSB_SPREADSHEET_ID') || ss.getId()),
    foundationReady: !!ss.getSheetByName('USERS'),
    authReady: !!ss.getSheetByName('SESSIONS') && !!ss.getSheetByName('AUDIT_LOG')
  };
}


function getPublicGallery(forceRefresh){
  const cache=CacheService.getScriptCache();
  const cacheKey='PSB_PUBLIC_GALLERY_V1';
  if(!forceRefresh){
    const cached=cache.get(cacheKey);
    if(cached){try{return JSON.parse(cached)}catch(e){}}
  }
  const folderId='19rRtc_Lw8NPyoskV3Nkf5EB066MGOG63';
  try{
    const folder=DriveApp.getFolderById(folderId);
    const it=folder.getFiles();
    const items=[];
    while(it.hasNext()){
      const file=it.next();
      const mime=String(file.getMimeType()||'').toLowerCase();
      if(mime.indexOf('image/')!==0) continue;
      items.push({
        id:String(file.getId()),
        name:String(file.getName()||'Foto Fathan Mubina'),
        url:'https://drive.google.com/thumbnail?id='+encodeURIComponent(file.getId())+'&sz=w1200'
      });
      if(items.length>=15) break;
    }
    items.sort((a,b)=>a.name.localeCompare(b.name,'id',{numeric:true,sensitivity:'base'}));
    const result={success:true,items};
    try{cache.put(cacheKey,JSON.stringify(result),300)}catch(e){}
    return result;
  }catch(e){
    console.error(e);
    return {success:false,items:[],message:'Galeri belum dapat dimuat.'};
  }
}

function getPublicConfig(forceRefresh) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'PSB_PUBLIC_CONFIG_V6';
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached) { try { return JSON.parse(cached); } catch (e) {} }
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('CONFIG');
  if (!sheet || sheet.getLastRow() < 2) return { success: true, config: {} };
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  const config = {};
  // Hanya konfigurasi yang memang dibutuhkan browser yang boleh keluar dari server.
  // Konfigurasi internal (session, security, automation, retention, dll.) tetap server-side.
  const PUBLIC_CONFIG_KEYS = new Set([
    'APP_NAME','APP_VERSION','RELEASE_STAGE','ACTIVE_YEAR','ACTIVE_YEAR_ID',
    'MAINTENANCE_MODE','APP_ICON_URL','APP_LOGO_URL'
  ]);
  values.forEach(r => { if (r[0] && PUBLIC_CONFIG_KEYS.has(String(r[0]))) config[String(r[0])] = r[1]; });

  // Jangan resolve Drive asset menjadi Data URL di jalur boot.
  // Frontend memakai APP_ICON_URL / APP_LOGO_URL dari CONFIG secara langsung
  // (dinormalisasi menjadi thumbnail Drive), sehingga URL Database selalu menjadi
  // sumber utama dan perubahan brand tidak tertahan oleh asset Data URL lama.
  config.APP_VERSION = config.APP_VERSION || PSB_PRODUCTION_VERSION;
  config.RELEASE_STAGE = config.RELEASE_STAGE || 'PRODUCTION';
  const result = { success: true, config: config };
  try { cache.put(cacheKey, JSON.stringify(result), 60); } catch (e) {}
  return result;
}

function resolveBrandAssetDataUrl_(rawUrl) {
  const raw = String(rawUrl || '').trim();
  if (!raw) return '';
  if (/^data:image\//i.test(raw) && raw.length <= 100000) return raw;

  // Google Drive file ID from common sharing/view/download/thumbnail URL formats.
  let m = raw.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=|thumbnail\?id=)([A-Za-z0-9_-]{10,})/i);
  if (!m) m = raw.match(/[?&]id=([A-Za-z0-9_-]{10,})/i);
  if (m) {
    try {
      const file = DriveApp.getFileById(m[1]);
      // Ambil file asli terlebih dahulu. Thumbnail Drive kadang tidak tersedia
      // atau berukuran/format yang berbeda sehingga dapat membuat logo jatuh ke fallback FM.
      let blob = null;
      try { blob = file.getBlob(); } catch (e) {}
      if (!blob) { try { blob = file.getThumbnail(); } catch (e) {} }
      const mime = (blob && blob.getContentType()) || file.getMimeType() || '';
      const bytes = blob ? blob.getBytes() : [];
      // Naikkan batas asset agar logo yang sedikit lebih besar tetap bisa
      // di-embed. CacheService tidak wajib berhasil; bila payload terlalu besar
      // hasil tetap dikirim ke frontend pada request aktif.
      if (/^image\//i.test(mime) && bytes.length <= 180000) {
        return 'data:' + mime + ';base64,' + Utilities.base64Encode(bytes);
      }
    } catch (e) {
      // Fall through to an HTTPS fetch / original URL fallback.
    }
  }

  // Also support a normal HTTPS image URL stored in CONFIG. This is only
  // executed for administrator-configured brand assets and is deliberately
  // size-limited. If it cannot be embedded safely, the original URL remains
  // available to the frontend.
  if (/^https?:\/\//i.test(raw)) {
    try {
      const resp = UrlFetchApp.fetch(raw, {muteHttpExceptions:true, followRedirects:true});
      const code = resp.getResponseCode();
      const headers = resp.getHeaders() || {};
      const mime = String(headers['Content-Type'] || headers['content-type'] || '').split(';')[0].trim();
      const blob = resp.getBlob();
      const bytes = blob.getBytes();
      if (code >= 200 && code < 300 && (/^image\//i.test(mime) || /^image\//i.test(blob.getContentType() || '')) && bytes.length <= 180000) {
        const finalMime = mime || blob.getContentType() || 'image/png';
        return 'data:' + finalMime + ';base64,' + Utilities.base64Encode(bytes);
      }
    } catch (e) {}
  }
  return '';
}

// =====================================================
// AUTHENTICATION
// =====================================================

function login(identifier, password) {
  try {
    identifier = String(identifier || '').trim();
    password = String(password || '');
    if (!identifier || !password) return fail_('No. HP/email dan password wajib diisi.');

    const key = normalizeIdentifier_(identifier);
    const lock = getLoginLock_(key);
    if (lock.locked) return fail_('Terlalu banyak percobaan. Silakan coba lagi dalam ' + lock.remainingMinutes + ' menit.');

    const user = findUser_(key);
    if (!user || String(user.status).toUpperCase() !== 'ACTIVE') {
      registerLoginFailure_(key);
      return fail_('Login gagal. Periksa No. HP/email dan password.');
    }

    const hash = hashPassword_(password, user.passwordSalt);
    if (!constantTimeEqual_(hash, user.passwordHash)) {
      registerLoginFailure_(key);
      return fail_('Login gagal. Periksa No. HP/email dan password.');
    }

    clearLoginFailure_(key);
    // Hanya operasi yang wajib untuk menyelesaikan login dilakukan sebelum response.
    // LastLogin dan audit dipindahkan ke best-effort call setelah UI sudah tampil.
    const session = createSession_(user.userId);

    return {
      success: true,
      sessionToken: session.token,
      user: publicUser_(user),
      mustChangePassword: user.mustChangePassword === true || String(user.mustChangePassword).toUpperCase() === 'TRUE'
    };
  } catch (e) {
    console.error(e);
    return fail_('Terjadi kesalahan saat login. Silakan coba lagi.');
  }
}

function finalizeLogin(sessionToken) {
  const result = getSessionUser_(sessionToken, false);
  if (!result.success) return result;
  try { updateLastLogin_(result.user.rowNumber); } catch (e) { console.error(e); }
  try { writeAudit_(result.user.userId, 'LOGIN', 'AUTH', result.user.userId, '', '', 'Login berhasil'); } catch (e) { console.error(e); }
  return { success: true };
}

function registerWali(payload) {
  payload = payload || {};
  const name = String(payload.name || '').trim();
  const phone = String(payload.phone || '').trim();
  const email = String(payload.email || '').trim();
  const password = String(payload.password || '');
  const confirmPassword = String(payload.confirmPassword || '');

  if (!name) return fail_('Nama lengkap wajib diisi.');
  if (!phone && !email) return fail_('No. HP atau Email wajib diisi minimal salah satu.');
  if (phone && normalizePhone_(phone).length < 10) return fail_('No. HP tidak valid.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail_('Format email tidak valid.');
  if (password.length < 6) return fail_('Password minimal 6 karakter.');
  if (password !== confirmPassword) return fail_('Konfirmasi password tidak sama.');

  const phoneNormalized = phone ? normalizePhone_(phone) : '';
  const emailNormalized = email ? email.toLowerCase() : '';
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS');
    if (!sheet) return fail_('Database USERS belum tersedia. Jalankan setupPSBDatabase() terlebih dahulu.');
    const lastRow = sheet.getLastRow();
    const rows = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 15).getValues() : [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (phoneNormalized && String(r[3] || '') === phoneNormalized) return fail_('No. HP sudah terdaftar. Silakan masuk menggunakan No. HP tersebut.');
      if (emailNormalized && String(r[5] || '').toLowerCase() === emailNormalized) return fail_('Email sudah terdaftar. Silakan masuk menggunakan email tersebut.');
    }

    const now = new Date();
    const userId = generateId_('USR');
    const salt = Utilities.getUuid().replace(/-/g, '').substring(0, 32);
    const hash = hashPassword_(password, salt);
    const row = [
      userId, name, phone, phoneNormalized, email, emailNormalized,
      hash, salt, 'WALI', 'ACTIVE', '', '', now, now, false
    ];
    sheet.appendRow(row);
    writeAudit_(userId, 'REGISTER', 'AUTH', userId, '', JSON.stringify({name:name, phone:phoneNormalized, email:emailNormalized, role:'WALI'}), 'Akun WALI baru dibuat tanpa OTP');

    const session = createSession_(userId);
    const user = findUserById_(userId);
    return {
      success: true,
      message: 'Akun WALI berhasil dibuat.',
      sessionToken: session.token,
      user: publicUser_(user),
      mustChangePassword: false
    };
  } finally {
    lock.releaseLock();
  }
}

function getInitialAppData(sessionToken) {
  const result = getSessionUser_(sessionToken, true);
  if (!result.success) return result;
  const user = result.user;
  const roles = String(user.role || '').split(',').map(x => x.trim().toUpperCase()).filter(Boolean);
  const data = {
    success: true,
    ready: true,
    appName: getConfig_('APP_NAME') || 'PSB Fathan Mubina',
    activeYear: getConfig_('ACTIVE_YEAR') || '2027/2028',
    roles: roles
  };
  // Lightweight preload only: do not fetch documents/files/payments here.
  if (roles.indexOf('WALI') >= 0) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PSB_SHEETS.REGISTRATIONS);
    if (sheet && sheet.getLastRow() >= 2) {
      const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
      const rows = sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).getValues();
      data.registrationCount = rows.filter(r => String(r[headers.indexOf('userId')] || '') === String(user.userId)).length;
    } else data.registrationCount = 0;
  }
  return data;
}

function validateSession(sessionToken) {
  const result = getSessionUser_(sessionToken, true);
  if (!result.success) return result;
  return { success: true, user: publicUser_(result.user), expiresAt: result.expiresAt, mustChangePassword: result.user.mustChangePassword === true || String(result.user.mustChangePassword).toUpperCase() === 'TRUE' };
}

function logout(sessionToken) {
  const result = getSessionUser_(sessionToken, false);
  if (!result.success) return { success: true };
  invalidateSession_(result.sessionRow, 'LOGOUT');
  writeAudit_(result.user.userId, 'LOGOUT', 'AUTH', result.user.userId, '', '', 'Logout berhasil');
  return { success: true };
}

function changePassword(sessionToken, currentPassword, newPassword) {
  const result = getSessionUser_(sessionToken, true);
  if (!result.success) return result;
  if (String(newPassword || '').length < 6) return fail_('Password baru minimal 6 karakter.');
  if (String(newPassword) === String(currentPassword || '')) return fail_('Password baru harus berbeda dari password lama.');

  const oldHash = hashPassword_(String(currentPassword || ''), result.user.passwordSalt);
  if (!constantTimeEqual_(oldHash, result.user.passwordHash)) return fail_('Password lama tidak sesuai.');

  const salt = Utilities.getUuid().replace(/-/g, '').substring(0, 32);
  const hash = hashPassword_(String(newPassword), salt);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS');
  sheet.getRange(result.user.rowNumber, 7, 1, 3).setValues([[hash, salt, result.user.role]]);
  sheet.getRange(result.user.rowNumber, 14, 1, 2).setValues([[new Date(), false]]);
  revokeOtherSessionsForUser_(result.user.userId, String(result.sessionRow.rowNumber));
  try { CacheService.getScriptCache().remove('PSB_USER_V3_' + sha256Hex_(String(result.user.phoneNormalized || '').toLowerCase()).substring(0, 32)); } catch (e) {}
  if (result.user.emailNormalized) { try { CacheService.getScriptCache().remove('PSB_USER_V3_' + sha256Hex_(String(result.user.emailNormalized || '').toLowerCase()).substring(0, 32)); } catch (e) {} }
  writeAudit_(result.user.userId, 'CHANGE_PASSWORD', 'AUTH', result.user.userId, '', '', 'Password berhasil diubah');
  return { success: true, message: 'Password berhasil diubah.' };
}

// =====================================================
// AUTHORIZATION HELPERS
// =====================================================

function getCurrentUser(sessionToken) {
  const result = getSessionUser_(sessionToken, true);
  if (!result.success) return result;
  return { success: true, user: publicUser_(result.user) };
}

function hasRole(sessionToken, allowedRoles) {
  const result = getSessionUser_(sessionToken, true);
  if (!result.success) return result;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const userRoles = String(result.user.role || '').split(',').map(r => r.trim().toUpperCase()).filter(Boolean);
  return { success: true, authorized: roles.some(r => userRoles.indexOf(String(r).toUpperCase()) >= 0) };
}

function requireRole_(sessionToken, allowedRoles) {
  const result = getSessionUser_(sessionToken, true);
  if (!result.success) throw new Error(result.message || 'Session tidak valid.');
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const userRoles = String(result.user.role || '').split(',').map(r => r.trim().toUpperCase());
  if (!roles.some(r => userRoles.indexOf(String(r).toUpperCase()) >= 0)) throw new Error('Anda tidak memiliki hak akses untuk tindakan ini.');
  return result.user;
}

function assertRegistrationOpenForNew_() {
  const open = String(getConfig_('REGISTRATION_OPEN') || '').toUpperCase() === 'TRUE';
  if (!open) throw new Error('Pendaftaran sedang ditutup. Draft pendaftaran baru tidak dapat dibuat.');
  const start = String(getConfig_('REGISTRATION_START') || '').trim();
  const end = String(getConfig_('REGISTRATION_END') || '').trim();
  const now = new Date();
  if (start) { const d=new Date(start+'T00:00:00'); if (!isNaN(d.getTime()) && now < d) throw new Error('Pendaftaran belum memasuki tanggal pembukaan.'); }
  if (end) { const d=new Date(end+'T23:59:59'); if (!isNaN(d.getTime()) && now > d) throw new Error('Periode pendaftaran telah berakhir.'); }
  return true;
}

function assertOperationalMutation_(actor) {
  if (!actor) throw new Error('Session tidak valid.');
  const maintenance = String(getConfig_('MAINTENANCE_MODE') || '').toUpperCase() === 'TRUE';
  if (!maintenance) return true;
  if (hasRoleDirect_(actor, ['SUPERADMIN','ADMIN_PSB'])) return true;
  throw new Error('Sistem sedang dalam mode pemeliharaan. Tindakan perubahan data sementara dinonaktifkan.');
}

function productionConfigObject_() {
  const keys = ['APP_NAME','APP_VERSION','RELEASE_STAGE','ACTIVE_YEAR','ACTIVE_YEAR_ID','REGISTRATION_OPEN','REGISTRATION_START','REGISTRATION_END','MAINTENANCE_MODE','TIMEZONE'];
  const out = {};
  keys.forEach(k => out[k] = getConfig_(k));
  if (!out.APP_VERSION) out.APP_VERSION = PSB_PRODUCTION_VERSION;
  if (!out.RELEASE_STAGE) out.RELEASE_STAGE = 'PRODUCTION';
  return out;
}

function getProductionControlData(sessionToken) {
  const actor = requireRole_(sessionToken, PSB_PRODUCTION_ADMIN_ROLES);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const users = sheetRows_(ss.getSheetByName(PSB_SHEETS.USERS));
  const activeSuperadmins = users.filter(u => String(u.status||'').toUpperCase()==='ACTIVE' && String(u.role||'').toUpperCase().split(',').map(x=>x.trim()).indexOf('SUPERADMIN')>=0);
  const mustChange = activeSuperadmins.filter(u => String(u.mustChangePassword||'').toUpperCase()==='TRUE' || u.mustChangePassword===true).length;
  return {success:true, config:productionConfigObject_(), activeSuperadmins:activeSuperadmins.length, superadminsNeedingPasswordChange:mustChange, actorRole:actor.role, generatedAt:new Date().toISOString()};
}

function setProductionControl(sessionToken, payload) {
  const actor = requireRole_(sessionToken, ['SUPERADMIN']);
  payload = payload || {};
  const changes = {};
  const allowed = ['APP_VERSION','RELEASE_STAGE','REGISTRATION_OPEN','REGISTRATION_START','REGISTRATION_END','MAINTENANCE_MODE'];
  allowed.forEach(k => { if (Object.prototype.hasOwnProperty.call(payload,k)) changes[k] = payload[k]; });
  if (changes.RELEASE_STAGE) changes.RELEASE_STAGE = String(changes.RELEASE_STAGE).trim().toUpperCase();
  if (changes.APP_VERSION) changes.APP_VERSION = String(changes.APP_VERSION).trim();
  if (changes.APP_VERSION && !/^\d+\.\d+(?:\.\d+)?(?:[-._A-Za-z0-9]+)?$/.test(changes.APP_VERSION)) return fail_('Format APP_VERSION tidak valid.');
  ['REGISTRATION_OPEN','MAINTENANCE_MODE'].forEach(k => { if (Object.prototype.hasOwnProperty.call(changes,k)) changes[k] = (changes[k]===true || String(changes[k]).toUpperCase()==='TRUE') ? 'TRUE' : 'FALSE'; });
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PSB_SHEETS.CONFIG);
  if (!sheet) return fail_('Sheet CONFIG belum tersedia.');
  const old = productionConfigObject_();
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
  const keyIdx=headers.indexOf('key'), valueIdx=headers.indexOf('value'), updatedIdx=headers.indexOf('updatedAt');
  if (keyIdx<0 || valueIdx<0) return fail_('Struktur CONFIG tidak sesuai.');
  const rows=sheet.getLastRow()>=2?sheet.getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn()).getValues():[];
  const index={}; rows.forEach((r,i)=>index[String(r[keyIdx]||'')]=i+2);
  Object.keys(changes).forEach(k=>{
    const row=index[k];
    if (!row) { const values=new Array(headers.length).fill(''); values[keyIdx]=k; values[valueIdx]=changes[k]; if(updatedIdx>=0) values[updatedIdx]=new Date(); sheet.appendRow(values); }
    else { sheet.getRange(row,valueIdx+1).setValue(changes[k]); if(updatedIdx>=0) sheet.getRange(row,updatedIdx+1).setValue(new Date()); }
    try { CacheService.getScriptCache().remove('PSB_CFG_'+sha256Hex_(k).substring(0,24)); } catch(e){}
  });
  try { CacheService.getScriptCache().remove('PSB_PUBLIC_CONFIG_V5'); CacheService.getScriptCache().remove('PSB_PUBLIC_CONFIG_V4'); } catch(e){}
  writeAudit_(actor.userId,'PRODUCTION_CONFIG_UPDATE','SYSTEM','',JSON.stringify(old),JSON.stringify(productionConfigObject_()),'Konfigurasi produksi diubah oleh SUPERADMIN');
  return {success:true,message:'Kontrol produksi berhasil diperbarui.',config:productionConfigObject_()};
}

function getDataIntegrityReport(sessionToken) {
  const actor = requireRole_(sessionToken, PSB_PRODUCTION_ADMIN_ROLES);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const checks=[];
  const add=(key,label,status,detail,category)=>checks.push({key,label,status,detail,category});
  const rowsBy=name=>sheetRows_(ss.getSheetByName(name));
  const exists=name=>!!ss.getSheetByName(name);
  const refs=[
    ['REGISTRATIONS','userId','USERS','userId'],['REGISTRATIONS','candidateId','CANDIDATES','candidateId'],['REGISTRATIONS','tahunAjaranId','MASTER_TAHUN_AJARAN','tahunAjaranId'],['REGISTRATIONS','gelombangId','MASTER_GELOMBANG','gelombangId'],['REGISTRATIONS','jenjangId','MASTER_JENJANG','jenjangId'],
    ['GUARDIANS','userId','USERS','userId'],['GUARDIANS','candidateId','CANDIDATES','candidateId'],['ADDRESSES','candidateId','CANDIDATES','candidateId'],['SCHOOLS','candidateId','CANDIDATES','candidateId'],
    ['DOCUMENTS','registrationId','REGISTRATIONS','registrationId'],['DOCUMENTS','documentTypeId','MASTER_DOKUMEN','documentTypeId'],['BILLS','registrationId','REGISTRATIONS','registrationId'],['BILLS','paymentTypeId','MASTER_JENIS_PEMBAYARAN','paymentTypeId'],['PAYMENTS','billId','BILLS','billId'],['PAYMENTS','registrationId','REGISTRATIONS','registrationId'],['PAYMENT_VERIFICATIONS','paymentId','PAYMENTS','paymentId'],
    ['SELECTION_SCHEDULE','tahunAjaranId','MASTER_TAHUN_AJARAN','tahunAjaranId'],['SELECTION_PARTICIPANTS','registrationId','REGISTRATIONS','registrationId'],['SELECTION_PARTICIPANTS','scheduleId','SELECTION_SCHEDULE','scheduleId'],['SELECTION_SCORES','participantId','SELECTION_PARTICIPANTS','participantId'],['SELECTION_RESULTS','registrationId','REGISTRATIONS','registrationId'],['REREGISTRATIONS','registrationId','REGISTRATIONS','registrationId']
  ];
  const cache={};
  const getSet=(sheet,field)=>{const k=sheet+'|'+field;if(cache[k])return cache[k]; const set={}; rowsBy(sheet).forEach(r=>{const v=String(r[field]||'').trim();if(v)set[v]=true;}); return cache[k]=set;};
  let orphan=0;
  refs.forEach(([sheet,field,target,targetField])=>{
    if(!exists(sheet)||!exists(target)){ add('ref_'+sheet+'_'+field, sheet+'.'+field+' → '+target+'.'+targetField,'WARNING','Sheet referensi belum tersedia; pemeriksaan dilewati.','References'); return; }
    const targetSet=getSet(target,targetField); const bad=rowsBy(sheet).filter(r=>{const v=String(r[field]||'').trim();return v && !targetSet[v];});
    orphan+=bad.length; add('ref_'+sheet+'_'+field, sheet+'.'+field+' → '+target+'.'+targetField,bad.length?'ERROR':'OK',bad.length?bad.length+' baris memiliki referensi yang tidak ditemukan.':'Semua referensi valid.','References');
  });
  const duplicateSpecs=[['USERS','userId'],['REGISTRATIONS','registrationId'],['CANDIDATES','candidateId'],['DOCUMENTS','documentId'],['BILLS','billId'],['PAYMENTS','paymentId']];
  let dup=0;
  duplicateSpecs.forEach(([sheet,field])=>{const seen={};rowsBy(sheet).forEach(r=>{const v=String(r[field]||'').trim();if(v)seen[v]=(seen[v]||0)+1;});const bad=Object.keys(seen).filter(k=>seen[k]>1);dup+=bad.length;add('dup_'+sheet,sheet+'.'+field,bad.length?'ERROR':'OK',bad.length?'Duplikasi: '+bad.slice(0,8).join(', '):'Tidak ada ID duplikat.','Identifiers');});
  const testTokens=['TEST-','example.test']; let testRows=0; Object.keys(PSB_SHEETS).forEach(k=>{const name=PSB_SHEETS[k];rowsBy(name).forEach(r=>{const joined=Object.keys(r).map(x=>String(r[x]||'')).join('|');if(testTokens.some(t=>joined.indexOf(t)>=0))testRows++;});});
  add('testData','Dummy/test indicators',testRows?'WARNING':'OK',testRows?testRows+' baris terindikasi sebagai data test/dummy.':'Tidak ditemukan indikator TEST-/example.test.','Production');
  add('orphanSummary','Total orphan references',orphan?'ERROR':'OK',orphan?orphan+' referensi orphan ditemukan.':'Tidak ada orphan reference.','Summary');
  add('duplicateSummary','Total kelompok ID duplikat',dup?'ERROR':'OK',dup?dup+' kelompok ID duplikat ditemukan.':'Tidak ada kelompok ID duplikat.','Summary');
  const errors=checks.filter(x=>x.status==='ERROR').length, warnings=checks.filter(x=>x.status==='WARNING').length;
  const result={success:true,checks,summary:{total:checks.length,errors,warnings,ok:checks.length-errors-warnings},productionReady:errors===0,checkedAt:new Date().toISOString()};
  writeAudit_(actor.userId,'DATA_INTEGRITY_CHECK','SYSTEM','', '', JSON.stringify({errors,warnings,orphan,dup}), 'Pemeriksaan integritas data produksi dijalankan');
  return result;
}

function createProductionBackup(sessionToken) {
  const actor=requireRole_(sessionToken,['SUPERADMIN']);
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const props=PropertiesService.getScriptProperties();
  let folder=null; const yearId=String(props.getProperty('PSB_DRIVE_YEAR_ID')||'').trim();
  if(yearId){try{folder=DriveApp.getFolderById(yearId);}catch(e){folder=null;}}
  if(!folder){let root=null;const rootId=String(props.getProperty('PSB_DRIVE_ROOT_ID')||'').trim();if(rootId){try{root=DriveApp.getFolderById(rootId);}catch(e){}} if(root)folder=root;}
  if(!folder) throw new Error('Folder Drive produksi tidak tersedia.');
  const source=DriveApp.getFileById(ss.getId());
  const stamp=Utilities.formatDate(new Date(),getConfig_('TIMEZONE')||'Asia/Jakarta','yyyyMMdd_HHmmss');
  const copy=source.makeCopy('BACKUP_PSB_'+String(getConfig_('ACTIVE_YEAR')||'NA').replace(/[^A-Za-z0-9-]/g,'-')+'_'+stamp,folder);
  writeAudit_(actor.userId,'PRODUCTION_BACKUP','SYSTEM',copy.getId(),'','', 'Backup spreadsheet produksi dibuat');
  return {success:true,message:'Backup spreadsheet berhasil dibuat.',fileId:copy.getId(),fileName:copy.getName(),createdAt:new Date().toISOString()};
}

function getGoLiveChecklist(sessionToken) {
  const actor=requireRole_(sessionToken,PSB_PRODUCTION_ADMIN_ROLES);
  const control=getProductionControlData(sessionToken);
  const readiness=getProductionReadiness(sessionToken);
  const integrity=getDataIntegrityReport(sessionToken);
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const users=sheetRows_(ss.getSheetByName(PSB_SHEETS.USERS));
  const passwordReady=users.some(u=>String(u.role||'').toUpperCase().split(',').map(x=>x.trim()).indexOf('SUPERADMIN')>=0 && String(u.status||'').toUpperCase()==='ACTIVE' && !(u.mustChangePassword===true || String(u.mustChangePassword||'').toUpperCase()==='TRUE'));
  const items=[
    {key:'readiness',label:'Production Readiness tanpa error',ok:readiness.productionReady,detail:readiness.productionReady?'Tidak ada error pada pemeriksaan readiness.':'Masih ada pemeriksaan yang berstatus error.'},
    {key:'integrity',label:'Data integrity tanpa error',ok:integrity.productionReady,detail:integrity.productionReady?'Referensi dan identifier utama sehat.':'Masih ditemukan masalah integritas data.'},
    {key:'superadminPassword',label:'Password SUPERADMIN sudah diganti',ok:passwordReady,detail:passwordReady?'Ada SUPERADMIN aktif yang tidak lagi wajib mengganti password.':'Minimal satu akun SUPERADMIN aktif masih wajib mengganti password.'},
    {key:'version',label:'Versi aplikasi tersedia',ok:!!String(control.config.APP_VERSION||'').trim(),detail:'Versi: '+(control.config.APP_VERSION||'-')},
    {key:'release',label:'Release stage ditetapkan',ok:!!String(control.config.RELEASE_STAGE||'').trim(),detail:'Stage: '+(control.config.RELEASE_STAGE||'-')},
    {key:'testData',label:'Tidak ada indikator dummy/test',ok:!readiness.checks.some(x=>x.key==='testData'&&x.status==='WARNING'),detail:readiness.checks.find(x=>x.key==='testData')?.detail||'Tidak ada indikator test.'},
    {key:'maintenance',label:'Maintenance mode tidak aktif',ok:String(control.config.MAINTENANCE_MODE||'').toUpperCase()!=='TRUE',detail:String(control.config.MAINTENANCE_MODE||'').toUpperCase()==='TRUE'?'Maintenance mode sedang aktif.':'Sistem tidak berada dalam maintenance mode.'},
    {key:'registration',label:'Status pendaftaran dikonfirmasi',ok:true,detail:String(control.config.REGISTRATION_OPEN||'').toUpperCase()==='TRUE'?'Pendaftaran OPEN.':'Pendaftaran CLOSED.'}
  ];
  const errors=items.filter(x=>!x.ok).length;
  return {success:true,items,summary:{total:items.length,ready:items.length-errors,blocked:errors},productionReady:errors===0,generatedAt:new Date().toISOString(),actor:actor.userId};
}

function assertRegistrationAccess_(actor, registration, adminRoles) {
  if (!actor || !registration) throw new Error('Pendaftaran tidak ditemukan.');
  const elevated = adminRoles || ['SUPERADMIN','ADMIN_PSB'];
  if (canAccessRegistration_(actor, registration) || hasRoleDirect_(actor, elevated)) return true;
  throw new Error('Anda tidak memiliki akses ke pendaftaran ini.');
}

function withScriptLock_(timeoutMs, callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(timeoutMs || 10000);
  try { return callback(); } finally { lock.releaseLock(); }
}

// =====================================================
// SESSION
// =====================================================

function createSession_(userId) {
  const token = Utilities.getUuid() + Utilities.getUuid();
  const tokenHash = sha256Hex_(token);
  const now = new Date();
  const ttl = Number(getConfig_('SESSION_TTL_MINUTES')) || PSB_AUTH.SESSION_TTL_MINUTES;
  const expires = new Date(now.getTime() + ttl * 60000);
  const sessionId = generateId_('SES');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SESSIONS');
  sheet.appendRow([sessionId, userId, tokenHash, now, expires, now, 'ACTIVE']);
  return { token: token, expiresAt: expires.toISOString(), sessionId: sessionId };
}

function getSessionUser_(token, touch) {
  token = String(token || '');
  if (!token) return fail_('Session tidak ditemukan. Silakan login kembali.');

  const cache = CacheService.getScriptCache();
  const sessionCacheKey = 'PSB_SESSION_' + sha256Hex_(token).substring(0, 40);
  const cached = cache.get(sessionCacheKey);
  if (cached) {
    try {
      const c = JSON.parse(cached);
      const nowMs = Date.now();
      if (c.status === 'ACTIVE' && c.expiresAtMs > nowMs) {
        const idleMinutes = Number(c.idleMinutes) || PSB_AUTH.SESSION_IDLE_MINUTES;
        if (!c.lastActivityMs || nowMs - c.lastActivityMs <= idleMinutes * 60000) {
          // Avoid a Spreadsheet write on every validation. Touch at most once per minute.
          if (touch && (!c.lastTouchedMs || nowMs - c.lastTouchedMs >= 60000)) {
            try {
              const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SESSIONS');
              if (sheet && c.rowNumber) sheet.getRange(c.rowNumber, 6).setValue(new Date());
            } catch (e) {}
            c.lastActivityMs = nowMs;
            c.lastTouchedMs = nowMs;
            cache.put(sessionCacheKey, JSON.stringify(c), Math.max(60, Math.ceil((c.expiresAtMs - nowMs) / 1000)));
          }
          return { success: true, user: c.user, sessionRow: { rowNumber: c.rowNumber, row: c.row }, expiresAt: new Date(c.expiresAtMs).toISOString() };
        }
      }
      cache.remove(sessionCacheKey);
    } catch (e) { cache.remove(sessionCacheKey); }
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SESSIONS');
  if (!sheet || sheet.getLastRow() < 2) return fail_('Session tidak ditemukan. Silakan login kembali.');
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();
  const tokenHash = sha256Hex_(token);
  const now = new Date();
  let found = null;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (constantTimeEqual_(String(rows[i][2] || ''), tokenHash)) {
      found = { rowNumber: i + 2, row: rows[i] };
      break;
    }
  }
  if (!found) return fail_('Session tidak valid. Silakan login kembali.');

  const row = found.row;
  const status = String(row[6] || '').toUpperCase();
  if (status !== 'ACTIVE') return fail_('Session sudah berakhir. Silakan login kembali.');
  if (row[4] && new Date(row[4]) <= now) {
    invalidateSession_(found, 'EXPIRED');
    return fail_('Session sudah berakhir. Silakan login kembali.');
  }

  const idleMinutes = Number(getConfig_('SESSION_IDLE_MINUTES')) || PSB_AUTH.SESSION_IDLE_MINUTES;
  const lastActivity = row[5] ? new Date(row[5]) : now;
  if ((now.getTime() - lastActivity.getTime()) > idleMinutes * 60000) {
    invalidateSession_(found, 'IDLE_TIMEOUT');
    return fail_('Session berakhir karena tidak aktif. Silakan login kembali.');
  }

  const user = findUserById_(String(row[1]));
  if (!user || String(user.status).toUpperCase() !== 'ACTIVE') return fail_('Akun tidak aktif.');

  if (touch) sheet.getRange(found.rowNumber, 6).setValue(now);
  const c = {
    status: 'ACTIVE', rowNumber: found.rowNumber, row: row, user: user,
    expiresAtMs: new Date(row[4]).getTime(), lastActivityMs: now.getTime(),
    lastTouchedMs: now.getTime(), idleMinutes: idleMinutes
  };
  try { cache.put(sessionCacheKey, JSON.stringify(c), Math.max(60, Math.ceil((c.expiresAtMs - now.getTime()) / 1000))); } catch (e) {}
  return { success: true, user: user, sessionRow: found, expiresAt: new Date(row[4]).toISOString() };
}

function revokeOtherSessionsForUser_(userId, keepRowNumber) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SESSIONS');
  if (!sheet || sheet.getLastRow() < 2) return 0;
  const lastRow = sheet.getLastRow();
  const rows = sheet.getRange(2,1,lastRow-1,7).getValues();
  const keep = Number(keepRowNumber || 0);
  const now = new Date();
  let count = 0;
  for (let i=0;i<rows.length;i++) {
    const rowNumber=i+2;
    if (rowNumber===keep) continue;
    if (String(rows[i][1]||'')!==String(userId||'')) continue;
    if (String(rows[i][6]||'').toUpperCase()!=='ACTIVE') continue;
    sheet.getRange(rowNumber,7).setValue('REVOKED');
    try { const h=String(rows[i][2]||''); if(h) CacheService.getScriptCache().remove('PSB_SESSION_'+h.substring(0,40)); } catch(e) {}
    count++;
  }
  return count;
}

function cleanupPSBSessions_(limit) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SESSIONS');
  if (!sheet || sheet.getLastRow() < 2) return {processed:0,expired:0,idle:0};
  const max = Math.max(1, Number(limit || getConfig_('SESSION_CLEANUP_BATCH') || 500));
  const lastRow = sheet.getLastRow();
  const rows = sheet.getRange(2,1,lastRow-1,7).getValues();
  const now = new Date();
  const idleMinutes = Number(getConfig_('SESSION_IDLE_MINUTES')) || PSB_AUTH.SESSION_IDLE_MINUTES;
  let processed=0, expired=0, idle=0;
  for(let i=0;i<rows.length && processed<max;i++){
    const status=String(rows[i][6]||'').toUpperCase();
    if(status!=='ACTIVE') continue;
    const expires=rows[i][4]?new Date(rows[i][4]):null;
    const lastSeen=rows[i][5]?new Date(rows[i][5]):rows[i][3]?new Date(rows[i][3]):now;
    let next='';
    if(expires && expires<=now) { next='EXPIRED'; expired++; }
    else if((now.getTime()-lastSeen.getTime())>idleMinutes*60000) { next='IDLE_TIMEOUT'; idle++; }
    if(next){
      sheet.getRange(i+2,7).setValue(next);
      try { const h=String(rows[i][2]||''); if(h) CacheService.getScriptCache().remove('PSB_SESSION_'+h.substring(0,40)); } catch(e) {}
      processed++;
    }
  }
  return {processed:processed,expired:expired,idle:idle};
}

function cleanupPSBSessions() {
  const lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try { return cleanupPSBSessions_(getConfig_('SESSION_CLEANUP_BATCH') || 500); }
  finally { lock.releaseLock(); }
}

function runSecurityMaintenance(sessionToken) {
  const actor=requireRole_(sessionToken, PSB_SECURITY_ADMIN_ROLES);
  const lock=LockService.getScriptLock();
  lock.waitLock(10000);
  let result;
  try { result=cleanupPSBSessions_(getConfig_('SESSION_CLEANUP_BATCH') || 500); }
  finally { lock.releaseLock(); }
  writeAudit_(actor.userId,'SECURITY_MAINTENANCE','SECURITY','', '', JSON.stringify(result), 'Maintenance keamanan dijalankan oleh SUPERADMIN');
  return {success:true, result:result};
}

function invalidateSession_(found, status) {
  if (!found || !found.rowNumber) return;
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('SESSIONS').getRange(found.rowNumber, 7).setValue(status || 'REVOKED');
  try {
    const tokenHash = String((found.row || [])[2] || '');
    if (tokenHash) CacheService.getScriptCache().remove('PSB_SESSION_' + tokenHash.substring(0, 40));
  } catch (e) {}
}

// =====================================================
// USER / PASSWORD
// =====================================================

function findUser_(key) {
  const normalized = String(key || '').toLowerCase();
  if (!normalized) return null;
  const cache = CacheService.getScriptCache();
  const cacheKey = 'PSB_USER_V3_' + sha256Hex_(normalized).substring(0, 32);
  const cached = cache.get(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS');
  if (!sheet || sheet.getLastRow() < 2) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const phoneNormalized = String(r[3] || '').trim().toLowerCase();
    const emailNormalized = String(r[5] || '').trim().toLowerCase();
    const phoneRaw = String(r[2] || '').trim().toLowerCase();
    const emailRaw = String(r[4] || '').trim().toLowerCase();
    // Username legacy/bootstrap (termasuk akun Superadmin) disimpan pada kolom phone.
    // Akun WALI tetap menggunakan phoneNormalized/emailNormalized seperti biasa.
    if (phoneNormalized === normalized || emailNormalized === normalized || phoneRaw === normalized || emailRaw === normalized) {
      const user = userFromRow_(r, i + 2);
      try { cache.put(cacheKey, JSON.stringify(user), 300); } catch (e) {}
      return user;
    }
  }
  return null;
}

function findUserById_(id) {
  const value = String(id || '');
  if (!value) return null;
  const cache = CacheService.getScriptCache();
  const cacheKey = 'PSB_USER_ID_' + sha256Hex_(value).substring(0, 32);
  const cached = cache.get(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS');
  if (!sheet || sheet.getLastRow() < 2) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 15).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === value) {
      const user = userFromRow_(rows[i], i + 2);
      try { cache.put(cacheKey, JSON.stringify(user), 300); } catch (e) {}
      return user;
    }
  }
  return null;
}

function userFromRow_(r, rowNumber) {
  return {
    rowNumber: rowNumber, userId: String(r[0] || ''), name: String(r[1] || ''), phone: String(r[2] || ''),
    phoneNormalized: String(r[3] || ''), email: String(r[4] || ''), emailNormalized: String(r[5] || ''),
    passwordHash: String(r[6] || ''), passwordSalt: String(r[7] || ''), role: String(r[8] || ''), status: String(r[9] || ''),
    photoFileId: String(r[10] || ''), lastLoginAt: r[11], createdAt: r[12], updatedAt: r[13], mustChangePassword: r[14]
  };
}

function publicUser_(u) {
  return { userId: u.userId, name: u.name, phone: u.phone, email: u.email, role: u.role, status: u.status, photoFileId: u.photoFileId || '' };
}

function updateLastLogin_(rowNumber) {
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS').getRange(rowNumber, 12).setValue(new Date());
}

function getUserManagementData(sessionToken) {
  requireRole_(sessionToken, ['SUPERADMIN']);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS');
  if (!sheet || sheet.getLastRow() < 2) return { success: true, users: [], roles: PSB_ROLES.slice() };
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.min(15, sheet.getLastColumn())).getValues();
  const users = rows.map((r, i) => ({
    userId: String(r[0] || ''),
    name: String(r[1] || ''),
    phone: String(r[2] || ''),
    email: String(r[4] || ''),
    role: String(r[8] || ''),
    status: String(r[9] || ''),
    createdAt: r[12] instanceof Date ? r[12].toISOString() : String(r[12] || ''),
    updatedAt: r[13] instanceof Date ? r[13].toISOString() : String(r[13] || ''),
    mustChangePassword: r[14] === true || String(r[14] || '').toUpperCase() === 'TRUE'
  })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { success: true, users: users, roles: PSB_ROLES.slice() };
}

function adminResetUserPassword(sessionToken, payload) {
  const actor = requireRole_(sessionToken, ['SUPERADMIN']);
  assertOperationalMutation_(actor);
  payload = payload || {};

  const userId = String(payload.userId || '').trim();
  const newPassword = String(payload.newPassword || '');
  const confirmPassword = String(payload.confirmPassword || '');
  if (!userId) return fail_('User ID wajib diisi.');
  if (newPassword.length < 6) return fail_('Password baru minimal 6 karakter.');
  if (newPassword !== confirmPassword) return fail_('Konfirmasi password tidak sama.');

  const target = findUserById_(userId);
  if (!target) return fail_('Pengguna tidak ditemukan.');

  const salt = Utilities.getUuid().replace(/-/g, '').substring(0, 32);
  const hash = hashPassword_(newPassword, salt);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS');
  if (!sheet) return fail_('Sheet USERS tidak ditemukan.');

  // USERS: passwordHash=7, passwordSalt=8, role=9, updatedAt=14, mustChangePassword=15.
  sheet.getRange(target.rowNumber, 7, 1, 3).setValues([[hash, salt, target.role]]);
  sheet.getRange(target.rowNumber, 14, 1, 2).setValues([[new Date(), true]]);

  // Password reset oleh SUPERADMIN memaksa seluruh sesi target login ulang.
  const revoked = revokeOtherSessionsForUser_(target.userId, 0);
  try {
    if (target.phoneNormalized) CacheService.getScriptCache().remove('PSB_USER_V3_' + sha256Hex_(String(target.phoneNormalized).toLowerCase()).substring(0, 32));
    if (target.emailNormalized) CacheService.getScriptCache().remove('PSB_USER_V3_' + sha256Hex_(String(target.emailNormalized).toLowerCase()).substring(0, 32));
    CacheService.getScriptCache().remove('PSB_USER_ID_' + sha256Hex_(String(target.userId)).substring(0, 32));
  } catch (e) {}

  writeAudit_(actor.userId, 'RESET_PASSWORD', 'USER', target.userId, '', JSON.stringify({targetUserId:target.userId}), 'SUPERADMIN mereset password pengguna');
  return {success:true, message:'Password pengguna berhasil direset. Pengguna wajib mengganti password saat login berikutnya.', revokedSessions:revoked};
}

function createManualUser(sessionToken, payload) {
  const actor = requireRole_(sessionToken, ['SUPERADMIN']);
  assertOperationalMutation_(actor);
  payload = payload || {};

  const name = String(payload.name || '').trim();
  const phone = String(payload.phone || '').trim();
  const email = String(payload.email || '').trim();
  const password = String(payload.password || '');
  const confirmPassword = String(payload.confirmPassword || '');
  const status = String(payload.status || 'ACTIVE').trim().toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const requestedRoles = Array.isArray(payload.roles) ? payload.roles : String(payload.role || '').split(',');
  const roles = Array.from(new Set(requestedRoles.map(x => String(x || '').trim().toUpperCase()).filter(Boolean)));

  if (!name) return fail_('Nama lengkap wajib diisi.');
  if (!phone && !email) return fail_('No. HP atau Email wajib diisi minimal salah satu.');
  if (phone && normalizePhone_(phone).length < 10) return fail_('No. HP tidak valid.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail_('Format email tidak valid.');
  if (!roles.length) return fail_('Pilih minimal satu role.');
  if (roles.some(r => PSB_ROLES.indexOf(r) < 0)) return fail_('Role akun tidak sesuai dengan role yang tersedia.');
  if (password.length < 6) return fail_('Password minimal 6 karakter.');
  if (password !== confirmPassword) return fail_('Konfirmasi password tidak sama.');

  const phoneNormalized = phone ? normalizePhone_(phone) : '';
  const emailNormalized = email ? email.toLowerCase() : '';
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('USERS');
    if (!sheet) return fail_('Database USERS belum tersedia. Jalankan setupPSBDatabase() terlebih dahulu.');
    const lastRow = sheet.getLastRow();
    const width = Math.max(15, sheet.getLastColumn());
    const rows = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, width).getValues() : [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (phoneNormalized && String(r[3] || '').toLowerCase() === phoneNormalized.toLowerCase()) return fail_('No. HP sudah terdaftar.');
      if (emailNormalized && String(r[5] || '').toLowerCase() === emailNormalized) return fail_('Email sudah terdaftar.');
    }

    const now = new Date();
    const userId = generateId_('USR');
    const salt = Utilities.getUuid().replace(/-/g, '').substring(0, 32);
    const hash = hashPassword_(password, salt);
    const values = [
      userId, name, phone, phoneNormalized, email, emailNormalized,
      hash, salt, roles.join(','), status, '', '', now, now, true
    ];
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
    const canonical = PSB_HEADERS.USERS || [];
    const idx = {};
    canonical.forEach((h, i) => { idx[h] = i; });
    const row = headers.map(h => idx[h] === undefined ? '' : values[idx[h]]);
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([row]);

    if (phoneNormalized) CacheService.getScriptCache().remove('PSB_USER_V3_' + sha256Hex_(phoneNormalized.toLowerCase()).substring(0, 32));
    if (emailNormalized) CacheService.getScriptCache().remove('PSB_USER_V3_' + sha256Hex_(emailNormalized).substring(0, 32));
    writeAudit_(actor.userId, 'CREATE', 'USER', userId, '', JSON.stringify({ name: name, phone: phoneNormalized, email: emailNormalized, role: roles.join(','), status: status }), 'Akun pengguna dibuat manual oleh SUPERADMIN');

    return {
      success: true,
      message: 'Akun pengguna berhasil dibuat. Pengguna wajib mengganti password saat login pertama.',
      user: { userId: userId, name: name, phone: phone, email: email, role: roles.join(','), status: status, mustChangePassword: true }
    };
  } finally {
    lock.releaseLock();
  }
}


function normalizeIdentifier_(identifier) {
  const raw = String(identifier || '').trim();
  if (!raw) return '';
  if (raw.indexOf('@') >= 0) return raw.toLowerCase();
  // Username legacy/bootstrap (mis. Superadmin) bukan nomor telepon.
  // Nomor telepon Indonesia umumnya dimulai +, 0, 8, 62, atau 00.
  if (/^[+0-9][0-9 .()\-]*$/.test(raw)) return normalizePhone_(raw);
  return raw.toLowerCase();
}

function normalizePhone_(phone) {
  let p = String(phone || '').replace(/[^0-9]/g, '');
  if (p.indexOf('00') === 0) p = p.substring(2);
  if (p.indexOf('0') === 0) p = '62' + p.substring(1);
  else if (p.indexOf('8') === 0) p = '62' + p;
  return p;
}

function hashPassword_(password, salt) {
  return sha256Hex_(String(password) + String(salt));
}

function sha256Hex_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return bytes.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
}

function constantTimeEqual_(a, b) {
  a = String(a || ''); b = String(b || '');
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

// =====================================================
// BRUTE FORCE PROTECTION (CacheService)
// =====================================================

function registerLoginFailure_(key) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'PSB_LOGIN_FAIL_V2_' + sha256Hex_(key).substring(0, 32);
  const current = Number(cache.get(cacheKey) || 0) + 1;