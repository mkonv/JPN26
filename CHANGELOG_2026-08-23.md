# Changelog · 23 августа 2026

## Подтверждённые изменения

- Kansai–Hiroshima Area Pass куплен на 22–26 сентября за ¥17,000 на человека; в KIX нужно только получить физический pass. Reserved Seat в зоне pass не требует отдельного полного тарифа.
- Himeji подтверждён без неопределённостей: Hikari 731, 07:34–08:03, Car 14, 3-D/3-E; обратно Hikari 710, 13:11–13:46, Car 14, 6-D/6-E.
- Yakiniku M Fukushima Honten подтверждён TableCheck на 23 сентября в 20:00 для 2 человек; добавлены 15-минутное правило опоздания и двухчасовое окно стола.
- Nara 22 сентября переведена на спокойный старт: завтрак 07:00–07:30, прямой JR около 07:55, прибытие около 08:50; экстремально ранний выход снят без потери основной программы.
- Osaka → Kyoto 25 сентября перенесён на выход из Hotel Hankyu около 09:15–09:30. При задержке сокращается Ryōan-ji, а не сон или завтрак.
- HARUKA остаётся купленным физическим discounted One-way Ticket: в KIX нужны паспорта, бронь, PIN и физическая карта оплаты; WEST QR не используется.

## Фото и навигация

- Добавлен единый photo guide: 46 фототочек с приоритетами `PHOTO MUST`, `PHOTO GOOD`, `SECONDARY ICONIC` и `FUJI WATCH`; `SIGNATURE SHOT` отмечает композицию, а не обязательное ожидание света.
- Для Нары сохранён утверждённый список: Nigatsudō — `PHOTO MUST`; Tōdai-ji/Nandaimon, Kasuga Taisha approach, Yoshikien и Hōzenji Yokocho — `PHOTO GOOD`; Dōtonbori — `SECONDARY ICONIC`.
- Hikari 642 сохраняет Fuji-side место E. Shin-Fuji намеренно не добавлен как остановка или фотокрюк.
- Google Maps приведён к официальному Maps URL API `maps/search/?api=1&query=...`; надёжные Place ID передаются через `query_place_id`. Самодельные `/maps/place/<text>` удалены.
- Неоднозначные точки разделены: Gojōzaka/Yasaka Pagoda, Hanamikoji/Yasaka Shrine и три архитектурных anchor в Omotesando. Для Китая сохранены Amap и Apple Maps вместе с Google bookmark.

## Приложение, PWA и PDF

- В portrait-навигации явно видны пять пунктов: Главная, Дни, Шопинг, Подготовка, Карман. Китай, Гастрономия, План Б и Транспорт доступны через верхнее меню «Разделы».
- Обновление PWA теперь переключает старый FINAL worker на новый через `controllerchange`, сохраняет предыдущий полный precache как fallback и перезагружает свежую shell-версию без очистки storage.
- Мобильный PDF генерирует фототочки из тех же JSON-данных, нормализует Google Maps URL перед созданием аннотаций и использует явный CJK font fallback для смешанных строк.
- Регрессионный набор расширен подтверждённой дельтой, photo canon, Google Maps API, portrait/landscape layout и old-FINAL → candidate PWA upgrade.

