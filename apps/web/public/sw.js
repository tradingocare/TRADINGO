const CACHE_NAME = 'tradingo-v9';
const OFFLINE_URL = '/offline';
const STATIC_ASSETS = [
  OFFLINE_URL,
  '/logo/trdn5.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
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
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never intercept cross-origin requests (API, analytics). A failed network
  // request must surface as a network error, never a synthetic response that
  // axios reports as an HTTP status.
  if (url.origin !== self.location.origin) return;

  // HTML navigations: network-first so a fresh deploy is served immediately.
  // Only fall back to cache (or the offline page) while offline. Serving HTML
  // cache-first causes hydration mismatches when new JS chunks meet old HTML.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL))),
    );
    return;
  }

  // Static brand assets are stable and safe to serve cache-first.
  const isBrandAsset =
    url.pathname.startsWith('/logo/') || url.pathname.startsWith('/icons/');

  // Build output is only cache-first when the response is explicitly
  // immutable. Production chunks are content-hashed and served with
  // `Cache-Control: public, max-age=31536000, immutable`, so caching them is
  // safe. Dev assets are served under a STABLE url with
  // `Cache-Control: no-cache, must-revalidate`; serving those from cache
  // without revalidation pins a stale stylesheet (e.g. a retired
  // `--bg-base`) in the browser forever, so they must be revalidated.
  const isBuildOutput = url.pathname.startsWith('/_next/static/');

  if (!isBrandAsset && !isBuildOutput) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const immutable =
        cached && /immutable/i.test(cached.headers.get('cache-control') || '');

      if (cached && (immutable || isBrandAsset)) return cached;

      return fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch((error) => {
          if (cached) return cached;
          throw error;
        });
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
