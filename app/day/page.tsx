import type { Metadata } from "next";
import { ArrowRight, Gauge, MapPinned, Sunrise } from "lucide-react";
import trip from "@/data/trip.json";
import { SiteLink } from "@/app/ui/site-link";

export const metadata: Metadata = { title: "Маршрут" };

export default function DaysPage() {
  return (
    <>
      <header className="page-hero simple-hero days-hero">
        <div className="hero-kicker"><MapPinned size={15} /> единая хронология</div>
        <h1>15 дней.<br />Один маршрут.</h1>
        <p>Москва → Пекин → Япония → Чэнду → Москва. Китайские дни больше не живут отдельным маршрутом.</p>
      </header>
      <section className="page-section first-section">
        <div className="city-ribbon route-ribbon" aria-label="Города поездки">
          {trip.cityRanges.map((range) => <div className={`city-segment ${range.color}`} key={range.city}><strong>{range.label}</strong><span>{range.dates}</span></div>)}
        </div>
        <div className="legend-row"><span><i className="load-dot easy" /> лёгкая</span><span><i className="load-dot medium" /> средняя</span><span><i className="load-dot high" /> высокая</span></div>
        <div className="day-cards">
          {trip.days.map((day) => (
            <SiteLink href={`/day/${day.id}`} className="full-day-card" key={day.id}>
              <div className="full-day-top">
                <div className="day-number large"><span>{day.number}</span><small>день</small></div>
                <div className="full-day-title"><small>{day.dateLabel} · {day.city}</small><h2>{day.title}</h2></div>
                <ArrowRight size={19} />
              </div>
              <p>{day.summary}</p>
              <div className="day-meta-row"><span><Gauge size={14} /> {day.load}</span><span><MapPinned size={14} /> {day.distance}</span><span><Sunrise size={14} /> {day.wake}</span></div>
              <div className="anchor-pills">{day.anchors.map((anchor) => <span key={`${anchor.time}-${anchor.label}`}><strong>{anchor.time}</strong> {anchor.label}</span>)}</div>
            </SiteLink>
          ))}
        </div>
      </section>
    </>
  );
}
