import type { Metadata } from "next";
import { ArrowRight, CreditCard, ExternalLink, TrainFront } from "lucide-react";
import trip from "@/data/trip.json";

export const metadata: Metadata = { title: "Транспорт" };

export default function TransportPage() {
  return (
    <>
      <header className="page-hero simple-hero transport-hero">
        <div className="hero-kicker"><TrainFront size={15} /> билеты и турникеты</div>
        <h1>Что показывать<br />и когда.</h1>
        <p>Самая частая ошибка — смешать проездной, билет на место и ICOCA. Здесь только рабочая схема.</p>
      </header>
      <section className="page-section first-section">
        <div className="transport-list">
          {trip.transport.map((item, index) => <article key={item.title}><div className="transport-icon">{index === 0 ? <CreditCard size={20} /> : index < 5 ? <TrainFront size={20} /> : <ArrowRight size={20} />}</div><div><span>{item.when}</span><h2>{item.title}</h2><p>{item.detail}</p></div></article>)}
        </div>
      </section>
      <section className="page-section gate-section">
        <div className="section-heading"><div><span>JR-West · 22–26.09</span><h2>Проход через турникет</h2></div></div>
        <ol className="gate-flow"><li><span>1</span><div><strong>Вставить физический проездной</strong><p>Не прикладывать ICOCA вместо него.</p></div></li><li><span>2</span><div><strong>Для синкансэна иметь билет на место</strong><p>Проездной отвечает за поездку, отдельный билет — за конкретное место.</p></div></li><li><span>3</span><div><strong>Забрать все билеты на выходе</strong><p>Не уходить от турникета без возвращённых карточек.</p></div></li></ol>
      </section>
      <section className="page-section">
        <div className="section-heading"><div><span>онлайн</span><h2>Официальные справочники</h2></div></div>
        <div className="official-links"><a href="https://www.westjr.co.jp/global/en/howto/guide/movie03.html" target="_blank" rel="noreferrer"><span>ICOCA guide</span><small>онлайн</small><ExternalLink size={16} /></a><a href="https://smart-ex.jp/en/entraining/iccard/" target="_blank" rel="noreferrer"><span>SmartEX + IC card</span><small>онлайн</small><ExternalLink size={16} /></a><a href="https://odakyu-global.com/passes/hakone-freepass/" target="_blank" rel="noreferrer"><span>Hakone Freepass</span><small>онлайн</small><ExternalLink size={16} /></a></div>
      </section>
    </>
  );
}
