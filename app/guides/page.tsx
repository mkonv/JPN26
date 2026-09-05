import type { Metadata } from "next";
import { ArrowRight, BookOpen, ShoppingBag, UtensilsCrossed } from "lucide-react";
import enrichment from "@/data/travel-enrichment.json";
import shopping from "@/data/shopping-guide.json";
import { SiteLink } from "@/app/ui/site-link";

export const metadata: Metadata = { title: "Гиды" };

export default function GuidesPage() {
  const mustCount = enrichment.foodPassport.filter((item) => item.level === "must").length;
  const storeCount = shopping.cities.flatMap((city) => city.clusters.flatMap((cluster) => cluster.stores)).length;
  return (
    <>
      <header className="page-hero simple-hero guides-hero">
        <div className="hero-kicker"><BookOpen size={15} /> еда и покупки</div>
        <h1>Гастрономия<br />и шопинг.</h1>
        <p>Рестораны, главные блюда и проверенные магазины по городам.</p>
      </header>
      <section className="page-section first-section guide-hub-grid">
        <SiteLink href="/food" className="guide-hub-card food">
          <UtensilsCrossed size={24} />
          <div><span>гастрономия</span><h2>{mustCount} главных блюд</h2><p>Паспорт блюд, логика Tabelog и ресторанные варианты, уже встроенные в реальные окна дней.</p></div>
          <ArrowRight size={20} />
        </SiteLink>
        <SiteLink href="/shopping" className="guide-hub-card shopping">
          <ShoppingBag size={24} />
          <div><span>шопинг</span><h2>{storeCount} проверенных точек</h2><p>Город → удобный кластер → магазин → что смотреть. Без обязательных дат и крюков ради покупок.</p></div>
          <ArrowRight size={20} />
        </SiteLink>
      </section>
    </>
  );
}
