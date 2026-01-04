/**
 * Service Worker
 * Versão: 2.0.0 (Multi-week)
 */

const CACHE_NAME = 'treino-v2';

// Lista APENAS arquivos essenciais que sabemos que existem
const ASSETS = [
  './',
  './index.html',
  './src/main.js',
  './src/app.js',
];

// Install: tenta cachear, mas não falha se algum arquivo não existir
self.addEventListener('install', event => {
  console.log('⚙️ Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Service Worker: Caching core assets...');
        
        // Cacheia arquivos um por um, ignorando falhas
        return Promise.allSettled(
          ASSETS.map(url => 
            cache.add(url).catch(err => {
              console.warn('⚠️ Falha ao cachear:', url);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Core assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker: Install failed', error);
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

// Fetch: Network First com fallback para cache
self.addEventListener('fetch', event => {
  // Ignora requests não-GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignora URLs especiais
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  // Ignora PDF.js CDN (sempre buscar da rede)
  if (event.request.url.includes('cdnjs.cloudflare.com')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se resposta OK, atualiza cache em background
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            })
            .catch(() => {
              // Ignora erros de cache
            });
        }
        
        return response;
      })
      .catch(() => {
        // Network falhou, busca no cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log('📦 Servindo do cache:', event.request.url);
              return cachedResponse;
            }
            
            // Se é navegação e não tem cache, retorna index.html
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            // Retorna resposta offline genérica
            return new Response('Offline - Conteúdo não disponível', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Message: permite controle via postMessage
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Service Worker: Skipping waiting...');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Service Worker: Clearing cache...');
    caches.delete(CACHE_NAME);
  }
});
