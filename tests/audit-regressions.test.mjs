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
  assert.match(h.detail, /Car 6/);
  assert.match(h.detail, /9-D и 9-E/);
  assert.match(h.detail, /9-E — окно/);
  assert.doesNotMatch(h.detail, /A\+B/);
  const ht = trip.bookingTasks.find((x) => x.id === "hikari");
  assert.equal(ht.price, "¥24,200 / 2 человека · оплачено");
  assert.equal(ht.status, "watch");
  assert.match(ht.action, /SmartEX подтверждён/);
  assert.match(ht.action, /Car 6, seats 9-D\/9-E/);
  assert.match(ht.action, /IC Card for Boarding пока не назначены/);
  assert.match(ht.action, /QR-Tickets/);
  assert.doesNotMatch(ht.action, /после 08:00|после 14:00|после 10:00/);
  const pass = trip.transport.find((x) => x.title === "Kansai-Hiroshima Area Pass");
  assert.match(pass.detail, /Куплен на 22–26 сентября/);
  assert.match(pass.detail, /получить физический pass/);
  assert.match(pass.detail, /без отдельного полного тарифа/);
  const haruka = trip.transport.find((x) => x.title.startsWith("HARUKA"));
  assert.match(haruka.detail, /физический билет/);
  assert.match(haruka.detail, /WEST QR не используем/);
  const harukaTask = trip.bookingTasks.find((x) => x.id === "haruka");
  assert.match(harukaTask.action, /discounted HARUKA One-way Ticket/);
  assert.match(harukaTask.action, /WEST QR не используем/);
});

test("confirmed Hiroshima reserved seats stay closed and synchronized", async () => {
  const trip = await readJson("data/trip.json");
  const day = getDay(trip, "sep-24-miyajima");
  const outbound = day.timeline.find((x) => x.title === "Mizuho 601");
  const inbound = day.timeline.find((x) => x.title === "Sakura 766");
  assert.match(outbound.detail, /Car 4, seats 9-A и 9-B/);
  assert.match(inbound.detail, /Car 4, seats 8-A и 8-B/);
  const task = trip.bookingTasks.find((x) => x.id === "hiroshima-seats");
  assert.equal(task.status, "done");
  assert.match(task.price, /оформлено/);
  assert.match(task.action, /Mizuho 601.*Car 4.*9-A\/9-B/s);
  assert.match(task.action, /Sakura 766.*Car 4.*8-A\/8-B/s);
  const transport = trip.transport.find((x) => x.title === "Hiroshima · reserved seats");
  assert.match(transport.detail, /Mizuho 601.*9-A\/9-B/);
  assert.match(transport.detail, /Sakura 766.*8-A\/8-B/);
});

