import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const previousOut = process.env.PREVIOUS_FINAL_OUT;
if (!previousOut) throw new Error("PREVIOUS_FINAL_OUT must point to the built previous FINAL export");
const candidateOut = new URL("../out/", import.meta.url).pathname;
const previousManifest = JSON.parse(await readFile(join(previousOut, "offline-manifest.json"), "utf8"));
const candidateManifest = JSON.parse(await readFile(join(candidateOut, "offline-manifest.json"), "utf8"));
const upgradeTimeout = Number(process.env.PWA_UPGRADE_TIMEOUT ?? 60000);
assert.equal(previousManifest.basePath, candidateManifest.basePath, "old and candidate builds must use the same basePath");
assert.notEqual(previousManifest.buildId, candidateManifest.buildId, "candidate needs a distinct PWA build ID");
const basePath = candidateManifest.basePath || "";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ttf": "font/ttf",
};
let activeOut = previousOut;

function safeFilePath(root, pathname) {
  let local = pathname;
  if (basePath && local.startsWith(basePath)) local = local.slice(basePath.length) || "/";
  if (local.endsWith("/")) local += "index.html";
  const file = normalize(join(root, decodeURIComponent(local)));
  return file.startsWith(root) ? file : null;
}

const missingRequests = [];
const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const file = safeFilePath(activeOut, url.pathname);
  try {
    if (!file || !(await stat(file)).isFile()) throw new Error("not found");
    response.writeHead(200, {
      "content-type": types[extname(file)] ?? "application/octet-stream",
      "cache-control": "no-store",
      "service-worker-allowed": `${basePath}/`,
    });
    response.end(await readFile(file));
  } catch {
    missingRequests.push(`${activeOut === previousOut ? "old" : "new"}:${url.pathname}`);
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined;
const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: executablePath
    ? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-webgl"]
    : undefined,
});

async function ensureControlled(page) {
  const ready = await page.evaluate(async () => Promise.race([
    navigator.serviceWorker.ready.then((registration) => Boolean(registration.active)),
    new Promise((resolve) => setTimeout(() => resolve(false), 20000)),
  ]));
  assert.equal(ready, true, "service worker must activate");
  if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 15000 });
  }
}

async function workerStatus(page) {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const close = () => {
        channel.port1.onmessage = null;
        channel.port1.onmessageerror = null;
        channel.port1.close();
      };
      const timeout = setTimeout(() => {
        close();
        reject(new Error("PWA status timeout"));
      }, 30000);
      channel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        close();
        resolve(event.data);
      };
      channel.port1.onmessageerror = () => {
        clearTimeout(timeout);
        close();
        reject(new Error("PWA status response could not be deserialized"));
      };
      if (!registration.active) {
        clearTimeout(timeout);
        close();
        reject(new Error("PWA status unavailable without an active worker"));
        return;
      }
      registration.active.postMessage({ type: "GET_STATUS" }, [channel.port2]);
    });
  });
}

try {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();

  await page.goto(`${origin}${basePath}/`, { waitUntil: "domcontentloaded" });
  await ensureControlled(page);

  // Move away from the home page's offline-status panel before updating. That
  // panel legitimately talks to the active worker while it mounts; beginning
  // an update during those message events creates a browser-dependent
  // activation race and does not represent a settled installed application.
  await page.goto(`${origin}${basePath}/day/sep-24-miyajima/`, { waitUntil: "networkidle" });
  await ensureControlled(page);
  const oldShell = await page.locator("body").innerText();
  assert.match(oldShell, /Место по JR-West Pass/);
  assert.doesNotMatch(oldShell, /Car 4, seats 9-A и 9-B/);
  const oldCache = await page.evaluate(async ({ buildId, urls }) => {
    const name = `japan-2026-precache-${buildId}`;
    const cache = await caches.open(name);
    const entries = await Promise.all(urls.map((url) => cache.match(url, { ignoreSearch: true })));
    return { name, cached: entries.filter(Boolean).length, total: urls.length };
  }, { buildId: previousManifest.buildId, urls: previousManifest.urls });
  assert.equal(oldCache.cached, oldCache.total, `${oldCache.name} must be complete before the upgrade`);
  await page.waitForTimeout(250);

  // Switch the server in place. The browser context, storage, caches and
  // registration remain untouched throughout the upgrade.
  activeOut = candidateOut;
  const appReload = page.waitForEvent("framenavigated", {
    predicate: (frame) => frame === page.mainFrame(),
    timeout: upgradeTimeout,
  }).then(() => true).catch(() => false);
  const controllerChange = await page.evaluate(async (timeout) => {
    const changed = new Promise((resolve) => {
      navigator.serviceWorker.addEventListener("controllerchange", () => resolve(true), { once: true });
      setTimeout(() => resolve(false), timeout);
    });
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    return changed;
  }, upgradeTimeout);
  if (!controllerChange) {
    const registrations = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map((registration) => ({
      scope: registration.scope,
      active: registration.active?.state,
      activeUrl: registration.active?.scriptURL,
      waiting: registration.waiting?.state,
      installing: registration.installing?.state,
    })));
    const workers = await Promise.all(context.serviceWorkers().map(async (worker) => ({
      url: worker.url(),
      debug: await worker.evaluate(() => self.__JAPAN_PWA_DEBUG ?? null).catch((reason) => String(reason)),
      clients: await worker.evaluate(async () => (await self.clients.matchAll({ type: "window", includeUncontrolled: true })).map((client) => ({ id: client.id, url: client.url, focused: client.focused }))).catch((reason) => String(reason)),
    })));
    throw new Error(`candidate worker did not take control: ${JSON.stringify({ registrations, workers, missingRequests })}`);
  }

  // The production registration handler reloads on controllerchange. Wait for
  // that navigation and only reload explicitly when a browser suppresses it.
  if (!await appReload) await page.reload({ waitUntil: "domcontentloaded" });
  else await page.waitForLoadState("domcontentloaded");
  await ensureControlled(page);
  const newStatus = await workerStatus(page);
  assert.equal(newStatus.ready, true);
  assert.equal(newStatus.buildId, candidateManifest.buildId);
  assert.equal(newStatus.version, candidateManifest.version);
  assert.equal(newStatus.cached, newStatus.total);

  await page.goto(`${origin}${basePath}/day/sep-24-miyajima/`, { waitUntil: "domcontentloaded" });
  const shell = await page.locator("body").innerText();
  assert.match(shell, /Car 4, seats 9-A и 9-B/);
  assert.match(shell, /Car 4, seats 8-A и 8-B/);

  const ownCaches = await page.evaluate(async () => (await caches.keys()).filter((name) => name.startsWith("japan-2026-precache-") && !name.endsWith("-install")));
  assert.ok(ownCaches.length >= 2, "the complete previous precache must remain as upgrade fallback");

  await context.setOffline(true);
  const routes = candidateManifest.routes.filter((route) => !route.endsWith("404.html"));
  for (const route of routes) {
    const response = await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200, `${route} should open offline after the upgrade`);
  }
  assert.deepEqual(missingRequests, [], `upgrade server returned 404: ${missingRequests.join(", ")}`);
  await context.close();
  console.log(`PWA upgrade: ${previousManifest.buildId} → ${candidateManifest.buildId}; controllerchange PASS; ${routes.length} candidate routes PASS offline without clearing storage.`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
