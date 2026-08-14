const BUILD_ID = __BUILD_ID__;
const TRIP_VERSION = __TRIP_VERSION__;
const PRECACHE_URLS = __PRECACHE_URLS__;
const CACHE_PREFIX = "japan-2026-";
const PRECACHE_PREFIX = `${CACHE_PREFIX}precache-`;
const RUNTIME_PREFIX = `${CACHE_PREFIX}runtime-`;
const PRECACHE_CACHE = `${PRECACHE_PREFIX}${BUILD_ID}`;
const RUNTIME_CACHE = `${RUNTIME_PREFIX}${BUILD_ID}`;
const SCOPE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const DEBUG_STATE = { stage: "boot", index: 0, url: "", error: "" };
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
  await caches.delete(PRECACHE_CACHE);
  const cache = await caches.open(PRECACHE_CACHE);
  try {
    await putBatch(cache, PRECACHE_URLS);
  } catch (error) {
    DEBUG_STATE.stage = "failed";
    DEBUG_STATE.error = error instanceof Error ? error.message : String(error);
    await caches.delete(PRECACHE_CACHE);
    throw error;
  }
}

async function ownPrecacheNames() {
  return (await caches.keys()).filter((name) => name.startsWith(PRECACHE_PREFIX));
}

async function previousPrecacheName() {
  const names = (await ownPrecacheNames()).filter((name) => name !== PRECACHE_CACHE);
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
  event.waitUntil(precacheAll().then(() => {
    DEBUG_STATE.stage = "installed";
    return self.skipWaiting();
  }));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanupOwnCaches().then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
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
      const cached = await matchOwn(normalized);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response.ok) (await caches.open(RUNTIME_CACHE)).put(normalized, response.clone());
        return response;
      } catch {
        return await matchOwn(`${self.registration.scope}`) ?? Response.error();
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
