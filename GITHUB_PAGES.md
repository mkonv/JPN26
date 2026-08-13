# GitHub Pages deployment

This copy is prepared for a static GitHub Pages deployment.

## One-time setup

1. Create a new GitHub repository and upload the contents of this folder to the repository root.
2. Use `main` as the default branch.
3. Open **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **GitHub Actions**.
5. Open the **Actions** tab and wait for the workflow **Deploy Japan 2026 to GitHub Pages** to complete.
6. Return to **Settings → Pages** to see the published URL.

The workflow automatically reads the GitHub Pages base path, runs `next build` as a static export, uploads `./out`, and deploys it.

## Booking-code privacy

The original source contained two booking/verification codes. They were intentionally removed from this GitHub-ready copy because a GitHub Pages site is static and anything shipped in its HTML/JavaScript can be read by visitors even when visually hidden.

On the published site's **Карман → Коды бронирований** section, enter each code once. The value is stored only in that browser's `localStorage`, not in GitHub and not on a server.

## Offline mode

After deployment:

1. Open the live site in Safari on the iPhone while online.
2. Tap **Сохранить весь маршрут**.
3. Add the site to the Home Screen.
4. Open it once in Airplane Mode and test several day pages.

The service worker in this copy is base-path-aware, so it works for both `username.github.io/repository/` project sites and root Pages sites.
