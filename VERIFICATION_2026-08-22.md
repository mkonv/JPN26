# Verification log · release candidate · 22 августа 2026

## Фактологический / regression delta

| Изменение | Статус | Проверка / источник |
|---|---|---|
| Hikari 642 Kyoto → Odawara | PASS | Канон сохранён: Ordinary Reserved D+E; E — окно со стороны Fuji. |
| HARUKA discounted One-way Ticket | PASS | Канон сохранён: физический билет, не WEST QR. |
| Kansai–Hiroshima Area Pass | PASS | Уже куплен; получить физический pass в KIX; reserved seats — по pass без отдельного полного тарифа. |
| Nezu Museum 29.09 10:00–11:00, 2 tickets | PASS | Покупка подтверждена; purchase-task не возвращён в To Do. |
| Hakone cruise / timing | PASS с day-of trigger | Жёсткий рейс не фиксируется без актуального operation status. |
| Shiunso luggage | PASS | Неподтверждённое хранение сверх допустимого окна не добавлено. |
| TCB | PASS | Полностью отсутствует в shopping guide; regression-тест запрещает возврат. |
| China navigation | PASS | Конкретные POI: Amap + Apple Maps + Google Maps bookmark; generic/nonfixed food slot остаётся без fake POI. |
| Web ↔ PDF canonical data | PASS | Оба результата строятся из одних `data/*.json`; PDF пересобран после финальной data-правки. |

## Fresh shopping spot-check · 22.08.2026

- Onitsuka Tiger Namba: 1-8-14 Dotonbori, Osaka; 11:00–20:00 — официальный Onitsuka Tiger store list.
- Onitsuka Tiger NU Chayamachi: NU 1F, 10-12 Chayamachi, Osaka; 11:00–21:00 — NU Chayamachi shop page.
- Onitsuka Tiger Kyoto: Kawaramachi OPA 1F, 385 Komeyacho; комплекс 11:00–21:00 — Kawaramachi OPA.
- KAPITAL K.K-POPPO: 352 Iseyacho, Kyoto — официальный KAPITAL shop list; режим 11:00–20:00 сверён по актуальной map/store listing; перед визитом сохранить day-of check.

## Google Maps coverage

- Concrete POI coverage test: PASS.
- Каждый concrete timeline/store/hotel/alternative/restaurant/China POI имеет Google Maps `/maps/place/` URL; намеренно нефиксированные элементы помечены `mapExempt`.
- Generic `google.com/maps/search/` in canonical data: 0.
- Шесть согласованных неоднозначных случаев зафиксированы отдельным regression-тестом: PASS.

## Source / static QA

- `node --test tests/audit-regressions.test.mjs`: **13/13 PASS**.
- Canonical JSON parse: PASS.
- Python PDF generator compile: PASS.
- `.mjs/.js` syntax: PASS.
- TS/TSX parser: 28/28 PASS.
- Differential TypeScript semantic check с локальными declaration stubs: candidate после исправления имеет только те же 4 stub-only JSX event diagnostics, что и успешно собранный baseline; новых candidate-specific diagnostics = 0.
- `package.json` and `package-lock.json`: byte-for-byte dependency baseline preserved; lock SHA-256 совпадает с текущим FINAL baseline.
- Legacy components (vite/vinext/.openai/ChatGPT auth/worker/drizzle): не возвращены.

## PDF QA

- Generated PDF: 86 pages, 306×664 pt, unencrypted.
- Outline: 38 items; annotations: 480.
- Embedded fonts include DejaVu Sans / DejaVu Sans Bold / Noto Sans SC.
- Render: **86/86 pages**; contact-sheet visual review: no observed clipping, overlap or broken glyphs.
- URI annotations: 404 total; Google `/maps/place/`: 312; generic Google `/maps/search/`: 0.
- Critical spot-check: Hikari D+E/Fuji wording, Nezu, Kansai–Hiroshima, HARUKA and TCB absence present as intended.

## Blocking production QA

`npm ci --no-fund --no-audit` cannot complete in the current container. npm repeatedly returns `EAI_AGAIN` for `registry.npmjs.org`; direct DNS resolution and direct HTTPS connectivity from the container are unavailable. This failure happens during package retrieval, before project build execution.

Therefore these mandatory gates cannot yet be rerun on the changed source tree:

- full TypeScript check with real Next/React types;
- ESLint;
- Next.js static export with `NEXT_PUBLIC_BASE_PATH=/JPN26`;
- generated `out/` HTML/assets/basePath/trailingSlash checks;
- PWA manifest/precache/service-worker runtime tests;
- Playwright offline test of all routes;
- Playwright 393×852 mobile QA;
- current npm dependency/security audit.

The seven failures from `node --test tests/*.test.mjs` are all downstream `ENOENT out/...` failures because `out/` cannot be generated without the dependency install; the 14 tests that do not require `out/` pass.

**RELEASE GATE: BLOCKED. Do not label this candidate FINAL and do not overwrite Library canonical files until the production pipeline passes.**
