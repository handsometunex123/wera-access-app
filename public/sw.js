self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open('wera-cache').then((cache) => {
      // Only cache resources that are guaranteed to exist to avoid
      // "Failed to execute 'addAll' on 'Cache': Request failed" errors.
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
      ]);
    })
  );
});

self.addEventListener('activate', () => {
  console.log('Service Worker activating.');
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});