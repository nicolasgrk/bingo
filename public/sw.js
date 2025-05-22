const CACHE_NAME = 'quoicoubingo-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/192.png',
  '/512.png',
  // Ajoute ici d'autres assets statiques si besoin
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Cache-first pour les assets statiques
  if (STATIC_ASSETS.some((url) => request.url.endsWith(url))) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }
  // Network-first pour le reste
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(request))
  );
}); 