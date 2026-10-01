(() => {
  'use strict';

  const config = window.PSB_PWA_CONFIG || {};
  const $ = (selector) => document.querySelector(selector);

  function setStatus(message, kind = 'info') {
    const el = $('#app-status');
    if (!el) return;
    el.textContent = message;
    el.dataset.kind = kind;
  }

  async function checkBridge() {
    try {
      const result = await window.PSBApi.ready(12000);
      setStatus('API Bridge aktif · v' + result.bridgeVersion, 'success');
    } catch (error) {
      setStatus('API Bridge belum terhubung. Backend bridge masih pada tahap integrasi.', 'info');
    }
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./service-worker.js', {scope: './'}).catch(() => {});
  }

  function boot() {
    const title = $('#app-name');
    if (title) title.textContent = config.appName || 'PSB Fathan Mubina';
    const version = $('#app-version');
    if (version) version.textContent = 'API Bridge ' + (config.version || '32.2.0');
    const logo = $('#app-logo');
    if (logo && config.brand?.logoUrl) logo.src = config.brand.logoUrl;
    registerServiceWorker();
    checkBridge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once: true});
  } else {
    boot();
  }
})();