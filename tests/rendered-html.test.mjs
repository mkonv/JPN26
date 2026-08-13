import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

async function render(worker, path) {
  const response = await worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200, `${path} should render`);
  return response.text();
}

test("canonical enrichment contains every required parallel track", async () => {
  const path = new URL("../data/travel-enrichment.json", import.meta.url);
  const data = JSON.parse(await readFile(path, "utf8"));
  const days = Object.values(data.dayEnrichment);

  assert.equal(data.flights.length, 4);
  assert.deepEqual(data.flights.map((item) => item.flight), ["HU7986", "HU473", "3U3962", "3U3887"]);
  assert.equal(data.additionalHotels.length, 2);
  assert.equal(days.length, 12);
  assert.equal(days.flatMap((day) => day.alternatives).length, 36);
  assert.ok(days.every((day) => day.alternatives.length === 3));
  assert.equal(days.flatMap((day) => day.meals).length, 24);
  assert.equal(days.flatMap((day) => day.meals.flatMap((meal) => meal.options)).length, 68);
  assert.equal(data.foodPassport.filter((dish) => dish.level === "must").length, 14);
  assert.equal(data.foodPassport.filter((dish) => dish.level === "bonus").length, 7);
});

test("renders development preview metadata", async () => {
  const worker = await loadWorker();
  assert.match(await render(worker, "/"), developmentPreviewMeta);
});

test("renders China, gastronomy, and parallel day content", async () => {
  const worker = await loadWorker();
  const china = await render(worker, "/china");
  const food = await render(worker, "/food");
  const day = await render(worker, "/day/sep-21-osaka");

  assert.match(china, /HU7986/);
  assert.match(china, /3U3962/);
  assert.match(china, /FAIRFIELD BY MARRIOTT BEIJING CAPITAL AIRPORT/);
  assert.match(china, /CROWNE PLAZA CHENGDU CITY CENTER/);
  assert.match(food, /Гастрономическое путешествие/);
  assert.match(food.replaceAll("<!-- -->", ""), /14 главных/);
  assert.match(day, /Куда свернуть/);
  assert.match(day, /Где поесть/);
  assert.match(day, /Tabelog/);
});
