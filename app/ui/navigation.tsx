"use client";

import { usePathname } from "next/navigation";
import { BookOpen, CalendarClock, CheckSquare2, Home, ShieldCheck } from "lucide-react";
import { withBasePath } from "@/app/site-path";

const navItems = [
  { href: "/", label: "Сегодня", icon: Home, matches: ["/"] },
  { href: "/day", label: "Маршрут", icon: CalendarClock, matches: ["/day"] },
  { href: "/guides", label: "Гиды", icon: BookOpen, matches: ["/guides", "/food", "/shopping"] },
  { href: "/pocket", label: "Карман", icon: ShieldCheck, matches: ["/pocket", "/transport", "/plan-b"] },
  { href: "/todo", label: "Подготовка", icon: CheckSquare2, matches: ["/todo"] },
];

function useActiveRoute() {
  const pathname = usePathname();
  return (item: (typeof navItems)[number]) => item.matches.some((prefix) => prefix === "/" ? pathname === "/" : pathname.startsWith(prefix));
}

export function DesktopNavigation() {
  const isActive = useActiveRoute();
  return (
    <nav className="rail-nav" aria-label="Главная навигация">
      {navItems.map((item) => (
        <a className={isActive(item) ? "active" : ""} href={withBasePath(item.href)} key={item.href} aria-current={isActive(item) ? "page" : undefined}>
          <item.icon size={18} /><span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}

export function MobileNavigation() {
  const isActive = useActiveRoute();
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {navItems.map((item) => (
        <a className={isActive(item) ? "active" : ""} href={withBasePath(item.href)} key={item.href} aria-current={isActive(item) ? "page" : undefined}>
          <item.icon size={20} strokeWidth={isActive(item) ? 2.2 : 1.8} />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
