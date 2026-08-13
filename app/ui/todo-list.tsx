"use client";

import { Check, ExternalLink, FileDown, RotateCcw, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import trip from "@/data/trip.json";

type Filter = "open" | "date" | "done";
const storageKey = "japan-booking-checks-v2";
const statusCopy = { action: "действие", verify: "проверить", watch: "по ситуации", done: "подтверждено" } as const;

export function TodoList() {
  const [filter, setFilter] = useState<Filter>("open");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    queueMicrotask(() => {
      try { setChecked(JSON.parse(localStorage.getItem(storageKey) ?? "{}")); } catch { setChecked({}); }
    });
  }, []);

  function toggle(id: string) {
    setChecked((current) => {
      const next = { ...current, [id]: !current[id] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }

  const tasks = useMemo(() => {
    const sorted = [...trip.bookingTasks].sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    if (filter === "done") return sorted.filter((task) => task.status === "done" || checked[task.id]);
    if (filter === "open") return sorted.filter((task) => task.status !== "done" && !checked[task.id]);
    return sorted;
  }, [filter, checked]);

  const counts = {
    open: trip.bookingTasks.filter((task) => task.status !== "done" && !checked[task.id]).length,
    done: trip.bookingTasks.filter((task) => task.status === "done" || checked[task.id]).length,
  };

  return (
    <section className="page-section first-section todo-content">
      <div className="todo-summary">
        <div><span>{counts.open}</span><small>открыто</small></div>
        <div><span>{counts.done}</span><small>готово</small></div>
        <div><span>{trip.bookingTasks.length}</span><small>всего</small></div>
      </div>
      <div className="todo-tabs" role="tablist" aria-label="Фильтр задач">
        <button className={filter === "open" ? "active" : ""} onClick={() => setFilter("open")}>Сейчас</button>
        <button className={filter === "date" ? "active" : ""} onClick={() => setFilter("date")}>По дате</button>
        <button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")}>Готово</button>
      </div>
      <div className="local-note"><ShieldAlert size={17} /><p><strong>Галочки хранятся только на этом устройстве.</strong> Они помогают вести список, но не покупают и не отменяют билеты.</p></div>
      <div className="todo-list">
        {tasks.map((task) => {
          const isDone = task.status === "done" || Boolean(checked[task.id]);
          return (
            <article id={task.id} className={`todo-card ${task.status} ${isDone ? "is-done" : ""}`} key={task.id}>
              <button className="todo-check" onClick={() => toggle(task.id)} aria-label={isDone ? `Снять отметку ${task.title}` : `Отметить ${task.title}`}><span>{isDone && <Check size={15} />}</span></button>
              <div className="todo-main">
                <div className="todo-card-top"><span className={`status-badge ${task.status}`}>{statusCopy[task.status]}</span><time>{task.deadline}</time></div>
                <h2>{task.title}</h2>
                <strong className="todo-price">{task.price}</strong>
                <p>{task.action}</p>
                <div className="offline-need"><FileDown size={15} /><div><span>сохранить офлайн</span><strong>{task.offline}</strong></div></div>
                {task.url && <a href={task.url} target="_blank" rel="noreferrer">Официальный сайт <ExternalLink size={15} /></a>}
              </div>
            </article>
          );
        })}
        {tasks.length === 0 && <div className="empty-state"><Check size={24} /><strong>В этой вкладке пусто</strong><p>Все открытые задачи отмечены.</p></div>}
      </div>
      {Object.keys(checked).length > 0 && <button className="reset-checks" onClick={() => { localStorage.removeItem(storageKey); setChecked({}); }}><RotateCcw size={16} /> Сбросить локальные отметки</button>}
    </section>
  );
}
