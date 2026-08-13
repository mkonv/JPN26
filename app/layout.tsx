import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "./ui/app-shell";
import { withBasePath } from "./site-path";

export const metadata: Metadata = {
  title: { default: "Япония 2026 — маршрут в кармане", template: "%s · Япония 2026" },
  description: "Offline-first маршрут Москва — Пекин — Япония — Чэнду: 15 дней, гастрономия, Plan B и бронирования.",
  applicationName: "Япония 2026",
  manifest: withBasePath("/manifest.webmanifest"),
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Japan 2026" },
  other: { "codex-preview": "development" },
  icons: { icon: withBasePath("/favicon.svg"), apple: withBasePath("/apple-touch-icon.png") },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#123d34",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body><AppShell>{children}</AppShell></body></html>;
}
