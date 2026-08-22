"use client";

import { ArrowLeft, ArrowRight, LocateFixed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TimelineStep = { time: string; title: string; detail: string };
type DayMode = "past" | "today" | "future";

function japanClock() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return { date: `${part("year")}-${part("month")}-${part("day")}`, minutes: Number(part("hour")) * 60 + Number(part("minute")) };
}

function automaticStep(date: string, timeline: TimelineStep[]) {
  const now = japanClock();
  const mode: DayMode = date < now.date ? "past" : date > now.date ? "future" : "today";
  if (mode === "past") return { mode, step: Math.max(0, timeline.length - 1) };
  if (mode === "future") return { mode, step: 0 };
  let step = 0;
  timeline.forEach((item, index) => {
    if (!/^\d{2}:\d{2}$/.test(item.time)) return;
    const [hours, minutes] = item.time.split(":").map(Number);
    if (hours * 60 + minutes <= now.minutes) step = index;
  });
  return { mode, step };
}

export function NowStepper({ date, timeline }: { date: string; timeline: TimelineStep[] }) {
  const initial = useMemo(() => automaticStep(date, timeline), [date, timeline]);
  const [step, setStep] = useState(initial.step);
  const [mode, setMode] = useState<DayMode>(initial.mode);
  const [autoFollow, setAutoFollow] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = automaticStep(date, timeline);
      setMode(next.mode);
      setStep(next.step);
      setAutoFollow(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [date, timeline]);

  useEffect(() => {
    if (!autoFollow) return;
    const refresh = () => {
      const next = automaticStep(date, timeline);
      setMode(next.mode);
      setStep(next.step);
    };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, [date, timeline, autoFollow]);

  const current = timeline[step];
  if (!current) return null;
  const following = timeline[step + 1] ?? null;
  const progress = Math.round(((step + 1) / timeline.length) * 100);
  const header = mode === "today" ? "Сейчас / дальше" : mode === "future" ? "Начало дня" : "День завершён";
  const timeLabel = mode === "today" && autoFollow ? "сейчас" : mode === "future" ? "старт" : mode === "past" ? "финал" : "выбрано";

  return (
    <section className="page-section now-block" aria-live="polite">
      <div className="section-heading"><div><span>ориентир</span><h2>{header}</h2></div><strong className="progress-label">{progress}%</strong></div>
      <div className="progress-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      <article className="now-step-card">
        <div className="now-step-time"><span>{timeLabel}</span><strong>{current.time}</strong></div>
        <div className="now-step-main"><h3>{current.title}</h3><p>{current.detail}</p></div>
        {following && <div className="next-step"><span>дальше · {following.time}</span><strong>{following.title}</strong></div>}
        <div className="step-controls">
          <button type="button" onClick={() => { setAutoFollow(false); setStep((value) => Math.max(0, value - 1)); }} disabled={step === 0}><ArrowLeft size={17} /> Раньше</button>
          <span>{step + 1} / {timeline.length}</span>
          <button type="button" onClick={() => { setAutoFollow(false); setStep((value) => Math.min(timeline.length - 1, value + 1)); }} disabled={step === timeline.length - 1}>Дальше <ArrowRight size={17} /></button>
        </div>
        {!autoFollow && mode === "today" && <button type="button" className="return-now" onClick={() => { const next = automaticStep(date, timeline); setStep(next.step); setAutoFollow(true); }}><LocateFixed size={15} /> К текущему времени</button>}
      </article>
    </section>
  );
}
