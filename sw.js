const CACHE_NAME = 'life-app-v1.2.0';
const FILES_TO_CACHE = [
  '/',
  '/index.html'
];

// Install: cache files and activate immediately
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

// Activate: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first (gets updates ASAP)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    scheduleEveningNotification();
  }
});

async function scheduleEveningNotification() {
  const existing = await self.registration.getNotifications();
  existing.forEach(n => n.close());

  const now = new Date();
  const evening = new Date();

  evening.setHours(20, 30, 0, 0);

  if (now > evening) {
    evening.setDate(evening.getDate() + 1);
  }

  const delay = evening.getTime() - now.getTime();

  setTimeout(() => {
    self.registration.showNotification('Keeps', {
      body: 'Pause for a moment. Anything you’d like to keep?',
      tag: 'daily-keeps',
      silent: true
    });
  }, delay);
}
