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
  let bridgeReady = false;
  let bridgeReadyVersion = 'unknown';
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
    if (!iframe) return;

    let apiOrigin = '';
    try { apiOrigin = new URL(API_URL).origin; } catch (e) {}

    /*
     * Apps Script HTML Service may wrap Bridge.html in a provider-owned
     * browsing context. The wrapper-safe Bridge implementation posts ready
     * and responses through window.top, which means the message can arrive
     * with event.source === window and event.origin === the PWA origin.
     *
     * Normal bridge messages still arrive from iframe.contentWindow.
     * Accept only these two exact source/origin combinations; never use '*'.
     */
    const pwaOrigin = window.location.origin;

    /*
     * Apps Script may rewrite the Bridge deployment onto a dynamic
     * *.script.googleusercontent.com origin. The exact deployment origin
     * (apiOrigin) is trusted, and the provider host is accepted only when
     * it is exactly a script.googleusercontent.com subdomain.
     *
     * Do not use includes('googleusercontent.com') and never use '*'.
     */
    function isTrustedBridgeOrigin(origin) {
      if (!origin) return false;
      if (origin === apiOrigin) return true;

      try {
        const url = new URL(origin);
        return url.protocol === 'https:' &&
          url.hostname.endsWith('.script.googleusercontent.com');
      } catch (e) {
        return false;
      }
    }

    /*
     * In Apps Script HTML Service, event.source is not stable enough to
     * identify the original Bridge iframe: the runtime may expose a
     * provider-owned WindowProxy instead of iframe.contentWindow.
     *
     * Therefore trust is established by the exact/validated Bridge origin
     * plus the bridge-specific payload source. The bridge itself only
     * emits these messages after getPwaBridgeConfig() succeeds.
     */
    const fromBridgeOrigin = isTrustedBridgeOrigin(event.origin);
    const fromPwaTop = event.source === window && event.origin === pwaOrigin;

    if (!fromBridgeOrigin && !fromPwaTop) return;
    if (!apiOrigin) return;

    const data = event.data || {};
    if (data.source !== BRIDGE_SOURCE) return;

    if (data.type === 'ready') {
      if (!fromBridgeOrigin) return;
      bridgeContentOrigin = event.origin;
      bridgeReady = true;
      bridgeReadyVersion = event.detail?.bridgeVersion || data.bridgeVersion || 'unknown';
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
    if (bridgeReady && iframe && document.documentElement.contains(iframe)) {
      return Promise.resolve({success:true, bridgeVersion:bridgeReadyVersion});
    }
    if (readyPromise) return readyPromise;

    readyPromise = new Promise((resolve, reject) => {
      let settled = false;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        window.removeEventListener('psb-bridge-ready', onReady);
        fn(value);
      };
      const onReady = (event) => {
        finish(resolve, {success:true, bridgeVersion:event.detail?.bridgeVersion || bridgeReadyVersion || 'unknown'});
      };
      const timer = setTimeout(() => {
        readyPromise = null;
        finish(reject, Object.assign(new Error('API Bridge belum merespons.'), {code:'BRIDGE_TIMEOUT'}));
      }, timeoutMs);

      // Pasang listener SEBELUM iframe dibuat agar event ready tidak terlewat.
      window.addEventListener('psb-bridge-ready', onReady);
      try {
        ensureIframe();
        if (bridgeReady) finish(resolve, {success:true, bridgeVersion:bridgeReadyVersion});
      } catch (e) {
        finish(reject, e);
      }
    }).finally(() => {
      if (bridgeReady) readyPromise = null;
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
    bridgeReady = false;
    bridgeReadyVersion = 'unknown';
    rejectAll(Object.assign(new Error('API Bridge di-reset.'), {code: 'BRIDGE_RESET'}));
  }

  window.PSBApi = Object.freeze({ready, call, reset});
})();