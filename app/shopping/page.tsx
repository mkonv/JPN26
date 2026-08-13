import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { ShoppingPlanner } from "@/app/ui/shopping-planner";

export const metadata: Metadata = { title: "Шопинг" };

export default function ShoppingPage() {
  return (
    <>
      <header className="page-hero simple-hero shopping-hero-page">
        <div className="hero-kicker"><ShoppingBag size={15} /> отдельный трек</div>
        <h1>Покупки,<br />не съедающие поездку.</h1>
        <p>Окна, приоритеты и стоп-правила собраны отдельно — но каждая точка остаётся привязана к реальному маршруту дня.</p>
      </header>
      <ShoppingPlanner />
    </>
  );
}
