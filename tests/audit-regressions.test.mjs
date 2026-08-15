import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const readText = async (path) => readFile(new URL(path, root), "utf8");

function getDay(trip, id) { return trip.days.find((d) => d.id === id); }
function allActiveRestaurantNames(extra) {
  return Object.values(extra.dayEnrichment).flatMap((d) => d.meals).flatMap((m) => m.options).map((o) => o.name);
}

test("audit baseline: Fuji seats, SmartEX, pass and HARUKA are synchronized", async () => {
  const trip = await readJson("data/trip.json");
  const h = getDay(trip, "sep-27-hakone").timeline.find((x) => x.title.includes("Hikari 642"));
  assert.match(h.detail, /D\+E/);
  assert.match(h.detail, /E — окно/);
  assert.doesNotMatch(h.detail, /A\+B/);
  const ht = trip.bookingTasks.find((x) => x.id === "hikari");
  assert.equal(ht.price, "¥24,200 / 2 человека · оплачено");
  assert.match(ht.action, /после 08:00/);
  assert.match(ht.action, /после 08:00/);
  assert.doesNotMatch(ht.action, /после 14:00|после 10:00/);
  const pass = trip.transport.find((x) => x.title === "Kansai-Hiroshima Area Pass");
  assert.match(pass.detail, /включён/);
  assert.match(pass.detail, /не покупать отдельный полный тариф/);
  const haruka = trip.transport.find((x) => x.title.startsWith("HARUKA"));
  assert.match(haruka.detail, /физический билет/);
  assert.match(haruka.detail, /WEST QR не используем/);
  const harukaTask = trip.bookingTasks.find((x) => x.id === "haruka");
  assert.match(harukaTask.action, /discounted HARUKA One-way Ticket/);
  assert.match(harukaTask.action, /WEST QR не используем/);
});

test("audit baseline: impossible timetable joins and closed alternatives are gone", async () => {
  const trip = await readJson("data/trip.json");
  const extra = await readJson("data/travel-enrichment.json");
  const nara = getDay(trip, "sep-22-nara");
  assert.equal(nara.timeline.find((x) => x.title === "Одна примерка").time, "16:50");
  assert.ok(!extra.dayEnrichment["sep-22-nara"].alternatives.some((x) => x.name === "Nara National Museum"));
  assert.ok(!extra.dayEnrichment["sep-25-kyoto"].alternatives.some((x) => x.name === "Национальный музей Киото"));
  assert.ok(!extra.dayEnrichment["sep-29-tokyo"].alternatives.some((x) => /Ota Memorial|Taro Okamoto/.test(x.name)));
  assert.ok(!extra.dayEnrichment["sep-30-tokyo"].alternatives.some((x) => x.name === "Mitsubishi Ichigokan Museum"));
  const himejiAlt = extra.dayEnrichment["sep-23-himeji"].alternatives.find((x) => x.name.includes("Himeji City Museum of Art"));
  assert.match(himejiAlt.name, /только сад\/экстерьер/);
  assert.match(himejiAlt.swap, /закрыто на реконструкцию/);
});

test("audit baseline: Katsura/Hakone operational timings are corrected", async () => {
  const trip = await readJson("data/trip.json");
  const k = getDay(trip, "sep-26-kyoto");
  assert.equal(k.timeline.find((x) => x.title === "Katsura → Arashiyama").time, "≈12:45");
  assert.ok(k.timeline.some((x) => /Bus 62\/72/.test(x.title)));
  assert.ok(k.timeline.some((x) => x.title === "Arashiyama Bamboo Grove"));
  const hk = getDay(trip, "sep-28-tokyo");
  assert.equal(hk.timeline.find((x) => x.title.includes("Круиз Tōgendai")).time, "11:25");
  assert.equal(hk.timeline.find((x) => x.title === "Hakone Shrine").time, "12:20");
  assert.equal(hk.timeline.find((x) => x.title === "Hotel 1899 · check-in").time, "16:30");
  assert.match(hk.timeline.find((x) => x.title === "Завтрак + багаж").detail, /luggage carry service/);
});

