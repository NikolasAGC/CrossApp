/**
 * Service Worker básico
 * Versão: 1.0.0
 * 
 * Cache strategy: Network First (dados sempre frescos)
 */

const CACHE_NAME = 'treino-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/main.js',
  './src/app.js',
  './src/core/state/store.js',
  './src/core/state/selectors.js',
  './src/core/events/eventBus.js',
];

// Install: cacheia assets iniciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: Network First (sempre tenta rede primeiro)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Salva no cache se for sucesso
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request)) // Fallback para cache
  );
});
