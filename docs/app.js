(() => {
  'use strict';

  const config = window.PSB_PWA_CONFIG || {};
  const root = document.getElementById('pwaRoot');
  const frame = document.getElementById('appFrame');
  const bootText = document.getElementById('bootText');
  const bootError = document.getElementById('bootError');
  const openApp = document.getElementById('openApp');
  const bootLogo = document.getElementById('bootLogo');

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./service-worker.js', {scope: './'}).catch(() => {});
  }

  function getAppUrl() {
    return String(config.appsScriptWebAppUrl || '').trim();
  }

  function boot() {
    const appUrl = getAppUrl();
    registerServiceWorker();

    if (!appUrl) {
      if (bootText) bootText.textContent = 'URL aplikasi PSB belum dikonfigurasi.';
      if (bootError) bootError.style.display = 'block';
      return;
    }

    if (bootLogo && config.brand?.logoUrl) bootLogo.src = config.brand.logoUrl;
    if (openApp) openApp.href = appUrl;
    if (bootText) bootText.textContent = 'Menghubungkan ke aplikasi PSB...';

    frame.addEventListener('load', () => {
      root.classList.add('loaded');
    }, {once: true});

    frame.addEventListener('error', () => {
      root.classList.add('error');
      if (bootText) bootText.textContent = 'Aplikasi PSB tidak dapat dimuat di dalam PWA.';
    }, {once: true});

    frame.src = appUrl;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once: true});
  } else {
    boot();
  }
})();
