"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CheckSquare2, Home, Map, Plane, ShieldCheck, TrainFront, UtensilsCrossed } from "lucide-react";
import trip from "@/data/trip.json";
import { ServiceWorkerRegistration } from "./service-worker-registration";

const mainNav = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/day", label: "Дни", icon: CalendarDays },
  { href: "/todo", label: "To do", icon: CheckSquare2 },
  { href: "/pocket", label: "Карман", icon: ShieldCheck },
];

const referenceNav = [
  { href: "/china", label: "Китай", icon: Plane },
  { href: "/food", label: "Гастрономия", icon: UtensilsCrossed },
  { href: "/plan-b", label: "Plan B", icon: Map },
  { href: "/transport", label: "Транспорт", icon: TrainFront },
  { href: "/shopping", label: "Шопинг", icon: CheckSquare2 },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="app-frame">
      <ServiceWorkerRegistration />
      <aside className="desktop-rail">
        <Link href="/" className="rail-brand"><span>日</span><div><strong>Япония 2026</strong><small>маршрут в кармане</small></div></Link>
        <div className="rail-dates">19 сентября — 3 октября</div>
        <nav className="rail-nav" aria-label="Главная навигация">
          {mainNav.map((item) => <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.href}><item.icon size={18} /><span>{item.label}</span></Link>)}
        </nav>
        <div className="rail-divider" />
        <nav className="rail-nav secondary" aria-label="Справочники">
          {referenceNav.map((item) => <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.href}><item.icon size={17} /><span>{item.label}</span></Link>)}
        </nav>
        <div className="rail-trip">
          <span className="online-pulse" />
          <div><strong>Offline-first</strong><small>{trip.days.length} дней · v{trip.meta.version}</small></div>
        </div>
      </aside>
      <div className="mobile-canvas">
        <header className="mobile-topbar">
          <Link href="/" className="mobile-brand"><span>日</span><strong>Japan 2026</strong></Link>
          <span className="topbar-date">19.09—03.10</span>
        </header>
        <main>{children}</main>
        <nav className="bottom-nav" aria-label="Основная навигация">
          {mainNav.map((item) => (
            <Link className={isActive(item.href) ? "active" : ""} href={item.href} key={item.href}>
              <item.icon size={21} strokeWidth={isActive(item.href) ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
