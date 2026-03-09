const CACHE_NAME = 'ind-esports-v2';

// Identity provider URLs to never cache or intercept
const IDENTITY_URLS = [
  'identity.ic0.app',
  'identity.internetcomputer.org',
  'internetcomputer.org',
  'identity.icp0.io',
];

function isIdentityRequest(url) {
  return IDENTITY_URLS.some((domain) => url.includes(domain));
}

function isCacheableAsset(url) {
  // Only cache static assets: JS, CSS, images, fonts, wasm
  return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|wasm)(\?.*)?$/.test(url);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/index.html']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Never intercept non-GET requests
  if (event.request.method !== 'GET') return;

  // Never intercept Internet Identity requests
  if (isIdentityRequest(url)) return;

  // Never intercept cross-origin requests
  if (!url.startsWith(self.location.origin)) return;

  // Never intercept HTML navigation requests (let the app handle routing)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Only serve cached index.html when truly offline
        return caches.match('/index.html');
      })
    );
    return;
  }

  // For static assets only: cache-first strategy
  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // For all other requests (API calls, canister calls, etc.) — pass through, no caching
});
