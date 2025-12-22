const CACHE = "fibreos-v23";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/icons/widgets-192.png",
  "./assets/icons/widgets-512.png",
  "./assets/icons/music.png",
  "./assets/icons/photos.png",
  "./assets/icons/camera.png",
  "./assets/icons/mail.png",
  "./assets/icons/browser.png",
  "./assets/icons/connect.png",
  "./assets/icons/settings.png",
  "./assets/icons/widgets.png",
  "./assets/icons/calendar.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Network-first for weather API (and any other non-local calls)
  if (!url.origin.includes(self.location.origin)) {
    e.respondWith(fetch(req).catch(() => new Response("", {status: 503})));
    return;
  }
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  })());
});