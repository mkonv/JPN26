"use client";

import { Check, ExternalLink, FileDown, RotateCcw, ShieldAlert } from "lucide-react";
import { type KeyboardEvent, useMemo, useState } from "react";
import { useLocalStorageValue } from "./use-local-storage";

type Filter = "open" | "date" | "done";
type BookingTask = {
  id: string;
  group?: string;
  status: string;
  sortDate: string;
  deadline: string;
  title: string;
  price: string;
  action: string;
  offline: string;
  url?: string;
};
const storageKey = "japan-booking-checks-v2";
const statusCopy = { action: "действие", verify: "проверить", watch: "по ситуации", done: "подтверждено" } as const;

export function TodoList({ bookingTasks }: { bookingTasks: BookingTask[] }) {
  const [filter, setFilter] = useState<Filter>("open");
  const [storedChecks, setStoredChecks] = useLocalStorageValue(storageKey, "{}");
  const checked = useMemo<Record<string, boolean>>(() => {
    try { return JSON.parse(storedChecks); } catch { return {}; }
  }, [storedChecks]);

  function toggle(id: string) {
    const next = { ...checked, [id]: !checked[id] };
    setStoredChecks(JSON.stringify(next));
  }

  const tasks = useMemo(() => {
    const sorted = [...bookingTasks].sort((a, b) => a.sortDate.localeCompare(b.sortDate));
    if (filter === "done") return sorted.filter((task) => task.status === "done" || checked[task.id]);
    if (filter === "open") return sorted.filter((task) => task.status !== "done" && !checked[task.id]);
    return sorted;
  }, [bookingTasks, filter, checked]);

  const counts = {
    open: bookingTasks.filter((task) => task.status !== "done" && !checked[task.id]).length,
    done: bookingTasks.filter((task) => task.status === "done" || checked[task.id]).length,
  };
  const groupedTasks = useMemo(() => {
    const groups = new Map<string, BookingTask[]>();
    for (const task of tasks) {
      const group = task.group ?? "Билеты, транспорт и подготовка";
      groups.set(group, [...(groups.get(group) ?? []), task]);
    }
    return [...groups.entries()];
  }, [tasks]);

  const tabOrder: Filter[] = ["open", "date", "done"];
  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, current: Filter) {
    const index = tabOrder.indexOf(current);
    const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!direction && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next = event.key === "Home" ? tabOrder[0] : event.key === "End" ? tabOrder.at(-1)! : tabOrder[(index + direction + tabOrder.length) % tabOrder.length];
    setFilter(next);
    requestAnimationFrame(() => document.getElementById(`todo-tab-${next}`)?.focus());
  }

  return (
    <section className="page-section first-section todo-content">
      <div className="todo-summary">
        <div><span>{counts.open}</span><small>открыто</small></div>
        <div><span>{counts.done}</span><small>готово</small></div>
        <div><span>{bookingTasks.length}</span><small>всего</small></div>
      </div>
      <div className="todo-tabs" role="tablist" aria-label="Фильтр задач">
        <button id="todo-tab-open" type="button" role="tab" aria-selected={filter === "open"} aria-controls="todo-panel" tabIndex={filter === "open" ? 0 : -1} className={filter === "open" ? "active" : ""} onClick={() => setFilter("open")} onKeyDown={(event) => handleTabKey(event, "open")}>Сейчас</button>
        <button id="todo-tab-date" type="button" role="tab" aria-selected={filter === "date"} aria-controls="todo-panel" tabIndex={filter === "date" ? 0 : -1} className={filter === "date" ? "active" : ""} onClick={() => setFilter("date")} onKeyDown={(event) => handleTabKey(event, "date")}>По дате</button>
        <button id="todo-tab-done" type="button" role="tab" aria-selected={filter === "done"} aria-controls="todo-panel" tabIndex={filter === "done" ? 0 : -1} className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")} onKeyDown={(event) => handleTabKey(event, "done")}>Готово</button>
      </div>
      <div className="local-note"><ShieldAlert size={17} /><p><strong>Галочки хранятся только на этом устройстве.</strong> Они помогают вести список, но не покупают и не отменяют билеты.</p></div>
      <div id="todo-panel" className="todo-list" role="tabpanel" aria-labelledby={`todo-tab-${filter}`}>
        {groupedTasks.map(([group, groupTasks], groupIndex) => (
          <section className="todo-group" aria-labelledby={`task-group-${groupIndex}`} key={group}>
            <div className="todo-group-heading"><h2 id={`task-group-${groupIndex}`}>{group}</h2><span>{groupTasks.length}</span></div>
            <div className="todo-group-cards">
              {groupTasks.map((task) => {
                const isDone = task.status === "done" || Boolean(checked[task.id]);
                return (
                  <article id={task.id} className={`todo-card ${task.status} ${isDone ? "is-done" : ""}`} key={task.id}>
                    <button type="button" className="todo-check" onClick={() => toggle(task.id)} aria-label={isDone ? `Снять отметку ${task.title}` : `Отметить ${task.title}`}><span>{isDone && <Check size={15} />}</span></button>
                    <div className="todo-main">
                      <div className="todo-card-top"><span className={`status-badge ${task.status}`}>{statusCopy[task.status as keyof typeof statusCopy] ?? task.status}</span><time>{task.deadline}</time></div>
                      <h2>{task.title}</h2>
                      <strong className="todo-price">{task.price}</strong>
                      <p>{task.action}</p>
                      <div className="offline-need"><FileDown size={15} /><div><span>сохранить офлайн</span><strong>{task.offline}</strong></div></div>
                      {task.url && <a href={task.url} target="_blank" rel="noreferrer">Официальный сайт <ExternalLink size={15} /></a>}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
        {tasks.length === 0 && <div className="empty-state"><Check size={24} /><strong>В этой вкладке пусто</strong><p>Все открытые задачи отмечены.</p></div>}
      </div>
      {Object.keys(checked).length > 0 && <button type="button" className="reset-checks" onClick={() => setStoredChecks(null)}><RotateCcw size={16} /> Сбросить локальные отметки</button>}
    </section>
  );
}
