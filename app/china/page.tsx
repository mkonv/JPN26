import type { Metadata } from "next";
import { AlertTriangle, Check, ExternalLink, Hotel, MapPinned, Plane, ShieldCheck, UtensilsCrossed } from "lucide-react";
import enrichment from "@/data/travel-enrichment.json";

export const metadata: Metadata = { title: "Остановки в Китае" };

export default function ChinaPage() {
  const hotels = enrichment.additionalHotels;
  return (
    <>
      <header className="page-hero simple-hero china-hero">
        <div className="hero-kicker"><Plane size={15} /> две промежуточные остановки</div>
        <h1>Пекин.<br />Чэнду.</h1>
        <p>Полный край маршрута: Москва → Пекин → Япония → Чэнду → Москва. С рейсами, отелями и защищённым временем.</p>
      </header>

      <section className="page-section first-section">
        <div className="section-heading"><div><span>все перелёты</span><h2>Четыре рейса</h2></div></div>
        <div className="flight-cards">
          {enrichment.flights.map((flight) => (
            <article key={flight.id}>
              <div className="flight-top"><span>{flight.date}</span><strong>{flight.flight}</strong></div>
              <div className="flight-route"><div><strong>{flight.depart}</strong><span>{flight.from}</span></div><Plane size={17} /><div><strong>{flight.arrive}</strong><span>{flight.to}</span></div></div>
              <p>{flight.terminal} · {flight.status}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section china-rule-section">
        <div className="section-heading"><div><span>пограничная логика</span><h2>{enrichment.china.rule.title}</h2></div></div>
        <article className="china-rule-card">
          <ShieldCheck size={22} />
          <div><p>{enrichment.china.rule.summary}</p><dl><div><dt>Под рукой</dt><dd>{enrichment.china.rule.protect}</dd></div><div><dt>Перепроверить</dt><dd>{enrichment.china.rule.check}</dd></div></dl></div>
        </article>
      </section>

      <ChinaStop stop={enrichment.china.outbound} eyebrow="туда · 19–21 сентября" />

      <section className="page-section china-hotels-section">
        <div className="section-heading"><div><span>показать водителю</span><h2>Отели в Китае</h2></div></div>
        <div className="china-hotel-cards">
          {hotels.map((hotel) => (
            <article key={hotel.name}>
              <Hotel size={19} /><div><span>{hotel.city} · {hotel.dates}</span><h3>{hotel.name}</h3><p className="china-local-address">{hotel.localAddress}</p><small>{hotel.address}</small><a href={`tel:${hotel.phone.replace(/\s/g, "")}`}>{hotel.phone}</a><em>{hotel.note}</em></div>
            </article>
          ))}
        </div>
      </section>

      <ChinaStop stop={enrichment.china.return} eyebrow="обратно · 2–3 октября" />

      <section className="page-section china-prep-section">
        <div className="section-heading"><div><span>до вылета</span><h2>Подготовить Китай</h2></div></div>
        <ul className="china-prep-list">{enrichment.china.prep.map((item) => <li key={item}><Check size={16} /><span>{item}</span></li>)}</ul>
      </section>

      <section className="page-section online-section">
        <div className="section-heading"><div><span>нужна сеть</span><h2>Официальные источники</h2></div></div>
        <div className="official-links">{enrichment.china.links.map((link) => <a href={link.url} target="_blank" rel="noreferrer" key={link.url}><span>{link.label}</span><small>онлайн</small><ExternalLink size={16} /></a>)}</div>
      </section>
    </>
  );
}

type ChinaStopData = typeof enrichment.china.outbound | typeof enrichment.china.return;

function ChinaStop({ stop, eyebrow }: { stop: ChinaStopData; eyebrow: string }) {
  return (
    <section className="page-section china-stop-section">
      <div className="section-heading"><div><span>{eyebrow}</span><h2>{stop.title}</h2></div></div>
      <p className="parallel-intro">{stop.summary}</p>
      <div className="china-timeline">
        {stop.timeline.map((item, index) => <article key={`${item.time}-${item.title}`}><span>{index + 1}</span><time>{item.time}</time><div><strong>{item.title}</strong><p>{item.detail}</p></div></article>)}
      </div>
      <div className="china-map-block">
        <div className="china-food-head"><MapPinned size={18} /><div><span>готово для Китая</span><strong>Китайские адреса + Amap</strong></div></div>
        <div className="china-place-list">{stop.places.map((place) => <a href={place.amap} target="_blank" rel="noreferrer" key={place.name}><div><strong>{place.name}</strong><p>{place.address}</p></div><ExternalLink size={16} /></a>)}</div>
      </div>
      <div className="china-food-block">
        <div className="china-food-head"><UtensilsCrossed size={18} /><div><span>soft preference по свинине</span><strong>Сильное место важнее абсолютного запрета</strong></div></div>
        <p className="china-food-warning">{enrichment.meta.foodSafety.summary}</p>
        <div className="china-food-list">{stop.food.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.name}><div><strong>{item.name}</strong><span>{item.dish}</span><p>{item.fit}</p></div><MapPinned size={17} /></a>)}</div>
      </div>
      {stop.id === "beijing-stopover" && <div className="china-warning"><AlertTriangle size={18} /><p><strong>Багажная развилка:</strong> не угадывать. В SVO прочитать аэропорт на бирке: PEK — получаем 20.09; KIX — багаж следует дальше. На PEK всё равно подтвердить у стойки транзита.</p></div>}
    </section>
  );
}
