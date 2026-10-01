(() => {
  'use strict';
  const config = window.PSB_PWA_CONFIG || {};
  const API_URL = String(config.appsScriptWebAppUrl || '').trim();

  function assertConfigured() {
    if (!API_URL) throw new Error('URL Apps Script Web App belum dikonfigurasi.');
  }

  async function call(functionName, args = {}) {
    assertConfigured();
    throw new Error(
      'API Bridge Stage 32.1 belum mengaktifkan RPC. ' +
      'Kontrak backend akan dipasang pada Stage 32.2.'
    );
  }

  window.PSBApi = Object.freeze({ call });
})();
