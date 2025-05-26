self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('grocery-tracker-cache').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/_expo/static/js/web/index-c2307de3d8f8a955de2157ec0da421b6.js',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
        // Add other assets as needed
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