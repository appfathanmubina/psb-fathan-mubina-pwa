(() => {
  'use strict';

  const config = window.PSB_PWA_CONFIG || {};
  const API_URL = String(config.appsScriptWebAppUrl || '').trim();
  const BRIDGE_URL = API_URL ? API_URL + (API_URL.includes('?') ? '&' : '?') + 'bridge=1' : '';
  const SOURCE = 'psb-fm-pwa';
  const BRIDGE_SOURCE = 'psb-fm-api-bridge';
  const DEFAULT_TIMEOUT_MS = Number(config.bridge?.defaultTimeoutMs) || 20000;

  let iframe = null;
  let bridgeContentOrigin = '';
  let readyPromise = null;
  let requestSeq = 0;
  const pending = new Map();

  function assertConfigured() {
    if (!BRIDGE_URL) throw new Error('URL Apps Script Web App belum dikonfigurasi.');
  }

  function ensureIframe() {
    assertConfigured();
    if (iframe && document.documentElement.contains(iframe)) return iframe;
    iframe = document.createElement('iframe');
    iframe.title = 'PSB API Bridge';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    iframe.style.cssText = 'position:fixed;width:1px;height:1px;left:-10px;top:-10px;border:0;opacity:0;pointer-events:none;';
    iframe.src = BRIDGE_URL;
    document.body.appendChild(iframe);
    return iframe;
  }

  function rejectAll(error) {
    for (const [id, item] of pending) {
      clearTimeout(item.timer);
      item.reject(error);
      pending.delete(id);
    }
  }

  window.addEventListener('message', (event) => {
    if (!iframe || event.source !== iframe.contentWindow) return;
    let apiOrigin = '';
    try { apiOrigin = new URL(API_URL).origin; } catch (e) {}
    const trustedOrigins = new Set([apiOrigin, 'https://script.googleusercontent.com']);
    if (!apiOrigin || !trustedOrigins.has(event.origin)) return;

    const data = event.data || {};
    if (data.source !== BRIDGE_SOURCE) return;

    if (data.type === 'ready') {
      bridgeContentOrigin = event.origin;
      window.dispatchEvent(new CustomEvent('psb-bridge-ready', {detail: data}));
      return;
    }
    if (data.type !== 'response') return;

    const id = String(data.id || '');
    const item = pending.get(id);
    if (!item) return;
    pending.delete(id);
    clearTimeout(item.timer);

    if (data.ok) item.resolve(data.result);
    else item.reject(Object.assign(
      new Error(data.error?.message || 'API Bridge gagal.'),
      {code: data.error?.code || 'BRIDGE_ERROR'}
    ));
  });

  function waitForReady(timeoutMs = DEFAULT_TIMEOUT_MS) {
    ensureIframe();
    if (readyPromise) return readyPromise;

    readyPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        window.removeEventListener('psb-bridge-ready', onReady);
        readyPromise = null;
        reject(Object.assign(new Error('API Bridge belum merespons.'), {code: 'BRIDGE_TIMEOUT'}));
      }, timeoutMs);

      function onReady(event) {
        clearTimeout(timer);
        window.removeEventListener('psb-bridge-ready', onReady);
        resolve({success: true, bridgeVersion: event.detail?.bridgeVersion || 'unknown'});
      }

      window.addEventListener('psb-bridge-ready', onReady);
    });
    return readyPromise;
  }

  async function ready(timeoutMs = DEFAULT_TIMEOUT_MS) {
    return waitForReady(timeoutMs);
  }

  async function call(functionName, args = [], options = {}) {
    const fn = String(functionName || '').trim();
    if (!fn) throw new Error('Nama fungsi API kosong.');
    if (!Array.isArray(args)) throw new Error('Argumen API harus berupa array.');
    await waitForReady(Number(options.timeoutMs) || DEFAULT_TIMEOUT_MS);

    const target = iframe.contentWindow;
    const id = 'pwa_' + Date.now().toString(36) + '_' + (++requestSeq).toString(36);
    const timeoutMs = Number(options.timeoutMs) || DEFAULT_TIMEOUT_MS;
    const targetOrigin = bridgeContentOrigin || new URL(API_URL).origin;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(Object.assign(new Error('Permintaan API melewati batas waktu.'), {code: 'API_TIMEOUT'}));
      }, timeoutMs);
      pending.set(id, {resolve, reject, timer});
      target.postMessage({source: SOURCE, type: 'request', id, fn, args}, targetOrigin);
    });
  }

  function reset() {
    if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
    iframe = null;
    bridgeContentOrigin = '';
    readyPromise = null;
    rejectAll(Object.assign(new Error('API Bridge di-reset.'), {code: 'BRIDGE_RESET'}));
  }

  window.PSBApi = Object.freeze({ready, call, reset});
})();