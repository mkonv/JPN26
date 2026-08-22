# Changelog · release candidate · 22 августа 2026

## Подтверждённые изменения недели

- Nezu Museum: 2 билета на 29.09.2026, слот 10:00–11:00; покупка не возвращена в To Do.
- HARUKA KIX → Osaka: 2 discounted One-way Tickets за ¥3,600; сохранено получение физических билетов в KIX и запрет подмены на WEST QR.
- Kansai–Hiroshima Area Pass: отражён как уже купленный; в KIX получить физический pass; reserved seats оформлять по pass без отдельного полного тарифа.
- Shopping guide переведён на канон `город → компактный кластер → магазин`, без привязки к sightseeing-дням; между городами сохранены удобные дубли утверждённых брендов.
- TCB полностью удалён из shopping guide и regression-тест теперь запрещает его возврат.
- KAPITAL product-note сохраняет приоритет KOUNTRY / embroidery / remake / patchwork / BORO / sashiko перед Century Denim.
- Уточнены актуальные точки Onitsuka Tiger и KAPITAL: Onitsuka Namba 11:00–20:00; NU Chayamachi 11:00–21:00; Kyoto в Kawaramachi OPA 11:00–21:00; KAPITAL K.K-POPPO Kyoto 11:00–20:00.

## Google Maps / China navigation

- Все конкретные POI в canonical data классифицированы: точная Google Maps place-link либо явный `mapExempt` только для намеренно нефиксированных блоков.
- Удалены generic `google.com/maps/search/` из canonical data.
- Зафиксированы 6 ранее неоднозначных пунктов:
  1. Nara Park как anchor для оленей; Kasugayama остаётся контекстом.
  2. Gojōzaka + Hōkan-ji / Yasaka Pagoda — две отдельные точки.
  3. Gion — Hanamikoji Street + Yasaka Shrine.
  4. Omotesandō architecture — Prada Aoyama + SunnyHills Minami-Aoyama + Omotesando Hills.
  5. Свободное утро Asakusa — явный `mapExempt`, без искусственного POI.
  6. Chengdu hairpin — Champagne Plaza; Amap/Apple как рабочая навигация + Google Maps bookmark; конкретный павильон не выдуман.
- Пять намеренно нефиксированных food-slots оставлены без искусственных ресторанных ссылок.

## Web / PDF

- Web timeline поддерживает несколько map-links на один пункт.
- China UI показывает Amap + Apple Maps + Google Maps там, где есть конкретный POI.
- PDF generator использует те же canonical data и выводит несколько карт-ссылок для составных пунктов.
- Исправлена потенциальная TypeScript regression в `day-view.tsx`: optional `googleMapsUrl` теперь сужается через `"googleMapsUrl" in option` перед обращением.
- Mobile PDF пересобран после всех контентных исправлений: 86 страниц.

## Release status

- Source/data regression suite: PASS, 13/13.
- JSON / Python / JS / TSX syntax: PASS.
- Differential semantic TypeScript check относительно успешно собранного baseline выявил и после исправления не показывает новых ошибок candidate-кода; полный production type-check всё ещё требует установленных Next/React types.
- PDF parser/render/link QA: PASS, 86/86 страниц; 404 URI annotations, из них 312 Google Maps `/maps/place/`; generic `/maps/search/` = 0.
- **Release gate остаётся BLOCKED только на полном Node production pipeline:** текущий runtime не имеет исходящего доступа к npm registry (`EAI_AGAIN` / DNS failure), поэтому `npm ci` не завершается и нельзя честно выполнить новый Next production export, ESLint, npm security audit и Playwright offline/mobile tests.
- До прохождения этого pipeline candidate нельзя называть FINAL и нельзя заменять Library baseline.
