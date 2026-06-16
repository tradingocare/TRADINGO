const CACHE_NAME = 'tradingo-v1';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/logo/trdn.png',
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event: FetchEvent) => {
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

self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? { title: 'TRADINGO', message: '' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: '/logo/trdn.png',
      badge: '/logo/trdn.png',
      vibrate: [200, 100, 200],
    }),
  );
});
