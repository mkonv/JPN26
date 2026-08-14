import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);
const outRoot = new URL("../out/", import.meta.url);
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

async function readProject(path) {
  return readFile(new URL(path, projectRoot), "utf8");
}

async function readOutput(path) {
  return readFile(new URL(path, outRoot), "utf8");
}

function outputPathForUrl(url) {
  const parsed = new URL(url, "https://example.test");
  let pathname = decodeURIComponent(parsed.pathname);
  if (basePath && pathname.startsWith(basePath)) pathname = pathname.slice(basePath.length) || "/";
  if (pathname === "/") return "index.html";
  if (pathname.endsWith("/")) return `${pathname.slice(1)}index.html`;
  return pathname.slice(1);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

test("canonical data contains every parallel track and no public booking codes", async () => {
  const enrichment = JSON.parse(await readProject("data/travel-enrichment.json"));
  const trip = JSON.parse(await readProject("data/trip.json"));
  const days = Object.values(enrichment.dayEnrichment);

  assert.equal(enrichment.flights.length, 4);
  assert.deepEqual(enrichment.flights.map((item) => item.flight), ["HU7986", "HU473", "3U3962", "3U3887"]);
  assert.equal(enrichment.additionalHotels.length, 2);
  assert.equal(days.length, 12);
  assert.equal(days.flatMap((day) => day.alternatives).length, 36);
  assert.ok(days.every((day) => day.alternatives.length === 3));
  assert.equal(days.flatMap((day) => day.meals).length, 24);
  assert.equal(days.flatMap((day) => day.meals.flatMap((meal) => meal.options)).length, 68);
  assert.equal(enrichment.foodPassport.filter((dish) => dish.level === "must").length, 14);
  assert.equal(enrichment.foodPassport.filter((dish) => dish.level === "bonus").length, 7);
  assert.ok(trip.days.flatMap((day) => day.secrets ?? []).every((secret) => secret.value === ""));
});

test("static export renders all critical Russian content", async () => {
  const [home, china, food, day, planB] = await Promise.all([
    readOutput("index.html"),
    readOutput("china/index.html"),
    readOutput("food/index.html"),
    readOutput("day/sep-21-osaka/index.html"),
    readOutput("plan-b/index.html"),
  ]);
  const clean = (html) => html.replaceAll("<!-- -->", "");

  assert.doesNotMatch(home, /codex-preview/i);
  assert.match(home, /Пекин → Япония → Чэнду/);
  assert.match(home, /NIPPON · 2026/);
  assert.match(home, /M20 21 17 53M44 21l3 32/);
  assert.match(china, /HU7986/);
  assert.match(china, /3U3962/);
  assert.match(china, /FAIRFIELD BY MARRIOTT BEIJING CAPITAL AIRPORT/);
  assert.match(china, /CROWNE PLAZA CHENGDU CITY CENTER/);
  assert.match(food, /Гастрономическое путешествие/);
  assert.match(clean(food), /14 главных/);
  assert.match(day, /Куда свернуть/);
  assert.match(day, /Где поесть/);
  assert.match(day, /大阪/);
  assert.match(planB, /План Б/);
});

test("generated offline manifest is complete and every URL resolves to an exported file", async () => {
  const manifest = JSON.parse(await readOutput("offline-manifest.json"));
  const htmlFiles = (await walk(outRoot.pathname)).filter((file) => file.endsWith(".html"));

  assert.equal(manifest.routes.length, htmlFiles.length);
  assert.ok(manifest.urls.length >= manifest.routes.length);
  assert.ok(manifest.urls.every((url) => !url.endsWith(".txt")), "RSC payloads are intentionally excluded from the document-navigation PWA");
  assert.ok(manifest.urls.includes(`${basePath}/manifest.webmanifest`));
  assert.ok(manifest.urls.includes(`${basePath}/icon-512-maskable.png`));

  for (const url of manifest.urls) {
    await access(new URL(outputPathForUrl(url), outRoot));
  }
});

test("every exported internal link and asset target exists", async () => {
  const files = (await walk(outRoot.pathname)).filter((file) => file.endsWith(".html"));
  const targets = new Set();
  const attribute = /\b(?:href|src)=["']([^"']+)["']/g;

  for (const file of files) {
    const html = await readFile(file, "utf8");
    for (const match of html.matchAll(attribute)) {
      const value = match[1];
      if (value.startsWith("#") || /^(?:https?:|tel:|mailto:|data:)/.test(value)) continue;
      const parsed = new URL(value, "https://example.test");
      if (basePath && !parsed.pathname.startsWith(basePath)) continue;
      targets.add(outputPathForUrl(value));
    }
  }

  for (const target of targets) await access(new URL(target, outRoot));
});

test("service worker is versioned and scoped to this PWA cache namespace", async () => {
  const [worker, offlineManifest, webManifest] = await Promise.all([
    readOutput("sw.js"),
    readOutput("offline-manifest.json").then(JSON.parse),
    readOutput("manifest.webmanifest").then(JSON.parse),
  ]);

  assert.doesNotMatch(worker, /__BUILD_ID__|__PRECACHE_URLS__/);
  assert.match(worker, new RegExp(offlineManifest.buildId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(worker, /name\.startsWith\(CACHE_PREFIX\)/);
  assert.doesNotMatch(worker, /key !== CACHE/);
  assert.equal(webManifest.short_name, "Япония 2026");
  assert.ok(webManifest.icons.some((icon) => icon.purpose === "maskable"));
});

test("PWA icons have the declared dimensions", async () => {
  async function pngSize(path) {
    const bytes = await readFile(new URL(path, outRoot));
    return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
  }
  assert.deepEqual(await pngSize("icon-192.png"), [192, 192]);
  assert.deepEqual(await pngSize("icon-512.png"), [512, 512]);
  assert.deepEqual(await pngSize("icon-512-maskable.png"), [512, 512]);
  assert.deepEqual(await pngSize("apple-touch-icon.png"), [180, 180]);
});
