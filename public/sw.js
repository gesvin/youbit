const CACHE_NAME = 'youbit-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Instalación del Service Worker y caché de recursos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      })
    );
  });
  self.clients.claim();
});

// Estrategia: Cache-first con fallback a red para peticiones de navegación y assets
self.addEventListener('fetch', (event) => {
  // Omitir peticiones que no sean GET o que provengan de Supabase / APIs externas para manejarlas aparte
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  if (url.origin.includes('supabase.co')) {
    // Red primero, con respaldo en caché o datos locales para Supabase
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Devolver caché y actualizar en segundo plano (stale-while-revalidate indirecto)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});