test("audit baseline: Tokyo overlaps, store constraints and NRT security split are explicit", async () => {
  const trip = await readJson("data/trip.json");
  const d29 = getDay(trip, "sep-29-tokyo");
  assert.equal(d29.shopping.window, "12:45–14:35 + 18:30–19:15 · после ужина только при реальном запасе");
  assert.ok(d29.timeline.some((x) => x.time === "19:30" && x.title.includes("Ужин")));
  const d30 = getDay(trip, "sep-30-tokyo");
  assert.equal(d30.timeline.find((x) => x.title === "Edo-Tokyo Museum").time, "14:15");
  assert.match(d30.shopping.stops[0], /Ando Cloisonné/);
  assert.match(d30.shopping.rule, /J\.ANDO держать в списке/);
  assert.ok(d30.shopping.stops.some((x) => /J\.ANDO/.test(x) && /popup\/retailer-watch/.test(x)));
  const jandoTask = trip.bookingTasks.find((x) => x.id === "jando-popup");
  assert.equal(jandoTask.status, "verify");
  const dep = getDay(trip, "oct-02-departure");
  assert.match(dep.timeline.find((x) => x.title === "NRT · терминал 1").detail, /before security/);
  assert.match(dep.timeline.find((x) => x.title === "NRT · терминал 1").detail, /after security/);
});

test("final food policy: operational errors stay blocked, pork is soft preference", async () => {
  const trip = await readJson("data/trip.json");
  const extra = await readJson("data/travel-enrichment.json");
  const names = allActiveRestaurantNames(extra);
  const operationallyForbidden = [
    "Udon-ya Kisuke", "Tsukemen Karabu", "Reichan", "Menya Inoichi Hanare",
    "Kitsuneya", "Ueno Yabu Soba", "Ginza Uchiyama"
  ];
  for (const item of operationallyForbidden) assert.ok(!names.includes(item), `${item} must not return when the audit issue was hours/logistics`);
  assert.ok(names.includes("Ginza Kagari Honten"), "Ginza Kagari should return under soft pork preference");
  assert.ok(names.includes("Hashigo Ginza"), "Hashigo should return under soft pork preference");
  assert.match(extra.meta.foodSafety.title, /soft preference/);
  assert.match(extra.meta.foodSafety.summary, /не строгий запрет/);
  assert.match(extra.meta.foodSafety.ja, /絶対ではありません/);
  const hiraso = extra.dayEnrichment["sep-22-nara"].meals.flatMap((m) => m.options).find((o) => o.name === "Hirasō Naramachi");
  assert.equal(hiraso.pick, true);
  assert.match(hiraso.route, /22\.09\.2026/);
  const hirasoTask = trip.bookingTasks.find((x) => x.id === "hiraso-hours");
  assert.equal(hirasoTask.status, "verify");
  const railTask = trip.bookingTasks.find((x) => x.id === "regional-timetables");
  assert.equal(railTask.status, "action");
  assert.match(railTask.action, /Himeji.*seat reservations/s);
  assert.match(railTask.action, /Nara.*отдельный билет не покупать/s);
});

