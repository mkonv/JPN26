# Changelog · 29 августа 2026

Baseline: `Japan_2026_GitHub_Pages_FINAL_2026-08-23.zip` и
`Japan_2026_mobile_itinerary_FINAL_2026-08-23.pdf`.

## Подтверждённая недельная дельта

- Hiroshima 24.09: оба reserved-seat сегмента закрыты как `done`.
  - Mizuho 601: Shin-Osaka 06:00 -> Hiroshima 07:25, Ordinary Reserved,
    Car 4, seats 9-A/9-B.
  - Sakura 766: Hiroshima 18:33 -> Shin-Osaka 19:59, Ordinary Reserved,
    Car 4, seats 8-A/8-B.
  - Оба сегмента оформлены по Kansai-Hiroshima Area Pass без отдельного
    полного тарифа.
- Hikari 642 на 27.09: SmartEX confirmation закрыт.
  - Kyoto 08:33 -> Odawara 10:38, Ordinary Reserved, Car 6,
    seats 9-D/9-E; 9-E - окно со стороны Fuji.
  - Каноническая оплаченная сумма сохранена: ¥24,200 за двоих.
  - IC Card for Boarding пока не назначены. В To Do оставлен только выбор
    boarding method перед поездкой: назначить по одной IC-карте каждому
    пассажиру либо сохранить и распределить два отдельных QR-Tickets.

## Синхронизация материалов

- Новые вагоны/места внесены в дневные маршруты, Transport, To Do,
  Fuji photo-note и mobile PDF.
- Удалены устаревшие формулировки о предстоящем подтверждении SmartEX и
  необходимости ещё оформить Hiroshima seats.
- Другие маршруты, sightseeing, shopping, рестораны и denylist не менялись.

## Постоянные release-проверки

- Добавлен regression-тест точных Hiroshima seats и закрытого статуса задачи.
- SmartEX regression теперь требует Car 6, 9-D/9-E, статус подтверждения и
  явное состояние IC Card for Boarding.
- PWA-upgrade тест проверяет переход с предыдущего FINAL на новый Hiroshima
  shell без очистки storage/cache.
- Mobile QA сохраняет отдельные critical screenshots для Hiroshima и
  Transport.
- Добавлен executable PDF validator: критические факты, outline, glyphs,
  URI annotations и полное покрытие Google Maps/Amap ссылок из canonical data.

## Осталось сделать

- Перед 27.09 выбрать SmartEX boarding method: две назначенные IC-карты или
  два отдельных QR-Tickets; при проходе забрать Seat Information.
- Fuji из 9-E остаётся погодным `FUJI WATCH`, а не гарантированной видимостью.
