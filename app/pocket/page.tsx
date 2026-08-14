import type { Metadata } from "next";
import { CopyButton } from "@/app/ui/copy-button";
import { OfflinePanel } from "@/app/ui/offline-panel";
import { SecretReveal } from "@/app/ui/secret-reveal";
import { CloudSun, ExternalLink, Hotel, MapPin, Phone, ShieldCheck } from "lucide-react";
import trip from "@/data/trip.json";
import enrichment from "@/data/travel-enrichment.json";

export const metadata: Metadata = { title: "Карман" };

type PocketSecret = { label: string; value: string };
type PocketHotel = {
  city: string;
  dates: string;
  name: string;
  address: string;
  phone: string;
  localAddress?: string;
  note?: string;
};

export default function PocketPage() {
  const secrets: PocketSecret[] = trip.days.flatMap((day) => {
    const item = day as typeof day & { secrets?: PocketSecret[] };
    return item.secrets ?? [];
  });
  const hotels: PocketHotel[] = [enrichment.additionalHotels[0], ...trip.hotels, enrichment.additionalHotels[1]];
  return (
    <>
      <header className="page-hero simple-hero pocket-hero">
        <div className="hero-kicker"><ShieldCheck size={15} /> без поиска по документам</div>
        <h1>Нужное<br />за десять секунд.</h1>
        <p>Отели, телефоны, скрытые коды, офлайн-копия и правила, которые вспоминают слишком поздно.</p>
      </header>
      <section className="page-section first-section">
        <div className="section-heading"><div><span>ночёвки</span><h2>Отели</h2></div></div>
        <div className="hotel-list">
          {hotels.map((hotel) => (
            <article key={hotel.name}>
              <div className="hotel-head"><Hotel size={19} /><div><span>{hotel.city} · {hotel.dates}</span><h2>{hotel.name}</h2></div></div>
              <p>{hotel.address}</p>
              {hotel.localAddress && <p className="hotel-local-address">{hotel.localAddress}</p>}
              {hotel.note && <p className="hotel-note">{hotel.note}</p>}
              <div className="hotel-actions">
                <a href={`tel:${hotel.phone.replace(/\s/g, "")}`}><Phone size={16} /> Позвонить</a>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.address)}`} target="_blank" rel="noreferrer"><MapPin size={16} /> Карта</a>
                <CopyButton value={`${hotel.name}\n${hotel.localAddress ? `${hotel.localAddress}\n` : ""}${hotel.address}\n${hotel.phone}`} />
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="page-section emergency-section">
        <div className="section-heading"><div><span>экстренно</span><h2>Номера в Японии</h2></div></div>
        <div className="emergency-grid">{trip.pocket.emergency.map((item) => <a href={`tel:${item.value}`} key={item.value}><span>{item.label}</span><strong>{item.value}</strong></a>)}</div>
      </section>
      <section className="page-section china-emergency-section">
        <div className="section-heading"><div><span>экстренно</span><h2>Номера в Китае</h2></div></div>
        <div className="emergency-grid three"><a href="tel:110"><span>Полиция</span><strong>110</strong></a><a href="tel:120"><span>Скорая</span><strong>120</strong></a><a href="tel:119"><span>Пожарные</span><strong>119</strong></a></div>
      </section>
      <section className="page-section">
        <div className="section-heading"><div><span>по касанию</span><h2>Коды бронирований</h2></div></div>
        <p className="section-intro">Скрыты по умолчанию, чтобы номер не был постоянно виден на экране.</p>
        <div className="secret-list">{secrets.map((secret) => <SecretReveal label={secret.label} value={secret.value} key={secret.label} />)}</div>
      </section>
      <section className="page-section">
        <div className="section-heading"><div><span>перед выходом</span><h2>Пять правил</h2></div></div>
        <ul className="pocket-rules">{trip.pocket.rules.map((rule, index) => <li key={rule}><span>{index + 1}</span><p>{rule}</p></li>)}</ul>
      </section>
      <section className="page-section">
        <div className="section-heading"><div><span>офлайн</span><h2>Копия на устройстве</h2></div></div>
        <OfflinePanel />
      </section>
      <section className="page-section">
        <div className="section-heading"><div><span>требуется сеть</span><h2>Погода и статус</h2></div></div>
        <div className="official-links">{trip.pocket.weather.map((link) => <a href={link.url} target="_blank" rel="noreferrer" key={link.url}><CloudSun size={17} /><span>{link.label}</span><small>онлайн</small><ExternalLink size={16} /></a>)}</div>
      </section>
    </>
  );
}
