# Verification log · 23 августа 2026

## Фактологический delta-check

| Проверка | Результат | Основание |
|---|---|---|
| HARUKA · 2 взрослых · ¥3,600 | PASS | Покупка подтверждена пользователем; в материалах оставлен физический discounted One-way Ticket и исключён WEST QR. |
| Kansai–Hiroshima Area Pass · 22–26.09 | PASS | Покупка подтверждена пользователем; добавлено только получение физического pass в KIX. [JR-West](https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/kansai_hiroshima/) подтверждает Ordinary Reserved Seat в зоне действия без отдельного полного тарифа. |
| Himeji reserved seats | PASS | Пользовательское подтверждение: Hikari 731, Car 14, 3-D/3-E; Hikari 710, Car 14, 6-D/6-E. Отдельная задача резервирования закрыта. |
| Yakiniku M Fukushima · 23.09 20:00 | PASS | TableCheck Accepted, 2 человека; адрес и операционные условия синхронизированы с [TableCheck](https://www.tablecheck.com/en/shops/matsusakamfukushima/reserve) и [Tabelog](https://tabelog.com/en/osaka/A2701/A270108/27003327/). |
| Nara · поздний старт | PASS с live-check | Завтрак 07:00–07:30, поезд около 07:55, прибытие около 08:50. Точная минута и платформа оставлены задачей на вечер 21.09 в [JR-West timetable](https://www.westjr.co.jp/global/en/timetable/). |
| Osaka → Kyoto · поздний старт | PASS | Выход 09:15–09:30; Kinkaku-ji, Kawai Kanjirō House, Kiyomizu-dera и Gion защищены, Ryōan-ji — первый кандидат на сокращение. |
| Hikari 642 · Fuji-side | PASS / без изменения | Ordinary Reserved D+E, E у окна Fuji-side; Shin-Fuji не добавлен. |
| Photo canon | PASS | 46 точек; для каждой есть приоритет, кадр, момент и Google Maps либо явный `mapExempt`. Утверждённый список Нары проверен отдельно. |
| Google Maps canon | PASS | Все конкретные POI используют официальный Maps URL API либо реальный detail/share URL; известные Place ID используют `query_place_id`. Китайские Amap/Apple ссылки сохранены. |

## PRE-DELIVERY · Build A

- `npm ci`: PASS, 350 packages. Системный `/root/.npm` был недоступен, поэтому воспроизводимая установка выполнена с изолированным writable cache `/tmp/japan-2026-npm-cache`; lock-файл не менялся.
- Production dependency audit: PASS; unapproved High/Critical findings отсутствуют.
- ESLint: PASS.
- `tsc --noEmit`: PASS.
- Static export с `NEXT_PUBLIC_BASE_PATH=/JPN26`: PASS; 23 пользовательских route, PWA manifest — 24 HTML route / 48 precache resources.
- PWA build: `2026.08.23-v10-confirmed-delta-5024e3234b81`.
- Unit/regression/rendered HTML/service-worker tests: PASS, 30/30.
- Internal links, assets, basePath, trailing-slash routes, manifest и icons: PASS; 404/пропущенных target нет.
- Browser offline QA: PASS; все 23 пользовательских route открылись без сети, посторонний cache сохранён.
- Portrait 393×852: PASS; пять нижних пунктов и верхнее меню «Разделы» видимы, horizontal overflow отсутствует на всех 23 route.
- Landscape 852×393: PASS; horizontal overflow отсутствует на всех 23 route.
- Accessibility smoke audit: PASS; на проверенных route есть `h1`, нет duplicate IDs, изображений без `alt` и интерактивных элементов без имени.
- PWA upgrade: PASS; previous FINAL `2026.08.22-v8-shopping-rebuild-eca4a942311a` → candidate через `controllerchange`, storage не очищался; новая shell и все 23 route работают офлайн.
- Privacy/security: PASS; публичных booking/voucher codes нет, session-only поля не используют Web Storage, robots остаётся `noindex/nofollow`, чужие PWA cache не удаляются.

## PDF audit

- Генерация из тех же `trip.json`, `travel-enrichment.json` и `shopping-guide.json`: PASS.
- Parser: PASS; 96 страниц, 38 outline bookmarks, 76 внутренних переходов, 454 URI-аннотации.
- Google Maps annotations: PASS, 361; все используют официальный Maps URL API или разрешённый detail/share URL.
- Blank pages: 0. Out-of-bounds annotations: 0. Replacement/NUL glyphs: 0.
- CJK fallback: PASS; `排骨担々麵` и `蓝光香槟广场` извлекаются и отображаются корректно.
- Critical facts: PASS; HARUKA/pass, Hikari 731/710, Matsusaka 20:00, Nara 07:55/08:50, Kyoto 09:15–09:30, Hikari 642 D+E и photo canon присутствуют.
- Render QA: PASS; все 96 страниц отрендерены и просмотрены на 8 контактных листах, критические страницы проверены в полном размере.
- Web ↔ PDF: PASS; все 46 photo spot names и ключевые новые времена присутствуют в обоих форматах.

## Build B

- Final ZIP распакован в новый пустой каталог: PASS; исходный `node_modules`, `.next`, `out` и `output` в архив не включены.
- `npm ci` из lock-файла: PASS, 350 packages.
- Production dependency audit, ESLint и `tsc --noEmit`: PASS.
- Static export `/JPN26`: PASS; 23 пользовательских route, 24 HTML route / 48 precache resources.
- Unit/regression/rendered/PWA tests: PASS, 30/30.
- Browser offline QA: PASS, 23/23 route.
- Portrait 393×852 и landscape 852×393: PASS, 23/23 route без horizontal overflow.
- Previous FINAL → распакованный candidate: PASS; `controllerchange`, новая shell и 23/23 route офлайн без очистки storage.
- Итоговый статус PRE-DELIVERY: **PASS**.

## Остаётся перепроверить ближе к поездке

- Точную минуту и платформу Osaka → Nara вечером 21 сентября.
- Работу Hirasō Naramachi 22 сентября.
- Конкретный павильон и часы Chengdu hairpin в Champagne Plaza — только через Amap в день визита; павильон не придуман.
- Stock, holiday closures и ограниченные модели в магазинах — по официальным ссылкам в день визита.
