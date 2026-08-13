# Japan 2026 — маршрут в кармане

Offline-first travel companion for the complete 19 September–3 October 2026
journey: Moscow → Beijing → Japan → Chengdu → Moscow. The interface is tuned
for an iPhone 15 Pro and keeps the operational plan separate from optional
attractions, food choices, and shopping.

## What is included

- 4 flight legs and both China stopovers;
- 12 detailed Japan days with a protected base route;
- 3 nearby alternative attractions for every Japan day;
- 2–3 Tabelog-based choices for each flexible lunch/dinner window;
- a persistent 21-dish gastronomic passport;
- booking/preparation To Do, transport, Plan B, shopping, and pocket reference;
- an explicit “save offline” flow and installable iPhone home-screen app;
- a mobile PDF generator driven by the same JSON as the website.

The canonical content lives in `data/trip.json` and
`data/travel-enrichment.json`. Update those files first so that the site and PDF
stay aligned.

## Run and verify

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open the local URL in Safari/Chrome. Production verification:

```bash
npm run lint
npm test
```

`npm test` builds the deployable artifact and checks all required content
counts plus the new China, gastronomy, and day-detail routes.

## Build the mobile PDF

The generator requires Python 3, ReportLab, and the system DejaVu fonts. A CJK
font needed for the Chinese hotel addresses is included in `assets/fonts`.

```bash
npm run pdf
```

The file is written to
`output/pdf/Japan_2026_mobile_itinerary.pdf`. Its 108 mm page width and iPhone
15 Pro aspect ratio are deliberate: each page is intended to be read fit to
width on a small phone.

## Offline use on iPhone

1. Open the deployed site in Safari while online.
2. Tap “Сохранить весь маршрут” on the home page and wait for confirmation.
3. Use Share → “На экран Домой”.
4. Test once in Airplane Mode before departure.

The local pages, itinerary data, CSS, and scripts remain available offline.
External Tabelog, map, airline, hotel, and official-site links still require a
connection. Repeat “Обновить офлайн-копию” after each weekly content release.

## Deployment

The repository is configured for OpenAI Sites in `.openai/hosting.json`. The
standard Sites checkpoint command installs locked dependencies, runs the build,
publishes the source checkpoint, and deploys the resulting version. No database
or object-storage bindings are required.
