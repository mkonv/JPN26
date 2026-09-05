import type { Metadata } from "next";
import { CheckSquare2 } from "lucide-react";
import { TodoList } from "@/app/ui/todo-list";
import { OfflinePanel } from "@/app/ui/offline-panel";
import trip from "@/data/trip.json";

export const metadata: Metadata = { title: "Подготовка" };
export default function TodoPage(){return <><header className="page-hero simple-hero todo-hero"><div className="hero-kicker"><CheckSquare2 size={15}/> до поездки</div><h1>Подготовка<br/>без сюрпризов.</h1><p>Сейчас / По дате / Готово, плюс настройка полной офлайн-копии.</p></header><TodoList bookingTasks={trip.bookingTasks}/><section className="page-section" id="offline-setup"><div className="section-heading"><div><span>устройство</span><h2>Офлайн setup</h2></div></div><OfflinePanel/></section></>}
