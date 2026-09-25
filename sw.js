const CACHE_NAME = "resume-builder-static-v3";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./default-resume.js",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
const APP_URLS = APP_FILES.map(path => new URL(path, self.registration.scope).href);

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(name => name.startsWith("resume-builder-static-") && name !== CACHE_NAME)
        .map(name => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate" && url.pathname.startsWith(new URL(self.registration.scope).pathname)) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return cache.match(new URL("./index.html", self.registration.scope).href);
      })
    );
    return;
  }

  const assetUrl = `${url.origin}${url.pathname}`;
  if (!APP_URLS.includes(assetUrl)) return;
  event.respondWith(
    caches.match(assetUrl).then(cached => cached || fetch(request))
  );
});
