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

  // IA regression guard: desktop/mobile share the same five semantic top-level sections.
  await page.goto(`${origin}${basePath}/`, { waitUntil: "networkidle" });
  const portraitNav = await page.evaluate(() => ({
    bottomLabels: [...document.querySelectorAll(".bottom-nav a")]
      .filter((node) => getComputedStyle(node).display !== "none")
      .map((node) => node.textContent?.trim()),
  }));
  assert.deepEqual(portraitNav.bottomLabels, ["Сегодня", "Маршрут", "Гиды", "Карман", "Подготовка"], "portrait bottom navigation must match the canonical IA");

  const routes = offlineManifest.routes.filter((route) => !route.endsWith("404.html"));
  const captures = new Map([
    [`${basePath}/`, "home"],
    [`${basePath}/day/`, "days"],
    [`${basePath}/day/sep-25-kyoto/`, "day-kyoto"],
    [`${basePath}/day/sep-24-miyajima/`, "day-hiroshima"],
    [`${basePath}/todo/`, "todo"],
    [`${basePath}/guides/`, "guides"],
    [`${basePath}/food/`, "food"],
    [`${basePath}/shopping/`, "shopping"],
    [`${basePath}/pocket/`, "pocket"],
    [`${basePath}/transport/`, "transport"],
    [`${basePath}/day/sep-20-beijing/`, "day-beijing"],
    [`${basePath}/day/oct-03-chengdu/`, "day-chengdu"],
  ]);

  for (const route of routes) {
    const response = await page.goto(`${origin}${route}`, { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200, `${route} should open directly`);
    const layout = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      headingFonts: [...document.querySelectorAll("h1, h2, h3")].map((node) => getComputedStyle(node).fontFamily),
      h1Count: document.querySelectorAll("h1").length,
      duplicateIds: [...document.querySelectorAll("[id]")].map((node) => node.id).filter((id, index, ids) => ids.indexOf(id) !== index),
      imagesWithoutAlt: [...document.querySelectorAll("img")].filter((node) => !node.hasAttribute("alt")).length,
      unnamedControls: [...document.querySelectorAll("a, button, summary, input")].filter((node) => {
        const input = node instanceof HTMLInputElement ? node.placeholder : "";
        return !(node.getAttribute("aria-label") || node.getAttribute("title") || node.textContent?.trim() || input);
      }).length,
    }));
    assert.ok(layout.document <= layout.viewport, `${route} document overflows: ${layout.document}px > ${layout.viewport}px`);
    assert.ok(layout.body <= layout.viewport, `${route} body overflows: ${layout.body}px > ${layout.viewport}px`);
    assert.ok(layout.headingFonts.every((font) => !/Georgia|Mincho/i.test(font)), `${route} uses a serif/Mincho font for Russian headings`);
    assert.ok(layout.h1Count >= 1, `${route} needs a visible level-one heading`);
    assert.deepEqual(layout.duplicateIds, [], `${route} contains duplicate element IDs`);
    assert.equal(layout.imagesWithoutAlt, 0, `${route} contains images without alt text`);
    assert.equal(layout.unnamedControls, 0, `${route} contains unnamed interactive controls`);

    const capture = captures.get(route);
    if (capture) {
      await page.screenshot({ path: join(screenshotsDir, `${capture}.png`), fullPage: true });
    }
  }

  await context.close();

  const landscapeContext = await browser.newContext({
    viewport: { width: 852, height: 393 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block",
  });
  const landscapePage = await landscapeContext.newPage();
  for (const route of routes) {
    const response = await landscapePage.goto(`${origin}${route}`, { waitUntil: "networkidle" });
    assert.equal(response?.status(), 200, `${route} should open directly in landscape`);
    const layout = await landscapePage.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    assert.ok(layout.document <= layout.viewport, `${route} landscape document overflows: ${layout.document}px > ${layout.viewport}px`);
    assert.ok(layout.body <= layout.viewport, `${route} landscape body overflows: ${layout.body}px > ${layout.viewport}px`);
  }
  await landscapePage.goto(`${origin}${basePath}/day/sep-25-kyoto/`, { waitUntil: "networkidle" });
  await landscapePage.screenshot({ path: join(screenshotsDir, "landscape-day-kyoto.png"), fullPage: true });
  await landscapeContext.close();
  console.log(`Mobile QA: ${routes.length} страниц PASS в portrait 393×852 и landscape 852×393; ${captures.size + 1} ключевых экранов сохранены.`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
