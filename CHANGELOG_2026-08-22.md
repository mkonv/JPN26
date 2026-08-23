# Changelog · 22 августа 2026

## Подтверждённые изменения недели

- Nezu Museum: покупка 2 билетов на 29.09, вход 10:00–11:00, подтверждение и скриншоты сохранены пользователем.
- HARUKA KIX → Osaka: куплены 2 discounted One-way Tickets за ¥3,600; сохранено получение физических билетов в KIX и запрет подмены на WEST QR.
- Shopping guide полностью переведён на схему `город → компактный район → магазин → товары`, без привязки к дням или обязательному таймингу.
- Из дневных маршрутов и связанных shopping-данных удалены старые shopping-вставки; основной sightseeing-маршрут не менялся ради магазинов.
- Оставлены только утверждённые часы, одежда, cas:pace, glänta My Ring, Sabae titanium eyewear, Gyokusendo/SUWADA и hair accessories Kyoto/Chengdu.

## Технические изменения

- Добавлен единый `data/shopping-guide.json`, используемый web и PDF.
- Mobile shopping UI заменён на компактные карточки кластеров и магазинов.
- Next.js и `eslint-config-next` обновлены с 16.2.11 до 16.3.2; устранены High findings в production dependency audit.
- Regression-набор расширен проверками allowlist/denylist shopping, Nezu/HARUKA и отсутствия дневной привязки shopping.
- Mobile QA теперь сохраняет отдельный screenshot shopping-раздела.

