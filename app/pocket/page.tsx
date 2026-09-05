import type { Metadata } from "next";
import { CopyButton } from "@/app/ui/copy-button";
import { OfflinePanel } from "@/app/ui/offline-panel";
import { SecretReveal } from "@/app/ui/secret-reveal";
import { PocketTodayHotel } from "@/app/ui/pocket-today-hotel";
import { SiteLink } from "@/app/ui/site-link";
import { googleMapsHref } from "@/lib/google-maps.mjs";
import { AlertTriangle, ArrowRight, CloudSun, ExternalLink, Hotel, Map, MapPin, Phone, ShieldCheck, Ticket } from "lucide-react";
import trip from "@/data/trip.json";
import enrichment from "@/data/travel-enrichment.json";

export const metadata: Metadata = { title: "Карман" };
type PocketSecret = { label: string; value: string };
type PocketHotel = { city:string; dates:string; name:string; address:string; phone:string; localAddress?:string; note?:string; mapUrl?:string; googleMapsUrl?:string };

export default function PocketPage() {
  const secrets: PocketSecret[] = trip.days.flatMap((day) => (day as typeof day & {secrets?:PocketSecret[]}).secrets ?? []);
  const hotels: PocketHotel[] = [enrichment.additionalHotels[0], ...trip.hotels, enrichment.additionalHotels[1]];
  return <>
    <header className="page-hero simple-hero pocket-hero"><div className="hero-kicker"><ShieldCheck size={15}/> быстрый доступ</div><h1>Карман.</h1><p>Отели, SOS, билеты, коды и погода.</p></header>

    <section className="page-section first-section pocket-quick">
      <div className="section-heading"><div><span>быстрый доступ</span><h2>Самое нужное</h2></div></div>
      <PocketTodayHotel days={trip.days} hotels={hotels} />
      <div className="pocket-quick-grid">
        <SiteLink href="/transport"><Ticket size={19}/><span><strong>Билеты и транспорт</strong><small>рейсы, поезда, проход</small></span><ArrowRight size={15}/></SiteLink>
        <SiteLink href="/plan-b"><Map size={19}/><span><strong>Plan B</strong><small>аварийные сценарии</small></span><ArrowRight size={15}/></SiteLink>
        <a href="#codes"><ShieldCheck size={19}/><span><strong>Коды</strong><small>только текущая сессия</small></span><ArrowRight size={15}/></a>
        <a href="#sos"><AlertTriangle size={19}/><span><strong>SOS</strong><small>Япония и Китай</small></span><ArrowRight size={15}/></a>
      </div>
      <OfflinePanel mode="status" />
    </section>

    <section className="page-section emergency-section" id="sos"><div className="section-heading"><div><span>экстренно</span><h2>SOS</h2></div></div><div className="emergency-grid"><a href="tel:110"><span>Япония · полиция</span><strong>110</strong></a><a href="tel:119"><span>Япония · скорая/пожарные</span><strong>119</strong></a><a href="tel:110"><span>Китай · полиция</span><strong>110</strong></a><a href="tel:120"><span>Китай · скорая</span><strong>120</strong></a></div></section>

    <section className="page-section" id="hotels"><div className="section-heading"><div><span>ночёвки</span><h2>Отели</h2></div></div><div className="hotel-list">{hotels.map((hotel)=>{const raw=hotel.googleMapsUrl??hotel.mapUrl??`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hotel.name}, ${hotel.address}`)}`; return <article key={hotel.name}><div className="hotel-head"><Hotel size={19}/><div><span>{hotel.city} · {hotel.dates}</span><h2>{hotel.name}</h2></div></div><p>{hotel.address}</p>{hotel.localAddress&&<p className="hotel-local-address">{hotel.localAddress}</p>}{hotel.note&&<p className="hotel-note">{hotel.note}</p>}<div className="hotel-actions"><a href={`tel:${hotel.phone.replace(/\s/g,"")}`}><Phone size={16}/>Позвонить</a><a href={googleMapsHref(raw,`${hotel.name}, ${hotel.address}`)} target="_blank" rel="noreferrer"><MapPin size={16}/>Карта</a><CopyButton value={`${hotel.name}\n${hotel.localAddress?`${hotel.localAddress}\n`:""}${hotel.address}\n${hotel.phone}`}/></div></article>})}</div></section>

    <section className="page-section" id="codes"><div className="section-heading"><div><span>по касанию</span><h2>Коды бронирований</h2></div></div><p className="section-intro">Не входят в публичные исходники и не сохраняются в localStorage.</p><div className="secret-list">{secrets.map((s)=><SecretReveal label={s.label} value={s.value} key={s.label}/>)}</div></section>

    <section className="page-section"><div className="section-heading"><div><span>Китай</span><h2>Транзит и навигация</h2></div></div><ul className="pocket-rules">{enrichment.china.prep.map((rule,index)=><li key={rule}><span>{index+1}</span><p>{rule}</p></li>)}</ul><div className="official-links">{enrichment.china.links.map((l)=><a href={l.url} target="_blank" rel="noreferrer" key={l.url}><span>{l.label}</span><small>онлайн</small><ExternalLink size={16}/></a>)}</div></section>

    <section className="page-section"><div className="section-heading"><div><span>перед выходом</span><h2>Ключевые правила</h2></div></div><ul className="pocket-rules">{trip.pocket.rules.map((rule,index)=><li key={rule}><span>{index+1}</span><p>{rule}</p></li>)}</ul></section>
    <section className="page-section" id="weather-status"><div className="section-heading"><div><span>требуется сеть</span><h2>Погода и статус</h2></div></div><div className="official-links">{trip.pocket.weather.map((l)=><a href={l.url} target="_blank" rel="noreferrer" key={l.url}><CloudSun size={17}/><span>{l.label}</span><small>онлайн</small><ExternalLink size={16}/></a>)}</div></section>
  </>;
}
