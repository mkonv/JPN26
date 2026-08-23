# Verification log · 22 августа 2026

## Фактологический delta-check

| Изменение | Результат | Источник / оговорка |
|---|---|---|
| Nezu Museum · 29.09 10:00–11:00 · 2 билета | PASS | Подтверждённая покупка пользователя; публичные детали музея оставлены без нового жёсткого допущения. |
| HARUKA KIX → Osaka · 2 × ¥1,800 | PASS | [JR-West HARUKA One-way Ticket](https://www.westjr.co.jp/travel-information/en/tickets-passes/oneway/haruka/): Osaka ¥1,800 за взрослого; канонический физический билет не заменён WEST QR. |
| Kansai–Hiroshima Area Pass · Ordinary Reserved | PASS | [JR-West](https://www.westjr.co.jp/travel-information/en/tickets-passes/jrwest-rail-pass/kansai_hiroshima/): reserved seats Sanyo Shinkansen и limited express входят после предварительного резервирования; отдельная доплата относится к A-Seat/Green и иным исключениям. |
| Hakone cruise / timing | PASS с day-of trigger | [Hakone Navi](https://www.hakonenavi.jp/international/en/transportation/hakone-kankosen): один конец примерно 25–35 минут; в материалах сохранена утренняя проверка operation status и отказ от жёсткого рейса при остановке. |
| Китай · 240-hour transit | PASS | [NIA](https://en.nia.gov.cn/n147418/n147463/c183412/content.html); перепроверено 22.08.2026. Маршрут остаётся транзитом в третью страну с подтверждёнными onward tickets; финальную допустимость проверить ближе к вылету. |
| Hikari 642 Kyoto → Odawara | PASS / без изменения | Пользовательское подтверждение SmartEX остаётся каноном: Ordinary Reserved D+E, E Fuji-side. Публичное осеннее расписание не подменяет данные брони; повторная сверка номера/мест после открытия окончательного timetable сохранена как задача. |
| Shiunso luggage | PASS / без расширения | Неподтверждённое хранение сверх согласованного окна не добавлено. |
| China navigation | PASS | Китайские точки используют Amap URI; Chengdu hairpin остаётся условным ориентиром с проверкой конкретного павильона в Amap в день визита. |

## Shopping verification

Проверены официальные store/product pages; часы и наличие конкретных моделей остаются day-of переменными:

- Watches: [Seiko Osaka](https://www.seikowatches.com/jp-ja/stores/86605), [Seiko Dream Square](https://www.seikowatches.com/jp-ja/stores/special/seikodreamsquare/en/index), [Citizen Osaka](https://flagshipstore.citizen.jp/en/location/osaka/), [Citizen Tokyo](https://flagshipstore.citizen.jp/en/location/tokyo/), [G-SHOCK stores](https://gshock.casio.com/jp/store/), [Kurono Aoyama](https://kuronotokyo.com/pages/kurono-tokyo-aoyama-salon).
- Clothing: [ASICS Shinsaibashi](https://www.asics.com/jp/ja-jp/mk/store/asics-osaka-shinsaibashi), [ASICS Harajuku](https://www.asics.com/jp/ja-jp/mk/store/asics-flagship-harajuku), [Onitsuka Tiger](https://www.onitsukatiger.com/jp/magazine/our-stores/?lang=en), [Porter Classic Ginza](https://porterclassic.com/pages/porter-classic-ginza), [Porter Classic Marunouchi](https://porterclassic.com/pages/classic-gentleman-porter-classic-tokyo-marunouchi), [KAPITAL shops](https://www.kapital.jp/shop/search/search_again.html), [TCB](https://tcbjeans.com/), [UNIQLO Ginza](https://www.uniqlo.com/jp/ja/contents/corp/press-release/2021/09/21090811_ginza.html).
- Accessories / craft: [cas:pace Tokyo](https://cas-pace.com/en/pages/cas-pace-tokyo), [glänta Ninenzaka](https://www.kochentertainment.com/glanta/en/shop/kyoto2/), [Kintakedo](https://www.gion.or.jp/gion_shop_detail/%E9%87%91%E7%AB%B9%E5%A0%82), [Kazurasei](https://www.kazurasei.co.jp/f/company), [Masunaga Aoyama](https://masunaga1905.com/en/officialstores/tokyo-aoyama/), [Kaneko Aoyama](https://www.kaneko-optical.co.jp/shop_detail/72), [Gyokusendo Kogai](https://www.gyokusendo.com/en/about/kogai), [SUWADA](https://www.suwada.co.jp/shop_ja).

## Regression / release gate

- `npm ci`: PASS (349 packages before dependency patch; lockfile updated and reproducible install retained).
- `NEXT_PUBLIC_BASE_PATH=/JPN26 npm run build`: PASS; Next.js 16.3.2, TypeScript PASS, 23 static pages, PWA 24 routes / 48 resources.
- PWA build: `2026.08.22-v8-shopping-rebuild-5abc4c1eeb4e`; atomic staging/precache, hashed worker, one previous namespace, MessageChannel status and offline fallback covered by tests.
- `npm run lint`: PASS.
- Regression tests: PASS, 19/19.
- Production dependency audit: PASS; no unapproved High/Critical findings.
- Browser offline QA: PASS, 23 pages opened offline; unrelated cache preserved.
- Mobile QA 393×852: PASS, 23 pages without horizontal overflow; 7 key screenshots including shopping.
- PDF parser: PASS; 82 pages, not encrypted, no JavaScript, 222 annotations.
- PDF render: PASS; every one of 82 pages rendered and visually checked; shopping pages rechecked at full size.
- Web ↔ PDF shopping cross-check: PASS; all 25 store names present in both outputs.
- Forbidden shopping targets: PASS; no hits in rendered Shopping HTML or final PDF.
- Privacy/security: PASS; no public booking codes; no legacy OpenAI Sites/vinext/ChatGPT auth/Cloudflare worker contour restored.

## Нерешённые вопросы

- TCB: официальный сайт подтверждает бренд, но точный factory-shop address и часы не удалось надёжно подтвердить; точка явно помечена как отдельная поездка только после прямого подтверждения TCB.
- Chengdu hairpin: сохранён approved ориентир Champagne Plaza / Chunxi Road и рабочий Amap search URI, но конкретный павильон и его режим публично не подтверждены; в guide это условная точка без жёсткого тайминга.
- Stock / holiday closures для всех магазинов необходимо проверить по официальной ссылке в день визита.
