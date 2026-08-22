import trip from "@/data/trip.json";
import { withBasePath } from "@/app/site-path";
import { DesktopNavigation, MobileNavigation, MobileReferenceMenu } from "./navigation";
import { ToriiMark } from "./japanese-mark";
import { ServiceWorkerRegistration } from "./service-worker-registration";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-frame">
      <ServiceWorkerRegistration />
      <aside className="desktop-rail">
        <a href={withBasePath("/")} className="rail-brand"><span className="brand-seal"><ToriiMark /></span><div><strong>Япония 2026</strong><small>маршрут в кармане</small></div></a>
        <div className="rail-dates">19 сентября — 3 октября</div>
        <DesktopNavigation />
        <div className="rail-trip">
          <span className="online-pulse" />
          <div><strong>Работает офлайн</strong><small>{trip.days.length} дней · {trip.meta.version}</small></div>
        </div>
      </aside>
      <div className="mobile-canvas">
        <header className="mobile-topbar">
          <a href={withBasePath("/")} className="mobile-brand"><span className="brand-seal"><ToriiMark /></span><strong>Япония 2026</strong></a>
          <MobileReferenceMenu />
        </header>
        <main>{children}</main>
        <MobileNavigation />
      </div>
    </div>
  );
}
