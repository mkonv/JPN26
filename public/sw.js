const CACHE = "japan-2026-github-v1";
const scopePath = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const withBase = (path) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!scopePath) return normalized;
  return normalized === "/" ? `${scopePath}/` : `${scopePath}${normalized}`;
};

const CORE = [
  withBase("/"),
  withBase("/day/"),
  withBase("/todo/"),
  withBase("/china/"),
  withBase("/food/"),
  withBase("/pocket/"),
  withBase("/manifest.webmanifest"),
  withBase("/favicon.svg"),
  withBase("/icon-192.png"),
  withBase("/icon-512.png")
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_ROUTES" || !Array.isArray(event.data.routes)) return;
  event.waitUntil(caches.open(CACHE).then(async (cache) => {
    for (const route of event.data.routes) {
      try {
        const response = await fetch(route, { cache: "reload" });
        if (response.ok) await cache.put(new URL(response.url).pathname, response.clone());
      } catch {
        // Keep the prior cached copy.
      }
    }
  }));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(new URL(response.url).pathname, copy));
          return response;
        })
        .catch(async () => {
          const candidates = [
            url.pathname,
            url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : `${url.pathname}/`,
            withBase("/")
          ];
          for (const candidate of candidates) {
            const cached = await caches.match(candidate);
            if (cached) return cached;
          }
          return Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
      return response;
    }))
  );
});
