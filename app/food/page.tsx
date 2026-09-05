import type { Metadata } from "next";
import { AlertTriangle, ArrowRight, Info, Star, UtensilsCrossed } from "lucide-react";
import enrichment from "@/data/travel-enrichment.json";
import { FoodPassport } from "@/app/ui/food-passport";
import { SiteLink } from "@/app/ui/site-link";

export const metadata: Metadata = { title: "Гастрономическое путешествие" };

export default function FoodPage() {
  const mustCount = enrichment.foodPassport.filter((item) => item.level === "must").length;
  return (
    <>
      <header className="page-hero simple-hero food-hero">
        <div className="hero-kicker"><UtensilsCrossed size={15} /> гастрономия</div>
        <h1>Япония<br />через еду.</h1>
        <p>{mustCount} главных блюд + бонусы. Конкретные 2–3 ресторана привязаны к каждому реальному окну обеда и ужина.</p>
      </header>

      <section className="page-section first-section">
        <div className="section-heading"><div><span>как читать</span><h2>Не рейтинг ради рейтинга</h2></div></div>
        <div className="food-principles">
          <article><Star size={19} /><div><strong>3.5 на Tabelog — уже сильно</strong><p>Японская шкала строже привычных 5-star сервисов. Мы не отбрасываем маршрутный вариант только из-за 3.4.</p></div></article>
          <article><Info size={19} /><div><strong>Сначала блюдо и логистика</strong><p>Основной выбор стоит первым; второй и третий страхуют очередь, выходной или другой бюджет.</p></div></article>
        </div>
        <article className="food-safety-card"><AlertTriangle size={18} /><div><strong>{enrichment.meta.foodSafety.title}</strong><p>{enrichment.meta.foodSafety.summary}</p><code>{enrichment.meta.foodSafety.ja}</code><small>{enrichment.meta.foodSafety.ru}</small></div></article>
        <SiteLink className="food-day-link" href="/day"><span>Открыть день и его рестораны</span><ArrowRight size={17} /></SiteLink>
      </section>

      <section className="page-section passport-section" id="passport">
        <div className="section-heading"><div><span>чек-лист на двоих</span><h2>Паспорт блюд</h2></div></div>
        <FoodPassport items={enrichment.foodPassport} />
      </section>

      <section className="page-section">
        <div className="section-heading"><div><span>важно</span><h2>Перед конкретным визитом</h2></div></div>
        <p className="parallel-intro">{enrichment.meta.tabelogNote} Ресторанные окна собраны под день недели поездки, но осенние праздники и частные выходные могут изменить расписание.</p>
      </section>
    </>
  );
}
