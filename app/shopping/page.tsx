import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { ShoppingPlanner } from "@/app/ui/shopping-planner";
import shopping from "@/data/shopping-guide.json";

export const metadata: Metadata = { title: "Шопинг" };

export default function ShoppingPage() {
  return (
    <>
      <header className="page-hero simple-hero shopping-hero-page">
        <div className="hero-kicker"><ShoppingBag size={15} /> шопинг</div>
        <h1>Куда удобно<br />заскочить.</h1>
        <p>Город → район → магазин → что смотреть.</p>
      </header>
      <ShoppingPlanner cities={shopping.cities} principle={shopping.meta.principle} />
    </>
  );
}
