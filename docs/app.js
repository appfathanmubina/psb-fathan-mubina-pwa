(() => {
  'use strict';

  const config = window.PSB_PWA_CONFIG || {};
  const openApp = document.getElementById('openApp');
  const bootLogo = document.getElementById('bootLogo');
  const appUrl = String(config.appsScriptWebAppUrl || '').trim();

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./service-worker.js', {scope: './'}).catch(() => {});
  }

  function openProductionApp(event) {
    if (event) event.preventDefault();
    if (!appUrl) return;
    window.location.assign(appUrl);
  }

  function boot() {
    registerServiceWorker();

    if (bootLogo && config.brand?.logoUrl) bootLogo.src = config.brand.logoUrl;

    if (!appUrl) {
      if (openApp) {
        openApp.textContent = 'URL aplikasi belum tersedia';
        openApp.removeAttribute('href');
        openApp.setAttribute('aria-disabled', 'true');
      }
      return;
    }

    if (openApp) {
      openApp.href = appUrl;
      openApp.target = '_self';
      openApp.addEventListener('click', openProductionApp);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once: true});
  } else {
    boot();
  }
})();
