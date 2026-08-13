import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CloudSun, ExternalLink, ShieldCheck } from "lucide-react";
import trip from "@/data/trip.json";

export const metadata: Metadata = { title: "Plan B" };

export default function PlanBPage() {
  return (
    <>
      <header className="page-hero simple-hero planb-hero">
        <div className="hero-kicker"><ShieldCheck size={15} /> решения вместо паники</div>
        <h1>Plan B,<br />который не ломает день.</h1>
        <p>Каждый сценарий начинается с сигнала, затем защищает главное и только потом сокращает остальное.</p>
      </header>
      <section className="page-section first-section">
        <div className="planb-list">
          {trip.planB.map((item, index) => (
            <article className="planb-card" key={item.title}>
              <div className="planb-number">0{index + 1}</div>
              <div><span>сценарий</span><h2>{item.title}</h2></div>
              <dl><div><dt><AlertTriangle size={15} /> сигнал</dt><dd>{item.signal}</dd></div><div><dt><ArrowRight size={15} /> действие</dt><dd>{item.action}</dd></div></dl>
            </article>
          ))}
        </div>
      </section>
      <section className="page-section dark-section">
        <div className="section-heading light-heading"><div><span>универсальное правило</span><h2>Сначала якорь, затем возврат</h2></div></div>
        <p className="dark-copy">Если транспорт сбился, не ускоряйте весь список. Сохраните фиксированный вход или поезд домой, уберите первую гибкую остановку и пересчитайте только ближайший участок.</p>
      </section>
      <section className="page-section">
        <div className="section-heading"><div><span>быстрый переход</span><h2>Дни с решениями</h2></div></div>
        <div className="official-links">
          {trip.days.filter((day) => "decision" in day).map((day) => <Link href={`/day/${day.id}`} key={day.id}><span>{day.dateLabel.slice(0, 12)} · {day.title}</span><small>открыть</small><ArrowRight size={16} /></Link>)}
        </div>
        <div className="weather-links"><a href="https://www.jma.go.jp/bosai/forecast/" target="_blank" rel="noreferrer"><CloudSun size={18} /><span>JMA forecast</span><ExternalLink size={15} /></a><a href="https://live.fujigoko.tv/" target="_blank" rel="noreferrer"><CloudSun size={18} /><span>Fuji live cams</span><ExternalLink size={15} /></a></div>
      </section>
    </>
  );
}
