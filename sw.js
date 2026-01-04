/**
 * Service Worker
 * Versão: 1.0.0
 */

const CACHE_NAME = 'treino-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/main.js',
  './src/app.js',
  
  // Core
  './src/core/state/store.js',
  './src/core/state/selectors.js',
  './src/core/events/eventBus.js',
  
  // Core utils
  './src/core/utils/date.js',
  './src/core/utils/text.js',
  './src/core/utils/math.js',
  './src/core/utils/validators.js',
  
  // Core services
  './src/core/services/prsService.js',
  './src/core/services/loadCalculator.js',
  './src/core/services/workoutService.js',
  './src/core/services/weekService.js',
  
  // Core use-cases
  './src/core/usecases/getWorkoutOfDay.js',
  './src/core/usecases/calculateLoads.js',
  './src/core/usecases/copyWorkout.js',
  './src/core/usecases/exportWorkout.js',
  './src/core/usecases/managePRs.js',
  './src/core/usecases/exportPRs.js',
  './src/core/usecases/importPRs.js',
  './src/core/usecases/selectWeek.js',
  
  // Adapters
  './src/adapters/storage/localStorageAdapter.js',
  './src/adapters/storage/indexedDbAdapter.js',
  './src/adapters/storage/storageFactory.js',
  './src/adapters/pdf/pdfReader.js',
  './src/adapters/pdf/pdfParser.js',
  './src/adapters/pdf/pdfRepository.js',
];

// Install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate
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

// Fetch: Network First
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
