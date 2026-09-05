# Japan 2026 — changelog · 05.09.2026

## Information architecture
- New five-section IA shared by desktop/mobile: **Сегодня / Маршрут / Гиды / Карман / Подготовка**.
- Home is now a date-aware dashboard instead of a duplicate list of all days.
- Route is one 15-day chronological stream: Moscow → Beijing → Japan → Chengdu → Moscow.
- Removed the standalone `/china` route; China sightseeing is represented as normal day pages.
- Added `/guides` as the common parent for Gastronomy and Shopping.
- Transport and global Plan B are logically subordinated to Pocket.
- Offline setup moved to Preparation; Pocket shows only readiness status.

## Day experience
- DayView order: hero/anchors → Now → main route → delay decision → compact Plan B → alternatives → food → contextual shopping → photo → documents/links.
- Move events now include a contextual **Билет / правила** link to Transport.
- Shopping inside a day is a contextual city subset only; it never assigns a mandatory visit time.
- Fuji 30.09 is the primary plan; Tokyo is weather Plan B.

## Canonical content delta
- Beijing 20.09 rebuilt around Forbidden City → Jingshan → Gulou/hutongs → Shichahai/Houhai → Jingmo dinner.
- Umeda Sky Building and Fuji Excursion are DONE.
- Sukiyaki Imaasa is no longer a required booking action.
- Sushi no Musashi Sanjo Honten retained as the preferred conveyor-belt sushi experience without advance booking.
- Flight facts remain brief in day chronology; flight number/terminal/ticket detail stays in **Билеты и транспорт**.
- Shopping guide follows the approved 05.09 allowlist; legacy removed targets stay removed.

## PDF
- Rebuilt from the same canonical data and unified chronology.
- 100 pages; bookmarks and external links validated.

## Content-integrity correction pass
- Removed the stale protected-Imaasa logic from 28.09 across DayView and the gastronomy layer. Imaasa remains only an optional restaurant if separately chosen; no booking To Do is created.
- Restored 21.09 Fairfield → PEK T2 and the concise PEK → KIX flight event to chronological routing; flight number/terminal/baggage details remain in Transport.
- Restored Hiroshige/TNM and Edo-Tokyo Museum as **Plan B / watch** tasks only for the case where Fuji-day is cancelled on weather grounds.
- Corrected Shiunso wording: free private bath is requested at check-in; paid Kanzan-no-Yu is only by separate choice.
- Restored the global Japan taxi / China DiDi transport rule.
- Added Amap coverage for Forbidden City and Jingshan and direct Amap shortcuts for the Beijing primary route.
- PDF day counters are dynamic and now correctly show `DAY N OF 15`; regenerated PDF has 102 pages.
