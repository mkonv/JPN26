"use client";

import { Check, RotateCcw, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type FoodItem = {
  id: string;
  dish: string;
  region: string;
  day: string;
  level: string;
  note: string;
};

const STORAGE_KEY = "japan-food-passport-2026";

export function FoodPassport({ items }: { items: FoodItem[] }) {
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try { queueMicrotask(() => setDone(JSON.parse(saved))); } catch { /* ignore stale local data */ }
  }, []);

  const must = useMemo(() => items.filter((item) => item.level === "must"), [items]);
  const bonus = useMemo(() => items.filter((item) => item.level !== "must"), [items]);
  const mustDone = must.filter((item) => done.includes(item.id)).length;

  function toggle(id: string) {
    setDone((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    setDone([]);
  }

  return (
    <>
      <article className="food-progress">
        <div className="food-progress-icon"><UtensilsCrossed size={22} /></div>
        <div><span>Главная коллекция</span><strong>{mustDone} из {must.length} блюд</strong><p>Отмечается только на этом устройстве и работает офлайн.</p></div>
        <div className="food-progress-ring" style={{ "--food-progress": `${Math.round((mustDone / must.length) * 100)}%` } as React.CSSProperties}><span>{Math.round((mustDone / must.length) * 100)}%</span></div>
      </article>

      <PassportGroup title="Главные блюда" note="Реалистичное ядро путешествия — не нужно заказывать всё в одном месте." items={must} done={done} onToggle={toggle} />
      <PassportGroup title="Бонус, если совпал маршрут" note="Не делать отдельный крюк и не заменять нормальный отдых галочкой." items={bonus} done={done} onToggle={toggle} />

      {done.length > 0 && <button className="reset-checks" onClick={reset}><RotateCcw size={15} /> Сбросить отметки еды</button>}
    </>
  );
}

function PassportGroup({ title, note, items, done, onToggle }: { title: string; note: string; items: FoodItem[]; done: string[]; onToggle: (id: string) => void }) {
  return (
    <section className="passport-group">
      <div className="passport-group-head"><div><h2>{title}</h2><p>{note}</p></div><span>{items.filter((item) => done.includes(item.id)).length}/{items.length}</span></div>
      <div className="passport-list">
        {items.map((item) => {
          const checked = done.includes(item.id);
          return (
            <button className={`passport-item ${checked ? "checked" : ""}`} onClick={() => onToggle(item.id)} key={item.id} aria-pressed={checked}>
              <span className="passport-check">{checked && <Check size={16} />}</span>
              <span className="passport-copy"><small>{item.region} · {item.day}</small><strong>{item.dish}</strong><em>{item.note}</em></span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
