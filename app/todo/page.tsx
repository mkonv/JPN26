import type { Metadata } from "next";
import { CheckSquare2 } from "lucide-react";
import { TodoList } from "@/app/ui/todo-list";
import trip from "@/data/trip.json";

export const metadata: Metadata = { title: "Бронирования · подготовка" };

export default function TodoPage() {
  return (
    <>
      <header className="page-hero simple-hero todo-hero">
        <div className="hero-kicker"><CheckSquare2 size={15} /> до поездки</div>
        <h1>Бронирования<br />без сюрпризов.</h1>
        <p>Дедлайны, точное действие и то, что сохранить офлайн. Локальная галочка не меняет реальную бронь.</p>
      </header>
      <TodoList bookingTasks={trip.bookingTasks} />
    </>
  );
}
