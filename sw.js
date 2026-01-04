/**
 * Service Worker
 * Versão: 2.0.0 (Multi-week)
 */

const CACHE_NAME = 'treino-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/main.js',
  './src/app.js',
  
  // Core - State
  './src/core/state/store.js',
  './src/core/state/selectors.js',
  
  // Core - Events
  './src/core/events/eventBus.js',
  
  // Core - Utils
  './src/core/utils/date.js',
  './src/core/utils/text.js',
  './src/core/utils/math.js',
  './src/core/utils/validators.js',
  
  // Core - Services
  './src/core/services/prsService.js',
  './src/core/services/loadCalculator.js',
  './src/core/services/workoutService.js',
  './src/core/services/weekService.js',
  
  // Core - Use-cases
  './src/core/usecases/calculateLoads.js',
  './src/core/usecases/copyWorkout.js',
  './src/core/usecases/exportWorkout.js',
  './src/core/usecases/managePRs.js',
  './src/core/usecases/exportPRs.js',
  './src/core/usecases/importPRs.js',
  './src/core/usecases/selectWeek.js',
  
  // Adapters - Storage
  './src/adapters/storage/localStorageAdapter.js',
  './src/adapters/storage/indexedDbAdapter.js',
  './src/adapters/storage/storageFactory.js',
  
  // Adapters - PDF
  './src/adapters/pdf/pdfReader.js',
  './src/adapters/pdf/pdfParser.js',
  './src/adapters/pdf/customPdfParser.js',
  './src/adapters/pdf/pdfRepository.js',
];

// Install: cacheia assets
self.addEventListener('install', event => {
  console.log('⚙️ Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Caching assets...');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Cache failed', error);
      })
  );
});

// Activate: limpa caches antigos
self.addEventListener('activate', event => {
  console.log('⚙️ Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch: Network First (com fallback para cache)
self.addEventListener('fetch', event => {
  // Ignora requests não-GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignora chrome-extension e outras URLs especiais
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se resposta OK, atualiza cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        
        return response;
      })
      .catch(() => {
        // Se network falhar, busca no cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Se não tem cache, retorna página offline genérica
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Message: permite skip waiting via postMessage
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Service Worker: Skipping waiting...');
    self.skipWaiting();
  }
});
