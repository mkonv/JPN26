import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const outDir = new URL("../out/", import.meta.url).pathname;
const screenshotsDir = new URL("../output/qa/mobile/", import.meta.url).pathname;
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
};

function safeFilePath(pathname) {
  let local = pathname;
  if (basePath && local.startsWith(basePath)) local = local.slice(basePath.length) || "/";
  if (local.endsWith("/")) local += "index.html";
  const file = normalize(join(outDir, decodeURIComponent(local)));
  return file.startsWith(outDir) ? file : null;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const file = safeFilePath(url.pathname);
  try {
    if (!file || !(await stat(file)).isFile()) throw new Error("not found");
    response.writeHead(200, {
      "content-type": types[extname(file)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(await readFile(file));
  } catch {
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

try {
  await mkdir(screenshotsDir, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const routes = offlineManifest.routes.filter((route) => !route.endsWith("404.html"));
  const captures = new Map([
    [`${basePath}/`, "home"],
    [`${basePath}/day/`, "days"],
    [`${basePath}/day/sep-25-kyoto/`, "day-kyoto"],
    [`${basePath}/todo/`, "todo"],
    [`${basePath}/food/`, "food"],
    [`${basePath}/china/`, "china"],
    [`${basePath}/shopping/`, "shopping"],
  ]);

  for (const route of routes) {
    const response = await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200, `${route} should open directly`);
    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      headingFonts: [...document.querySelectorAll("h1, h2, h3")].map((node) => getComputedStyle(node).fontFamily),
    }));
    assert.ok(layout.document <= layout.viewport, `${route} document overflows: ${layout.document}px > ${layout.viewport}px`);
    assert.ok(layout.body <= layout.viewport, `${route} body overflows: ${layout.body}px > ${layout.viewport}px`);
    assert.ok(layout.headingFonts.every((font) => !/Georgia|Mincho/i.test(font)), `${route} uses a serif/Mincho font for Russian headings`);

    const capture = captures.get(route);
    if (capture) {
      await page.screenshot({ path: join(screenshotsDir, `${capture}.png`), fullPage: true });
    }
  }

  await context.close();
  console.log(`Mobile QA: ${routes.length} страниц без горизонтального overflow; ${captures.size} ключевых экранов сохранены.`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
