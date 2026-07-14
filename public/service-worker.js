const CACHE_NAME = "eff-academy-app-v1";
const APP_SHELL = [
  "/",
  "/register",
  "/quiz",
  "/dashboard",
  "/offline",
  "/manifest.webmanifest",
  "/app-icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

function isSameOriginGet(request) {
  const url = new URL(request.url);
  return request.method === "GET" && url.origin === self.location.origin;
}

function shouldSkipCache(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith("/api/");
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match("/offline");
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  const cache = await caches.open(CACHE_NAME);
  const fetchPromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => cachedResponse || caches.match("/offline"));

  return cachedResponse || fetchPromise;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!isSameOriginGet(request) || shouldSkipCache(request)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
