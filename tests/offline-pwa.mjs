import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const outDir = new URL("../out/", import.meta.url).pathname;
const offlineManifest = JSON.parse(await readFile(join(outDir, "offline-manifest.json"), "utf8"));
const basePath = offlineManifest.basePath || "";
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
};
const missingRequests = [];

function safeFilePath(pathname) {
  let local = pathname;
  if (basePath && local.startsWith(basePath)) local = local.slice(basePath.length) || "/";
  if (local.endsWith("/")) local += "index.html";
  const file = normalize(join(outDir, decodeURIComponent(local)));
  return file.startsWith(outDir) ? file : null;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  if (url.pathname === "/seed/") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end("<!doctype html><title>seed</title>");
    return;
  }
  const file = safeFilePath(url.pathname);
  try {
    if (!file || !(await stat(file)).isFile()) throw new Error("not found");
    response.writeHead(200, {
      "content-type": types[extname(file)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(await readFile(file));
  } catch {
    missingRequests.push(url.pathname);
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
  args: process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
    : undefined,
});

try {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();

  await page.goto(`${origin}/seed/`);
  await page.evaluate(async () => {
    const cache = await caches.open("unrelated-pages-project");
    await cache.put("/unrelated", new Response("keep"));
  });

  await page.goto(`${origin}${basePath}/`, { waitUntil: "domcontentloaded" });
  try {
    const activation = await page.evaluate(async () => Promise.race([
      navigator.serviceWorker.ready.then((registration) => ({ ready: true, state: registration.active?.state })),
      new Promise((resolve) => setTimeout(() => resolve({ ready: false }), 20000)),
    ]));
    if (!activation.ready) throw new Error("Service Worker did not activate within 20 seconds");
    if (!await page.evaluate(() => Boolean(navigator.serviceWorker.controller))) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 15000 });
    }
  } catch (error) {
    const registrations = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map((registration) => ({
      scope: registration.scope,
      active: registration.active?.state,
      waiting: registration.waiting?.state,
      installing: registration.installing?.state,
    })));
    const workers = await Promise.all(context.serviceWorkers().map(async (worker) => ({
      url: worker.url(),
      debug: await worker.evaluate(() => self.__JAPAN_PWA_DEBUG ?? null).catch((reason) => String(reason)),
    })));
    throw new Error(`PWA activation failed: ${JSON.stringify({ registrations, workers, missingRequests })}`, { cause: error });
  }

  const status = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => reject(new Error("PWA status timeout")), 30000);
      channel.port1.onmessage = (event) => { clearTimeout(timeout); resolve(event.data); };
      registration.active.postMessage({ type: "GET_STATUS" }, [channel.port2]);
    });
  });
  assert.equal(status.ready, true);
  assert.equal(status.cached, status.total);

  const unrelatedCacheSurvived = await page.evaluate(() => caches.has("unrelated-pages-project"));
  assert.equal(unrelatedCacheSurvived, true, "activation must not delete caches belonging to another Pages project");

  await context.setOffline(true);
  const routes = offlineManifest.routes.filter((route) => !route.endsWith("404.html"));
  for (const route of routes) {
    const response = await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200, `${route} should open offline`);
    assert.match(await page.locator("body").innerText(), /Япония|Осака|Пекин|Бронирования|Гастрономия|Шопинг|Транспорт|Карман|План Б/);
  }

  await context.close();
  console.log(`Offline PWA: ${routes.length} страниц открылись без сети; чужой кэш сохранён.`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
