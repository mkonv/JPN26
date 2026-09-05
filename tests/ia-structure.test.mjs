import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const root = new URL("../", import.meta.url);
const text = (p) => readFile(new URL(p, root), "utf8");
const json = async (p) => JSON.parse(await text(p));

test("IA 05.09: five top-level sections are canonical and China is not a standalone route", async () => {
  const nav = await text("app/ui/navigation.tsx");
  for (const label of ["Сегодня", "Маршрут", "Гиды", "Карман", "Подготовка"]) assert.match(nav, new RegExp(label));
  assert.doesNotMatch(nav, /label:\s*"Китай"/);
  await assert.rejects(() => text("app/china/page.tsx"));
});

test("IA 05.09: route is one 15-day chronological stream", async () => {
  const trip = await json("data/trip.json");
  assert.equal(trip.days.length, 15);
  assert.deepEqual(trip.days.map((d) => d.date), [...trip.days.map((d) => d.date)].sort());
  assert.equal(trip.days[0].id, "sep-19-departure");
  assert.equal(trip.days[1].id, "sep-20-beijing");
  assert.equal(trip.days.at(-1).id, "oct-03-chengdu");
  assert.ok(trip.cityRanges.some((x) => x.city === "Beijing"));
  assert.ok(trip.cityRanges.some((x) => x.city === "Chengdu"));
});

test("IA 05.09: Today is dashboard, Guides groups Food+Shopping, Pocket owns transport/Plan B, Preparation owns offline setup", async () => {
  const home = await text("app/page.tsx");
  const guides = await text("app/guides/page.tsx");
  const pocket = await text("app/pocket/page.tsx");
  const todo = await text("app/todo/page.tsx");
  assert.match(home, /TodayDashboard/);
  assert.doesNotMatch(home, /trip\.days\.map/);
  assert.match(guides, /href="\/food"/);
  assert.match(guides, /href="\/shopping"/);
  assert.match(pocket, /href="\/transport"/);
  assert.match(pocket, /href="\/plan-b"/);
  assert.match(pocket, /OfflinePanel mode="status"/);
  assert.match(todo, /id="offline-setup"/);
  assert.match(todo, /<OfflinePanel\/>/);
});

test("IA 05.09: DayView ordering keeps main route ahead of Plan B and contextual layers", async () => {
  const d = await text("app/ui/day-view.tsx");
  const pos = (needle) => d.indexOf(needle);
  assert.ok(pos('<NowStepper') < pos('id="route"'));
  assert.ok(pos('id="route"') < pos('className="page-section decision-section"'));
  assert.ok(pos('className="page-section decision-section"') < pos('className="page-section alternate-section"'));
  assert.ok(pos('className="page-section alternate-section"') < pos('id="alternatives"'));
  assert.ok(pos('id="alternatives"') < pos('id="food"'));
  assert.ok(pos('id="food"') < pos('id="shopping"'));
  assert.ok(pos('id="shopping"') < pos('id="photo-spots"'));
});
