self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('grocery-tracker-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        // Add other assets you want to cache
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});