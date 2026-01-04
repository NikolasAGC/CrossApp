/**
 * Entry point da aplicação
 * Registra Service Worker e inicializa app
 */

import { init } from './app.js';

// Registra Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(reg => console.log('✅ Service Worker registrado:', reg.scope))
      .catch(err => console.error('❌ Erro no Service Worker:', err));
  });
}

// Inicializa aplicação
init();
