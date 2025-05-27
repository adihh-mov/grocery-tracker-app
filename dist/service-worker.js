const CACHE_NAME = 'grocery-tracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/metadata.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/service-worker.js',
  // Add asset files inside /assets if needed, e.g.:
  // '/assets/logo.png',
  // '/assets/other-image.png',
  // Add more as needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});