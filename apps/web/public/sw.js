const CACHE_NAME = 'tradingo-v4';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/logo/trdn5.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/offline');
          }
          return cached || new Response('Offline', { status: 503 });
        });

      return cached || fetchPromise;
    }),
  );
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'TRADINGO', message: '' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: '/icons/icon-512x512.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
    }),
  );
});