// CarLog Service Worker - Offline PWA Cache & Background Push
const CACHE_NAME = 'carlog-v2.0.1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/draco/draco_wasm_wrapper.js',
  '/draco/draco_decoder.wasm',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon.png',
  '/icons/icon.svg'
];

// Install: Pre-cache app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[CarLog SW] Precache warning:', err);
      });
    })
  );
});

// Activate: Clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Safe helper to ignore CacheStorage quota failures
function safeCachePut(request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic') return;
  const clone = response.clone();
  caches.open(CACHE_NAME)
    .then((cache) => cache.put(request, clone))
    .catch(() => {});
}

// Fetch: Strategy routing
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never intercept third-party APIs (Supabase Auth/DB/Storage, Gemini API, CDNs)
  if (url.origin !== self.location.origin) {
    return;
  }

  // API calls: Network-First with Cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          safeCachePut(event.request, response);
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 3D GLB Models (/models/*.glb): Cache-First with safe quota handling
  if (url.pathname.startsWith('/models/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          safeCachePut(event.request, response);
          return response;
        });
      })
    );
    return;
  }

  // App Shell & Assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          safeCachePut(event.request, networkResponse);
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Push Notifications for Radar Spawn Alerts
self.addEventListener('push', (event) => {
  let data = { title: '🚨 CarLog Radar Alert', body: '¡Un auto raro fue avistado cerca de tu posición!' };
  try {
    if (event.data) data = event.data.json();
  } catch {}

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: { url: '/#radar' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Click Notification: Open App on Radar tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/#radar');
      }
    })
  );
});
