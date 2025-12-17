const CACHE_NAME = 'my-pwa-cache-v1';
const URLs_TO_CACHE = [
  '/pwa-demo/',
  '/pwa-demo/index.html',
  '/pwa-demo/manifest.json',
  '/pwa-demo/service-worker.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLs_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((networkResponse) => {
          // Cache GET requests for future use
          if (
            event.request.method === 'GET' &&
            networkResponse &&
            networkResponse.status === 200
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If navigation request fails, serve cached index.html as SPA fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/pwa-demo/index.html');
          }
        });
    })
  );
});
