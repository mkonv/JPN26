import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "./ui/app-shell";
import { withBasePath } from "./site-path";

export const metadata: Metadata = {
  title: { default: "Япония 2026 — маршрут в кармане", template: "%s · Япония 2026" },
  description: "Офлайн-путеводитель Москва — Пекин — Япония — Чэнду: 15 дней, гастрономия, План Б и бронирования.",
  applicationName: "Япония 2026",
  manifest: withBasePath("/manifest.webmanifest"),
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Япония 2026" },
  icons: { icon: withBasePath("/favicon.svg"), apple: withBasePath("/apple-touch-icon.png") },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#123d34",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body><AppShell>{children}</AppShell></body></html>;
}
