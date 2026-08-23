const BUILD_ID = __BUILD_ID__;
const TRIP_VERSION = __TRIP_VERSION__;
const PRECACHE_URLS = __PRECACHE_URLS__;
const CACHE_PREFIX = "japan-2026-";
const PRECACHE_PREFIX = `${CACHE_PREFIX}precache-`;
const RUNTIME_PREFIX = `${CACHE_PREFIX}runtime-`;
const PRECACHE_CACHE = `${PRECACHE_PREFIX}${BUILD_ID}`;
const RUNTIME_CACHE = `${RUNTIME_PREFIX}${BUILD_ID}`;
const STAGING_CACHE = `${PRECACHE_CACHE}-install`;
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const DEBUG_STATE = { stage: "boot", index: 0, url: "", error: "", skipWaiting: "idle" };
self.__JAPAN_PWA_DEBUG = DEBUG_STATE;

function isInsideGuide(url) {
  return url.origin === self.location.origin && (!SCOPE_PATH || url.pathname === SCOPE_PATH || url.pathname.startsWith(`${SCOPE_PATH}/`));
}

async function putBatch(cache, urls) {
  for (const [index, url] of urls.entries()) {
    DEBUG_STATE.stage = "fetching";
    DEBUG_STATE.index = index;
    DEBUG_STATE.url = url;
    const request = new Request(url, { cache: "reload", credentials: "same-origin" });
    const response = await fetch(request);
    if (!response.ok) throw new Error(`${response.status} ${url}`);
    DEBUG_STATE.stage = "storing";
    await cache.put(request, response);
  }
  DEBUG_STATE.stage = "stored";
}

async function precacheAll() {
  await caches.delete(STAGING_CACHE);
  const staging = await caches.open(STAGING_CACHE);
  try {
    await putBatch(staging, PRECACHE_URLS);
    const finalCache = await caches.open(PRECACHE_CACHE);
    for (const url of PRECACHE_URLS) {
      const response = await staging.match(url, { ignoreSearch: true });
      if (!response) throw new Error(`staging cache missing ${url}`);
      await finalCache.put(new Request(url, { credentials: "same-origin" }), response);
    }
    await caches.delete(STAGING_CACHE);
  } catch (error) {
    DEBUG_STATE.stage = "failed";
    DEBUG_STATE.error = error instanceof Error ? error.message : String(error);
    await caches.delete(STAGING_CACHE);
    throw error;
  }
}

async function ownPrecacheNames() {
  return (await caches.keys()).filter((name) => name.startsWith(PRECACHE_PREFIX));
}

async function previousPrecacheName() {
  const names = (await ownPrecacheNames()).filter((name) => name !== PRECACHE_CACHE && name !== STAGING_CACHE && !name.endsWith("-install"));
  return names.at(-1) ?? null;
}

async function cleanupOwnCaches() {
  const names = await caches.keys();
  const previous = await previousPrecacheName();
  const keep = new Set([PRECACHE_CACHE, RUNTIME_CACHE, previous].filter(Boolean));
  await Promise.all(names
    .filter((name) => name.startsWith(CACHE_PREFIX) && !keep.has(name))
    .map((name) => caches.delete(name)));
}

async function status() {
  const cache = await caches.open(PRECACHE_CACHE);
  const checks = await Promise.all(PRECACHE_URLS.map((url) => cache.match(url, { ignoreSearch: true })));
  const missing = PRECACHE_URLS.filter((_, index) => !checks[index]);
  return {
    type: "PWA_STATUS",
    ok: missing.length === 0,
    ready: missing.length === 0,
    buildId: BUILD_ID,
    version: TRIP_VERSION,
    cached: PRECACHE_URLS.length - missing.length,
    total: PRECACHE_URLS.length,
    missing,
  };
}

async function ensureAll() {
  const current = await status();
  if (current.ready) return current;
  const cache = await caches.open(PRECACHE_CACHE);
  try {
    await putBatch(cache, current.missing);
    return await status();
  } catch (error) {
    const next = await status();
    return { ...next, ok: false, error: error instanceof Error ? error.message : "Неизвестная ошибка загрузки" };
  }
}

async function matchOwn(request) {
  const current = await caches.open(PRECACHE_CACHE);
  const currentMatch = await current.match(request, { ignoreSearch: true });
  if (currentMatch) return currentMatch;
  const runtime = await caches.open(RUNTIME_CACHE);
  const runtimeMatch = await runtime.match(request, { ignoreSearch: true });
  if (runtimeMatch) return runtimeMatch;
  const previousName = await previousPrecacheName();
  if (!previousName) return undefined;
  return (await caches.open(previousName)).match(request, { ignoreSearch: true });
}

function normalizedNavigationUrl(requestUrl) {
  const url = new URL(requestUrl);
  url.search = "";
  url.hash = "";
  if (!url.pathname.endsWith("/") && !url.pathname.split("/").at(-1)?.includes(".")) url.pathname += "/";
  return url.href;
}

self.addEventListener("install", (event) => {
  DEBUG_STATE.stage = "installing";
  // Request activation immediately; the worker still cannot activate until
  // the atomic precache promise below fulfills. Setting the flag before the
  // longer cache fill avoids a completed worker getting stranded in waiting.
  DEBUG_STATE.skipWaiting = "requested";
  const activationRequest = self.skipWaiting().then(() => {
    DEBUG_STATE.skipWaiting = "resolved";
  }).catch((error) => {
    DEBUG_STATE.skipWaiting = "failed";
    DEBUG_STATE.error = error instanceof Error ? error.message : String(error);
    throw error;
  });
  event.waitUntil(Promise.all([precacheAll(), activationRequest]).then(async () => {
    // Repeat after the cache fill for browsers that defer the first request
    // while the worker is still performing a long install transaction.
    await self.skipWaiting();
    DEBUG_STATE.stage = "installed";
  }));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanupOwnCaches().then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (!event.data?.type || !event.ports[0]) return;
  const reply = event.ports[0];
  if (event.data.type === "GET_STATUS") {
    event.waitUntil(status().then((result) => reply.postMessage(result)));
  }
  if (event.data.type === "CACHE_ALL") {
    event.waitUntil(ensureAll().then((result) => reply.postMessage(result)));
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || !isInsideGuide(url)) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const normalized = normalizedNavigationUrl(request.url);
      try {
        // Online: prefer the deployed HTML so a previously installed PWA cannot
        // pin an old navigation shell after a successful GitHub Pages release.
        const response = await fetch(new Request(request, { cache: "no-store" }));
        if (response.ok) (await caches.open(RUNTIME_CACHE)).put(normalized, response.clone());
        return response;
      } catch {
        // Offline: use this build first, then the previous complete precache.
        return await matchOwn(normalized)
          ?? await matchOwn(`${self.registration.scope}`)
          ?? Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await matchOwn(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) (await caches.open(RUNTIME_CACHE)).put(request, response.clone());
    return response;
  })());
});
