const CACHE_NAME = "amiko-plas-cache-v2";
const OFFLINE_URL = "/offline.html";

const ASSETS_TO_CACHE = [
  "/",                  // Home
  "/index.html",
  "/about.html",
  "/contact.html",
  "/offline.html",      // Offline fallback
  "/assets/css/style.css",
  "/assets/js/main.js",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-512x512.png"
];

// Install — cache core files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate — clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch — respond with cache or network
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    // For navigation requests, try network first
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL))
    );
  } else {
    // For static files, use cache first
    event.respondWith(
      caches.match(event.request).then((response) => {
        return (
          response ||
          fetch(event.request).then((networkResponse) => {
            if (
              !networkResponse ||
              networkResponse.status !== 200 ||
              networkResponse.type !== "basic"
            ) {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
            return networkResponse;
          })
        );
      })
    );
  }
});

