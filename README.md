# Япония и Китай 2026

Мобильный офлайн-справочник поездки Victoria и Misha. Проект собран на Next.js как полностью статический PWA для GitHub Pages: страницы заранее экспортируются в HTML, а Service Worker сохраняет версионированную офлайн-копию маршрутов.

## Важная модель приватности
GitHub Pages не является приватным хранилищем. `noindex/nofollow` снижает вероятность поисковой индексации, но **не ограничивает доступ по URL**. Секреты не должны попадать в репозиторий.

Коды бронирований в интерфейсе «Карман» хранятся только в памяти текущей вкладки и исчезают после reload; Web Storage не используется.

## Локальная проверка

```bash
npm ci
npm run security:audit
NEXT_PUBLIC_BASE_PATH=/JPN26 npm run check
npx playwright install chromium
NEXT_PUBLIC_BASE_PATH=/JPN26 npm run test:offline
NEXT_PUBLIC_BASE_PATH=/JPN26 npm run test:mobile
npm run pdf
npm run pdf:validate
```

`/JPN26` — имя репозитория в адресе GitHub Pages. Для другого project site замените значение; для корневого домена оставьте переменную пустой.

## Публикация
1. Поместите содержимое архива в корень репозитория.
2. В `Settings → Pages` выберите `Source: GitHub Actions`.
3. Зафиксируйте все изменения, включая удаления, и отправьте их в `main`.
4. Workflow `.github/workflows/pages.yml` выполнит dependency security gate, lint/build/regressions, offline/PWA и mobile QA, затем опубликует каталог `out/`.

Подробности — в [GITHUB_PAGES.md](GITHUB_PAGES.md). Политика security-аудита — в [SECURITY.md](SECURITY.md).

## Однократная очистка старой версии
Если архив накладывается на прежний репозиторий, удалите оставшиеся файлы старого Sites/Cloudflare/Vinext-шаблона. Они больше не используются:

```bash
git rm --ignore-unmatch \
  app/chatgpt-auth.ts \
  build/sites-vite-plugin.ts \
  db/index.ts db/schema.ts \
  drizzle.config.ts drizzle/meta/_journal.json \
  examples/d1/app/api/notes/route.ts examples/d1/db/schema.ts \
  scripts/build-verified.sh scripts/install-ci.sh \
  scripts/sites-env.sh scripts/validate-artifact.sh \
  vite.config.ts worker/index.ts
```

После копирования выполните `git add -A`: именно этот вариант добавит новые файлы, обновит существующие и зафиксирует удаления.
