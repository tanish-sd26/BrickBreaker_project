const CACHE_NAME = 'brick-breaker-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',   
  './script.js',  
  './manifest.json',
  './icon.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Fetch Event (Offline support)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});