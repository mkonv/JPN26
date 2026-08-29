# Verification · FINAL 29 августа 2026

## Release scope

- Execution environment: ChatGPT Work подтверждён пользователем для этого
  запуска; hard gate принят как выполненный.
- Canonical baseline: FINAL-пара от 23.08.2026, а не устаревшая пара 22.08.
- Подтверждённая дельта: Hiroshima reserved seats и SmartEX confirmation для
  Hikari 642. Другие маршруты, sightseeing, shopping и food не менялись.

## Фактологическая проверка новой дельты

- Точные номера поездов, вагоны и места внесены по подтверждённым данным
  пользователя; публичный источник не может подтвердить персональную выдачу
  конкретных seats.
- JR Central подтверждает, что для вида на Fuji в Standard/Ordinary Class
  нужен seat E: <https://global.jr-central.co.jp/en/goldenroute/shinkansen/>.
- SmartEX подтверждает два допустимых boarding method:
  - назначенная транспортная IC card:
    <https://smart-ex.jp/en/entraining/iccard/>;
  - отдельный QR-Ticket для каждого seat, который можно распределить между
    пассажирами: <https://smart-ex.jp/en/entraining/qr/>.
- Для обоих вариантов SmartEX нужно забрать Seat Information у турникета.
- Правила и зона Kansai-Hiroshima Area Pass перепроверены на странице JR-West:
  <https://www.westjr.co.jp/global/en/ticket/pass/kansai_hiroshima/index2.html>.

## Build A

| Проверка | Результат |
| --- | --- |
| Чистое дерево до установки | PASS |
| `npm ci` | PASS · 350 packages |
| Dependency/security audit | PASS · no unapproved High/Critical production findings |
| ESLint | PASS |
| TypeScript `--noEmit` | PASS |
| Production static export `/JPN26` | PASS · 23 app routes, 24 manifest pages, 48 precache resources |
| Unit/regression/rendered-link tests | PASS · 31/31 |
| Offline PWA all routes | PASS · 23 non-404 routes |
| Portrait 393x852 | PASS · 5 bottom-nav items, Разделы menu, no overflow |
| Landscape 852x393 | PASS · all 23 routes, no overflow |
| Accessibility basics | PASS · h1, duplicate IDs, image alt, named controls |
| Privacy/security | PASS · no populated secrets; unrelated cache preserved |
| PWA upgrade | PASS · previous FINAL -> candidate, `controllerchange`, fresh shell, 23 offline routes without clearing storage |

PWA upgrade build IDs:

- previous FINAL: `2026.08.23-v10-confirmed-delta-ff411cea08f5`;
- Build A candidate: `2026.08.29-v11-confirmed-seats-c62a97ae4c75`.

## Mobile PDF QA

| Проверка | Результат |
| --- | --- |
| Parser reopen | PASS |
| Page count / consistent geometry | PASS · 96 pages |
| TOC / outline | PASS · 35 entries |
| URI annotations | PASS · 454 total, 320 unique, 0 malformed |
| Google Maps coverage | PASS · all 238 canonical URLs present |
| China Amap coverage | PASS · all 9 canonical URLs present |
| Critical Hiroshima / SmartEX facts | PASS |
| Broken/replacement glyphs | PASS · none |
| Render every page | PASS · 96/96 |
| Visual inspection | PASS · no clipping, overlap or broken glyphs |
| Final render identity | PASS · all 96 pages pixel-identical to inspected render |
| Web/PDF consistency | PASS |

## Packaging + Build B

- Source ZIP excludes `.git`, `node_modules`, `.next`, `out`, `output`,
  temporary renders, caches and `tsconfig.tsbuildinfo`.
- Required configs, data, app source, assets/fonts, tests, PDF generator,
  PDF validator and `.github/workflows/pages.yml` are present.
- The FINAL ZIP was unpacked into a new empty directory and passed:
  `npm ci`, security audit, ESLint, TypeScript, production `/JPN26` export,
  31/31 tests, offline all routes, portrait + landscape mobile QA, PDF build
  and executable PDF validation.

## Known pending action

- SmartEX IC Card for Boarding пока не назначены. До 27.09 выбрать две
  назначенные IC-карты либо сохранить и распределить два QR-Tickets.
- Вид Fuji из 9-E зависит от погоды и остаётся `FUJI WATCH`.
