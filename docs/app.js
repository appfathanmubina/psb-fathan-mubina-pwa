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

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .then(() => setStatus('Aplikasi siap digunakan.', 'success'))
      .catch(() => setStatus('Mode aplikasi tersedia; pembaruan offline belum aktif.', 'info'));
  }

  function boot() {
    const title = $('#app-name');
    if (title) title.textContent = config.appName || 'PSB Fathan Mubina';
    const version = $('#app-version');
    if (version) version.textContent = 'Foundation ' + (config.version || '32.1.0');
    const logo = $('#app-logo');
    if (logo && config.brand?.logoUrl) logo.src = config.brand.logoUrl;
    registerServiceWorker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
