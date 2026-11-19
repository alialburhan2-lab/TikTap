/* IRAQ TRAVEL service worker — keeps Emergency Center pages available offline.
   Network-first for navigation; pages the visitor explicitly saved (and visited
   emergency pages) are served from cache when offline. */
const CACHE = "iraq-travel-offline-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "CACHE_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(
      caches.open(CACHE).then((c) => c.addAll(data.urls)).then(() => event.source && event.source.postMessage({ type: "CACHED" }))
    );
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const isEmergency = /^\/[a-z]{2,3}\/emergency/.test(url.pathname);
  const isStatic = url.pathname.startsWith("/_next/static/");
  if (!isEmergency && !isStatic) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match(url.pathname)))
  );
});