test("audit baseline: impossible timetable joins and closed alternatives are gone", async () => {
  const trip = await readJson("data/trip.json");
  const extra = await readJson("data/travel-enrichment.json");
  const nara = getDay(trip, "sep-22-nara");
  assert.ok(!nara.timeline.some((x) => x.kind === "shopping"));
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

test("audit baseline: shopping is independent of days and NRT security split is explicit", async () => {
  const trip = await readJson("data/trip.json");
  const shopping = await readJson("data/shopping-guide.json");
  assert.ok(trip.days.every((day) => !("shopping" in day)));
  assert.ok(trip.days.every((day) => day.timeline.every((item) => item.kind !== "shopping")));
  assert.match(shopping.meta.structure, /город.*район.*магазин/s);
  const d30 = getDay(trip, "sep-30-tokyo");
  assert.equal(d30.timeline.find((x) => x.title.includes("Chureito") || x.title.includes("Arakurayama")).time, "09:20");
  assert.match(d30.principle, /Fuji|Фудзи|Kawaguchiko/i);
  assert.ok(!trip.bookingTasks.some((x) => x.id === "jando-popup"));
  const dep = getDay(trip, "oct-02-departure");
  assert.match(dep.timeline.find((x) => x.title === "NRT · терминал 1").detail, /before security/);
  assert.match(dep.timeline.find((x) => x.title === "NRT · терминал 1").detail, /after security/);
});

test("shopping allowlist and confirmed bookings are enforced", async () => {
  const trip = await readJson("data/trip.json");
  const shopping = await readText("data/shopping-guide.json");
  const required = ["Seiko", "G-SHOCK", "CITIZEN", "Onitsuka", "ASICS", "PORTER CLASSIC", "PC KENDO", "UNIQLO", "KAPITAL", "TCB", "cas:pace", "glänta", "MASUNAGA", "KANEKO", "Gyokusendo", "SUWADA", "Kintakedo", "Kazurasei", "hairpin"];
  for (const item of required) assert.match(shopping, new RegExp(item, "i"), `${item} must be present`);
  const forbidden = ["Kurono", "INDEN-YA", "JOTARO SAITO", "J.ANDO", "Hakuhodo", "Scotch Grain", "AURALEE", "PLEATS PLEASE", "HOMME PLISS", "PORTER EXCHANGE", "KUOE", "Kappabashi", "KAMA-ASA"];
  for (const item of forbidden) assert.doesNotMatch(shopping, new RegExp(item.replace(".", "\\."), "i"), `${item} must stay removed`);
  assert.equal(trip.bookingTasks.find((x) => x.id === "nezu").status, "done");
  const haruka = trip.bookingTasks.find((x) => x.id === "haruka");
  assert.equal(haruka.status, "done");
  assert.match(haruka.price, /¥3,600/);
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
  const railTask = trip.bookingTasks.find((x) => x.id === "nara-live-train");
  assert.equal(railTask.status, "watch");
  assert.match(railTask.action, /около 07:55/);
  assert.match(railTask.action, /прибытия около 08:50/);
  const himejiSeats = trip.bookingTasks.find((x) => x.id === "himeji-seats");
  assert.equal(himejiSeats.status, "done");
  assert.match(himejiSeats.action, /Hikari 731.*Car 14.*3-D\/3-E/s);
  assert.match(himejiSeats.action, /Hikari 710.*Car 14.*6-D\/6-E/s);
});

test("audit baseline: bad restaurant links and China map/shuttle errors are corrected", async () => {
  const extra = await readJson("data/travel-enrichment.json");
  const himeji = extra.dayEnrichment["sep-23-himeji"].meals.flatMap((m) => m.options).find((o) => o.name === "Maneki Ekisoba");
  assert.match(himeji.url, /28049150/);
  const tsukiji = extra.dayEnrichment["sep-30-tokyo"].meals.flatMap((m) => m.options).find((o) => o.name === "Tsukiji Kanno Honten");
  assert.match(tsukiji.url, /13007619/);
  const owariya = extra.dayEnrichment["oct-01-asakusa"].meals.flatMap((m) => m.options).find((o) => o.name === "Owariya Shiten");
  assert.match(owariya.url, /13008597/);
  const beijing = getDay(await readJson("data/trip.json"), "sep-20-beijing");
  assert.ok(beijing.timeline.some((x) => /Forbidden City|Palace Museum/.test(x.title)));
  assert.ok(beijing.timeline.some((x) => /Jingmo/.test(x.title)));
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
  assert.match(pocket, /hotel\.googleMapsUrl\?\?hotel\.mapUrl/);
  assert.doesNotMatch(secrets, /localStorage|useLocalStorageValue|japan-private-code/);
  assert.match(secrets, /Введите код на эту сессию/);
  assert.match(layout, /index: false/);
  assert.match(layout, /follow: false/);
  assert.equal(pkg.dependencies.next, "16.3.2");
  assert.equal(pkg.devDependencies["eslint-config-next"], "16.3.2");
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
  const pocket = await readText("app/pocket/page.tsx");
  const dayView = await readText("app/ui/day-view.tsx");
  assert.match(css, /\.route-item\.decision \.route-marker \{[^}]*color: #2d2412;/s);
  assert.ok(contrastRatio("#c9962f", "#2d2412") >= 3, "decision route icon must meet 3:1 non-text contrast");
  assert.doesNotMatch(pocket, /Только после проверки состава/);
  assert.match(dayView, /foodSafety\.summary/);
});

test("confirmed delta: passes, reserved seats, dinner and later starts stay fixed", async () => {
  const trip = await readJson("data/trip.json");
  const extra = await readJson("data/travel-enrichment.json");
  const pickup = trip.bookingTasks.find((x) => x.id === "kix-physical-pickup");
  assert.equal(pickup.status, "action");
  assert.match(pickup.action, /получить 2 физических HARUKA/i);
  assert.match(pickup.action, /физический Kansai–Hiroshima Area Pass/);
  assert.doesNotMatch(pickup.action, /купить|оплатить/i);

  const himeji = getDay(trip, "sep-23-himeji");
  assert.match(himeji.timeline.find((x) => x.title.includes("Hikari 731")).detail, /Car 14.*3-D и 3-E/);
  assert.match(himeji.timeline.find((x) => x.title.includes("Hikari 710")).detail, /Car 14.*6-D и 6-E/);
  const dinner = trip.bookingTasks.find((x) => x.id === "matsusaka-m");
  assert.equal(dinner.status, "done");
  assert.match(dinner.title, /23\.09 20:00/);
  assert.match(dinner.price, /Accepted/);
  const dinnerMeal = extra.dayEnrichment["sep-23-himeji"].meals.find((x) => x.label.includes("Fukushima"));
  assert.equal(dinnerMeal.time, "20:00");
  assert.match(dinnerMeal.note, /2 человека/);
  assert.match(dinnerMeal.note, /15 минут/);

  const nara = getDay(trip, "sep-22-nara");
  assert.equal(nara.timeline[0].time, "07:00–07:30");
  assert.equal(nara.timeline[1].time, "около 07:55");
  assert.equal(nara.timeline[2].time, "около 08:50");
  assert.doesNotMatch(JSON.stringify(nara), /05:55/);
  const kyoto = getDay(trip, "sep-25-kyoto");
  assert.ok(kyoto.timeline.some((x) => x.time === "09:15–09:30"));
  assert.doesNotMatch(JSON.stringify(kyoto), /06:50/);
});

test("photo canon: priorities, Nara list, Fuji Watch and map classification are complete", async () => {
  const trip = await readJson("data/trip.json");
  const extra = await readJson("data/travel-enrichment.json");
  const priorities = new Set(["PHOTO MUST", "PHOTO GOOD", "SECONDARY ICONIC", "FUJI WATCH"]);
  const allSpots = trip.days.flatMap((day) => (day.photoSpots ?? []).map((spot) => ({ day: day.id, ...spot })));
  assert.ok(allSpots.length >= 30);
  for (const spot of allSpots) {
    assert.ok(priorities.has(spot.priority), `unknown photo priority: ${spot.day} / ${spot.name}`);
    assert.ok(spot.googleMapsUrl || spot.mapExempt === true, `photo map classification missing: ${spot.day} / ${spot.name}`);
    assert.ok(spot.shot && spot.timing, `photo guidance missing: ${spot.day} / ${spot.name}`);
  }
  const nara = getDay(trip, "sep-22-nara").photoSpots;
  assert.deepEqual(nara.map((x) => [x.name, x.priority]), [
    ["Nigatsudō terrace", "PHOTO MUST"],
    ["Tōdai-ji / Nandaimon", "PHOTO GOOD"],
    ["Kasuga Taisha approach", "PHOTO GOOD"],
    ["Yoshikien", "PHOTO GOOD"],
    ["Hōzenji Yokocho", "PHOTO GOOD"],
    ["Dōtonbori", "SECONDARY ICONIC"],
  ]);
  assert.ok(allSpots.some((x) => x.priority === "FUJI WATCH"));
  assert.ok(allSpots.some((x) => x.signature === true));
  assert.match(extra.photoGuide.exclusion, /Shin-Fuji.*не добавлен/);
  assert.ok(!allSpots.some((x) => /^Shin-Fuji$/i.test(x.name)), "Shin-Fuji must not become a stop");
  const trainFuji = allSpots.find((x) => x.name.includes("Hikari 642"));
  assert.equal(trainFuji.mapExempt, true);
  assert.match(trainFuji.mapExemptReason, /не отдельная остановка/);
});

test("release gate: every concrete POI uses the documented Google Maps URL API", async () => {
  const trip = await readJson("data/trip.json");
  const extra = await readJson("data/travel-enrichment.json");
  const shopping = await readJson("data/shopping-guide.json");
  const isCanonicalGoogleMap = (raw) => {
    if (typeof raw !== "string") return false;
    const url = new URL(raw);
    if (url.origin !== "https://www.google.com") return false;
    if (url.pathname.startsWith("/maps/search")) {
      return url.searchParams.get("api") === "1" && Boolean(url.searchParams.get("query"));
    }
    return url.pathname.startsWith("/maps/place/") && url.pathname.includes("/@") && url.pathname.includes("/data=");
  };

  for (const hotel of trip.hotels) assert.ok(isCanonicalGoogleMap(hotel.googleMapsUrl), `hotel map must be canonical: ${hotel.name}`);
  for (const hotel of extra.additionalHotels) assert.ok(isCanonicalGoogleMap(hotel.googleMapsUrl), `China hotel Google bookmark must be canonical: ${hotel.name}`);

  for (const day of trip.days) {
    for (const item of day.timeline) {
      assert.ok((item.mapLinks?.length ?? 0) > 0 || item.mapExempt === true, `timeline POI classification missing: ${day.id} / ${item.title}`);
      for (const map of item.mapLinks ?? []) assert.ok(isCanonicalGoogleMap(map.url), `timeline map must be canonical: ${day.id} / ${item.title} / ${map.label}`);
    }
    for (const spot of day.photoSpots ?? []) if (spot.googleMapsUrl) assert.ok(isCanonicalGoogleMap(spot.googleMapsUrl), `photo map must be canonical: ${day.id} / ${spot.name}`);
  }

  for (const [dayId, day] of Object.entries(extra.dayEnrichment)) {
    for (const alt of day.alternatives) assert.ok(isCanonicalGoogleMap(alt.googleMapsUrl), `alternative map must be canonical: ${dayId} / ${alt.name}`);
    for (const meal of day.meals) for (const option of meal.options) {
      assert.ok(isCanonicalGoogleMap(option.googleMapsUrl) || option.mapExempt === true, `meal POI classification missing: ${dayId} / ${option.name}`);
      if (option.googleMapsUrl) assert.ok(isCanonicalGoogleMap(option.googleMapsUrl), `meal map must be canonical: ${dayId} / ${option.name}`);
    }
  }

  for (const city of shopping.cities) for (const cluster of city.clusters) for (const store of cluster.stores) {
    assert.ok(isCanonicalGoogleMap(store.googleMapsUrl), `shopping map must be canonical: ${city.name} / ${store.name}`);
  }

  for (const side of [extra.china.outbound, extra.china.return]) {
    for (const place of side.places) {
      assert.ok(place.amap?.startsWith("https://uri.amap.com/"), `China Amap missing: ${place.name}`);
      assert.ok(place.appleMapsUrl?.startsWith("https://maps.apple.com/"), `China Apple Maps missing: ${place.name}`);
      assert.ok(isCanonicalGoogleMap(place.googleMapsUrl), `China Google bookmark must be canonical: ${place.name}`);
    }
    for (const item of side.timeline) {
      assert.ok((item.mapLinks?.length ?? 0) > 0 || item.mapExempt === true, `China timeline map classification missing: ${item.title}`);
      for (const map of item.mapLinks ?? []) assert.ok(isCanonicalGoogleMap(map.url), `China timeline Google bookmark must be canonical: ${item.title}`);
    }
    for (const food of side.food) {
      assert.ok((food.amapUrl && food.appleMapsUrl && food.googleMapsUrl) || food.mapExempt === true, `China food map classification missing: ${food.name}`);
      if (food.googleMapsUrl) assert.ok(isCanonicalGoogleMap(food.googleMapsUrl), `China food Google bookmark must be canonical: ${food.name}`);
    }
  }

  const serialized = JSON.stringify({ trip, extra, shopping });
  assert.doesNotMatch(serialized, /google\.com\/maps\/place\/(?!\?q=place_id:)[^\"?]+/, "hand-built /maps/place/<text> URLs must not remain in canonical data");
});

test("release gate: approved ambiguous-map resolutions are fixed", async () => {
  const trip = await readJson("data/trip.json");
  const shopping = await readJson("data/shopping-guide.json");
  const nara = getDay(trip, "sep-22-nara").timeline.find((x) => x.title.includes("Nara Park"));
  assert.ok(nara.mapLinks.some((x) => x.label === "Nara Park"));
  assert.ok(nara.mapLinks.some((x) => x.label === "Kasuga Taisha"));
  assert.ok(!nara.mapLinks.some((x) => /Kasugayama/i.test(x.label)), "Kasugayama stays context, not a separate navigation target");
  const kyoto = getDay(trip, "sep-25-kyoto");
  assert.equal(kyoto.timeline.find((x) => x.title.includes("Yasaka Pagoda")).mapLinks.length, 2);
  assert.equal(kyoto.timeline.find((x) => x.title.includes("Hanamikoji")).mapLinks.length, 2);
  const architecture = getDay(trip, "sep-29-tokyo").timeline.find((x) => x.title.includes("3 anchors"));
  assert.deepEqual(architecture.mapLinks.map((x) => x.label), ["Prada Aoyama", "SunnyHills Minami-Aoyama", "Omotesando Hills"]);
  const freeAsakusa = getDay(trip, "oct-01-asakusa").timeline.find((x) => x.title === "Свободное утро в Asakusa");
  assert.equal(freeAsakusa.mapExempt, true);
  const hairpin = shopping.cities.find((c) => c.id === "chengdu").clusters[0].stores[0];
  assert.match(hairpin.name, /Champagne Plaza/);
  assert.match(hairpin.googleMapsUrl, /query_place_id=ChIJlUPGRkDF7zYR3ZFC2alpOwc/);
  assert.match(hairpin.amapUrl, /uri\.amap\.com/);
  assert.match(hairpin.appleMapsUrl, /maps\.apple\.com/);
});


test("05.09 content integrity: Imaasa is optional everywhere, Tokyo Plan-B watches are restored", async () => {
  const trip = await readJson("data/trip.json");
  const extra = await readJson("data/travel-enrichment.json");
  const d28 = getDay(trip, "sep-28-tokyo");
  assert.doesNotMatch(d28.principle, /бронь Imaasa.*защищ/i);
  assert.ok(!d28.anchors.some((x) => /Imaasa/i.test(x.label)));
  const dinner = d28.timeline.find((x) => x.title === "Ужин · Shinbashi");
  assert.ok(dinner);
  assert.match(dinner.detail, /Без обязательной брони/);
  assert.ok(!trip.bookingTasks.some((x) => x.id === "imaasa"));
  const dinnerMeal = extra.dayEnrichment["sep-28-tokyo"].meals.find((m) => /Shinbashi/.test(m.label));
  assert.match(dinnerMeal.note, /Защищённого ресторана нет/);
  const imaasa = dinnerMeal.options.find((x) => x.name === "Sukiyaki Imaasa");
  assert.equal(imaasa.pick, false);
  assert.match(imaasa.route, /не является To Do/i);
  const h = trip.bookingTasks.find((x) => x.id === "hiroshige");
  const e = trip.bookingTasks.find((x) => x.id === "edo");
  assert.equal(h.status, "watch");
  assert.equal(e.status, "watch");
  assert.match(h.title, /Plan B/);
  assert.match(e.title, /Plan B/);
  assert.match(h.action, /только если.*остаться в Tokyo/i);
  assert.match(e.action, /только после решения не ехать к Fuji/i);
});

test("05.09 content integrity: 21.09 keeps shuttle and concise flight event, details stay in Transport", async () => {
  const trip = await readJson("data/trip.json");
  const d21 = getDay(trip, "sep-21-osaka");
  assert.equal(d21.timeline[0].title, "Fairfield → PEK T2");
  assert.equal(d21.timeline[1].title, "PEK → KIX");
  assert.match(d21.timeline[0].detail, /18\.09/);
  assert.match(d21.timeline[1].detail, /Билеты и транспорт/);
  assert.doesNotMatch(d21.timeline[1].title + " " + d21.timeline[1].detail, /HU473|T2|T1/);
  const flight = trip.transport.find((x) => /HU473/.test(x.title));
  assert.match(flight.detail, /PEK T2 → KIX T1/);
});

test("05.09 content integrity: Shiunso, taxi rule and Beijing Amap coverage are synchronized", async () => {
  const trip = await readJson("data/trip.json");
  const extra = await readJson("data/travel-enrichment.json");
  const shi = trip.bookingTasks.find((x) => x.id === "shiunso");
  assert.match(shi.action, /Бесплатную приватную ванну заранее не бронировать/);
  assert.match(shi.action, /Kanzan-no-Yu/);
  const taxi = trip.transport.find((x) => x.title === "Такси / DiDi");
  assert.match(taxi.detail, /В Японии такси не является базовым транспортом/);
  assert.ok(trip.pocket.rules.some((x) => /такси не является базовым транспортом/.test(x)));
  const names = extra.china.outbound.places.map((x) => x.name);
  assert.ok(names.includes("故宫博物院"));
  assert.ok(names.includes("景山公园"));
  const beijing = getDay(trip, "sep-20-beijing");
  for (const label of ["Amap · Forbidden City", "Amap · Jingshan", "Amap · Jingmo"]) {
    const link = beijing.links.find((x) => x.label === label);
    assert.ok(link);
    assert.match(link.url, /^https:\/\/uri\.amap\.com\/search\?/);
  }
});
