import { ArrowRight, BookOpen, MapPinned, ShieldCheck } from "lucide-react";
import trip from "@/data/trip.json";
import { ToriiMark } from "./ui/japanese-mark";
import { SiteLink } from "./ui/site-link";
import { TodayDashboard } from "./ui/today-dashboard";
import { OfflinePanel } from "./ui/offline-panel";

export default function HomePage() {
  return (
    <>
      <section className="home-hero compact-home-hero">
        <div className="hero-japanese" aria-hidden="true"><ToriiMark /><span>NIPPON · 2026</span></div>
        <div className="hero-kicker"><MapPinned size={15} /> сегодня</div>
        <h1>Япония<br /><em>19.09—03.10</em></h1>
        <p>15 календарных дней · Москва → Пекин → Япония → Чэнду → Москва</p>
      </section>

      <TodayDashboard days={trip.days} tasks={trip.bookingTasks} />

      <section className="page-section home-shortcuts">
        <div className="section-heading"><div><span>быстрый вход</span><h2>Три главных действия</h2></div></div>
        <div className="shortcut-grid">
          <SiteLink href="/day"><MapPinned size={20}/><span><strong>Маршрут</strong><small>15 дней одной лентой</small></span><ArrowRight size={16}/></SiteLink>
          <SiteLink href="/pocket"><ShieldCheck size={20}/><span><strong>Карман</strong><small>отель, SOS, билеты</small></span><ArrowRight size={16}/></SiteLink>
          <SiteLink href="/guides"><BookOpen size={20}/><span><strong>Гиды</strong><small>еда и шопинг</small></span><ArrowRight size={16}/></SiteLink>
        </div>
      </section>

      <section className="page-section offline-status-home">
        <div className="section-heading"><div><span>статус устройства</span><h2>Офлайн readiness</h2></div><SiteLink href="/todo#offline-setup">Настроить <ArrowRight size={15}/></SiteLink></div>
        <OfflinePanel mode="status" />
      </section>
    </>
  );
}
