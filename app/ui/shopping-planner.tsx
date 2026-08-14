"use client";

import { ArrowRight, Check, Clock3, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { withBasePath } from "@/app/site-path";

const stores = [
  { id: "hakuhodo", name: "Hakuhodo", area: "Aoyama", minutes: 15, task: "Кисти по списку" },
  { id: "scotch", name: "Scotch Grain", area: "Aoyama", minutes: 45, task: "Полная примерка" },
  { id: "auralee", name: "AURALEE", area: "Aoyama", minutes: 25, task: "Один просмотр" },
  { id: "pleats", name: "PLEATS PLEASE", area: "Aoyama", minutes: 20, task: "2–3 вещи" },
  { id: "homme", name: "HOMME PLISSÉ", area: "Aoyama", minutes: 20, task: "2–3 вещи" },
  { id: "onitsuka", name: "Onitsuka NIPPON MADE", area: "Omotesandō", minutes: 35, task: "Примерка модели" },
  { id: "uka", name: "uka", area: "Omotesandō", minutes: 15, task: "Быстрая покупка" },
] as const;

type ShoppingInfo = {
  window: string;
  goal: string;
  rule: string;
};
type ShoppingDay = { id: string; dateLabel: string; city: string; shopping: ShoppingInfo };

const presets = [
  { label: "Баланс", ids: ["hakuhodo", "scotch", "auralee"] },
  { label: "Обувь", ids: ["hakuhodo", "scotch", "onitsuka"] },
  { label: "Мода", ids: ["hakuhodo", "auralee", "pleats", "homme"] },
] as const;

export function ShoppingPlanner({ shoppingDays }: { shoppingDays: ShoppingDay[] }) {
  const [selected, setSelected] = useState<string[]>([...presets[0].ids]);
  const budget = 110;
  const used = useMemo(() => stores.filter((store) => selected.includes(store.id)).reduce((sum, store) => sum + store.minutes, 0), [selected]);
  const remaining = budget - used;

  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }

  return (
    <>
      <section className="page-section first-section">
        <div className="section-heading"><div><span>29 сентября · Aoyama</span><h2>Соберите 110 минут</h2></div></div>
        <article className={`time-budget ${remaining < 0 ? "over" : remaining < 20 ? "tight" : "good"}`}>
          <div><span>использовано</span><strong>{used}<small> мин</small></strong></div>
          <div><span>{remaining >= 0 ? "в запасе" : "перебор"}</span><strong>{Math.abs(remaining)}<small> мин</small></strong></div>
          <div className="budget-bar"><span style={{ width: `${Math.min(100, (used / budget) * 100)}%` }} /></div>
          <p>{remaining >= 25 ? "Комфортный запас на переходы." : remaining >= 0 ? "План плотный: не добавляйте ещё одну примерку." : "Уберите остановку — иначе пострадает Shibuya Sky."}</p>
        </article>
        <div className="shopping-presets">
          {presets.map((preset) => <button key={preset.label} className={preset.ids.length === selected.length && preset.ids.every((id) => selected.includes(id)) ? "active" : ""} onClick={() => setSelected([...preset.ids])}>{preset.label}</button>)}
        </div>
        <div className="planner-stores">
          {stores.map((store) => {
            const active = selected.includes(store.id);
            return <button className={active ? "active" : ""} onClick={() => toggle(store.id)} key={store.id}><span className="store-toggle">{active ? <Check size={15} /> : <Plus size={15} />}</span><div><small>{store.area}</small><strong>{store.name}</strong><p>{store.task}</p></div><span className="store-time"><Clock3 size={13} /> {store.minutes}</span></button>;
          })}
        </div>
        <div className="planner-rule"><Minus size={17} /><p><strong>Стоп-правило:</strong> Scotch Grain заменяет AURALEE и одну Issey остановку. Между магазинами оставляйте минимум 25 минут общего запаса.</p></div>
      </section>

      <section className="page-section all-shopping-days">
        <div className="section-heading"><div><span>вся поездка</span><h2>Окна по дням</h2></div></div>
        {shoppingDays.map((day) => {
          const shopping = day.shopping;
          return <a href={withBasePath(`/day/${day.id}#shopping`)} className="shopping-day-row" key={day.id}><div className="shopping-date"><span>{day.dateLabel.slice(0, 2)}</span><small>{day.dateLabel.slice(3, 6)}</small></div><div><small>{day.city} · {shopping.window}</small><strong>{shopping.goal}</strong><p>{shopping.rule}</p></div><ArrowRight size={17} /></a>;
        })}
      </section>
    </>
  );
}
