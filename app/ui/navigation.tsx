"use client";

import { usePathname } from "next/navigation";
import { CalendarDays, CheckSquare2, ChevronDown, Home, Map, Plane, ShieldCheck, ShoppingBag, TrainFront, UtensilsCrossed } from "lucide-react";
import { withBasePath } from "@/app/site-path";

const mainNav = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/day", label: "Дни", icon: CalendarDays },
  { href: "/todo", label: "Подготовка", icon: CheckSquare2 },
  { href: "/pocket", label: "Карман", icon: ShieldCheck },
];

const referenceNav = [
  { href: "/china", label: "Китай", icon: Plane },
  { href: "/food", label: "Гастрономия", icon: UtensilsCrossed },
  { href: "/plan-b", label: "План Б", icon: Map },
  { href: "/transport", label: "Транспорт", icon: TrainFront },
  { href: "/shopping", label: "Шопинг", icon: ShoppingBag },
];

function useActiveRoute() {
  const pathname = usePathname();
  return (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function DesktopNavigation() {
  const isActive = useActiveRoute();
  return (
    <>
      <nav className="rail-nav" aria-label="Главная навигация">
        {mainNav.map((item) => (
          <a className={isActive(item.href) ? "active" : ""} href={withBasePath(item.href)} key={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
            <item.icon size={18} /><span>{item.label}</span>
          </a>
        ))}
      </nav>
      <div className="rail-divider" />
      <nav className="rail-nav secondary" aria-label="Справочники">
        {referenceNav.map((item) => (
          <a className={isActive(item.href) ? "active" : ""} href={withBasePath(item.href)} key={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
            <item.icon size={17} /><span>{item.label}</span>
          </a>
        ))}
      </nav>
    </>
  );
}

export function MobileReferenceMenu() {
  const isActive = useActiveRoute();
  const hasActiveReference = referenceNav.some((item) => isActive(item.href));

  return (
    <details className={`mobile-reference-menu${hasActiveReference ? " active" : ""}`}>
      <summary aria-label="Открыть справочники">
        <span>{hasActiveReference ? referenceNav.find((item) => isActive(item.href))?.label : "Разделы"}</span>
        <ChevronDown size={15} />
      </summary>
      <nav className="mobile-reference-popover" aria-label="Справочники">
        {referenceNav.map((item) => (
          <a className={isActive(item.href) ? "active" : ""} href={withBasePath(item.href)} key={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
            <item.icon size={18} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </details>
  );
}

export function MobileNavigation() {
  const isActive = useActiveRoute();
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {mainNav.map((item) => (
        <a className={isActive(item.href) ? "active" : ""} href={withBasePath(item.href)} key={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
          <item.icon size={21} strokeWidth={isActive(item.href) ? 2.2 : 1.8} />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}
