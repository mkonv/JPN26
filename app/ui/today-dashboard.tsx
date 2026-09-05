"use client";

import { ArrowRight, CalendarClock, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { withBasePath } from "@/app/site-path";

type Day = { id: string; date: string; dateLabel: string; city: string; title: string; summary: string; anchors: Array<{time:string;label:string}> };
type Task = { id:string; status:string; sortDate:string; deadline:string; title:string };

function localIsoDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth()+1).padStart(2,"0");
  const d = String(now.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

export function TodayDashboard({ days, tasks }: { days: Day[]; tasks: Task[] }) {
  const [today, setToday] = useState("2026-09-05");
  useEffect(() => setToday(localIsoDate()), []);
  const current = days.find((day) => day.date === today);
  const preTrip = today < days[0].date;
  const postTrip = today > days.at(-1)!.date;
  const open = useMemo(() => tasks.filter((task) => task.status !== "done").sort((a,b)=>a.sortDate.localeCompare(b.sortDate)).slice(0,4), [tasks,today]);

  if (current) return (
    <section className="page-section first-section today-dashboard in-trip" aria-label="Сегодня">
      <div className="dashboard-status"><span className="live-dot"/><strong>Сегодня · {current.dateLabel}</strong></div>
      <div className="today-card">
        <small>{current.city}</small><h2>{current.title}</h2><p>{current.summary}</p>
        <div className="today-anchors">{current.anchors.slice(0,3).map((a)=><span key={`${a.time}-${a.label}`}><b>{a.time}</b> {a.label}</span>)}</div>
        <a className="dashboard-primary" href={withBasePath(`/day/${current.id}`)}>Открыть сегодняшний день <ArrowRight size={17}/></a>
      </div>
      <div className="dashboard-actions"><a href={withBasePath("/pocket")}><ShieldCheck size={17}/>Карман</a><a href={withBasePath("/day")}><CalendarClock size={17}/>Весь маршрут</a></div>
    </section>
  );

  if (postTrip) return (
    <section className="page-section first-section today-dashboard"><div className="dashboard-status"><CheckCircle2 size={17}/><strong>Поездка завершена</strong></div><p className="dashboard-copy">Маршрут остаётся доступен как архив и офлайн-справочник.</p><a className="dashboard-primary" href={withBasePath("/day")}>Открыть маршрут <ArrowRight size={17}/></a></section>
  );

  return (
    <section className="page-section first-section today-dashboard" aria-label="Ближайшие действия">
      <div className="dashboard-status"><Clock3 size={17}/><strong>{preTrip ? "До поездки" : "Между сегментами"}</strong></div>
      <div className="section-heading dashboard-heading"><div><span>что реально требует внимания</span><h2>Ближайшие действия</h2></div><a href={withBasePath("/todo")}>Все <ArrowRight size={15}/></a></div>
      <div className="task-peek-list">{open.map((task)=><a className="task-peek" href={withBasePath(`/todo#${task.id}`)} key={task.id}><span className={`status-dot ${task.status}`}/><div><small>{task.deadline}</small><strong>{task.title}</strong></div><ArrowRight size={15}/></a>)}</div>
      <a className="dashboard-primary" href={withBasePath("/day")}>Открыть маршрут <ArrowRight size={17}/></a>
    </section>
  );
}