test("audit baseline: bad restaurant links and China map/shuttle errors are corrected", async () => {
  const extra = await readJson("data/travel-enrichment.json");
  const himeji = extra.dayEnrichment["sep-23-himeji"].meals.flatMap((m) => m.options).find((o) => o.name === "Maneki Ekisoba");
  assert.match(himeji.url, /28049150/);
  const tsukiji = extra.dayEnrichment["sep-30-tokyo"].meals.flatMap((m) => m.options).find((o) => o.name === "Tsukiji Kanno Honten");
  assert.match(tsukiji.url, /13007619/);
  const owariya = extra.dayEnrichment["oct-01-asakusa"].meals.flatMap((m) => m.options).find((o) => o.name === "Owariya Shiten");
  assert.match(owariya.url, /13008597/);
  const shuttle = extra.china.outbound.timeline.find((x) => x.title === "Shuttle к PEK T2");
  assert.equal(shuttle.time, "21.09 · 06:00");
  assert.match(shuttle.detail, /минимум за 2 часа/);
  assert.ok(extra.china.outbound.places.every((x) => x.amap.includes("uri.amap.com")));
  assert.ok(extra.china.return.places.every((x) => x.amap.includes("uri.amap.com")));
  assert.ok(!extra.china.outbound.food.some((x) => /Yao Ji/i.test(x.name)));
  const chengdu = extra.china.return.food.map((x) => `${x.name} ${x.dish} ${x.fit}`).join(" ");
  assert.match(chengdu, /dan dan noodles/);
  assert.match(chengdu, /soft-режиме это допустимо/);
});

function relativeLuminance(hex) {
  const channels = hex.replace("#", "").match(/.{2}/g).map((value) => Number.parseInt(value, 16) / 255);
  const linear = channels.map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test("contrast regression: web decision badges remain readable", async () => {
  const css = await readText("app/globals.css");
  assert.match(css, /\.decision-trigger \{[^}]*background: #e7bd61;[^}]*color: #2d2412;/s);
  assert.ok(contrastRatio("#e7bd61", "#2d2412") >= 7, "web decision trigger must keep AAA-level contrast");
});

test("technical hardening: privacy, China maps, dependency baseline and CI gates", async () => {
  const extra = await readJson("data/travel-enrichment.json");
  const pocket = await readText("app/pocket/page.tsx");
  const secrets = await readText("app/ui/secret-reveal.tsx");
  const layout = await readText("app/layout.tsx");
  const workflow = await readText(".github/workflows/pages.yml");
  const pkg = await readJson("package.json");
  const npmrc = await readText(".npmrc");
  const nextConfig = await readText("next.config.ts");

  assert.ok(extra.additionalHotels.every((hotel) => hotel.mapUrl?.startsWith("https://uri.amap.com/")), "China hotel cards need explicit Amap URLs");
  assert.match(pocket, /hotel\.mapUrl \?\?/);
  assert.doesNotMatch(secrets, /localStorage|useLocalStorageValue|japan-private-code/);
  assert.match(secrets, /Введите код на эту сессию/);
  assert.match(layout, /index: false/);
  assert.match(layout, /follow: false/);
  assert.equal(pkg.dependencies.next, "16.2.11");
  assert.equal(pkg.devDependencies["eslint-config-next"], "16.2.11");
  assert.match(nextConfig, /images:\s*\{\s*unoptimized:\s*true\s*\}/);
  assert.match(workflow, /npm run security:audit/);
  assert.match(workflow, /npm run test:mobile/);
  assert.doesNotMatch(npmrc, /audit=false/);
});

test("technical hardening: PWA hashes worker code, precaches fonts and uses a staging cache", async () => {
  const generator = await readText("scripts/generate-pwa-assets.mjs");
  const worker = await readText("scripts/sw-template.js");
  assert.match(generator, /\.ttf/);
  assert.match(generator, /hash\.update\("sw-template\.js"\)/);
  assert.match(generator, /hash\.update\(templateSource\)/);
  assert.match(worker, /STAGING_CACHE/);
  assert.doesNotMatch(worker, /await caches\.delete\(PRECACHE_CACHE\);/);
});

test("technical hardening: decision marker has non-text contrast and China wording matches soft preference", async () => {
  const css = await readText("app/globals.css");
  const china = await readText("app/china/page.tsx");
  assert.match(css, /\.route-item\.decision \.route-marker \{[^}]*color: #2d2412;/s);
  assert.ok(contrastRatio("#c9962f", "#2d2412") >= 3, "decision route icon must meet 3:1 non-text contrast");
  assert.match(china, /soft preference по свинине/);
  assert.doesNotMatch(china, /Только после проверки состава/);
});
