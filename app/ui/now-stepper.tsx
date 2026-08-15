"use client";

import { ArrowLeft, ArrowRight, LocateFixed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TimelineStep = { time: string; title: string; detail: string };
type DayMode = "past" | "today" | "future";
type ManualSelection = { signature: string; step: number };

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

function timelineSignature(date: string, timeline: TimelineStep[]) {
  return `${date}|${timeline.map((item) => `${item.time}\u0000${item.title}`).join("\u0001")}`;
}

export function NowStepper({ date, timeline }: { date: string; timeline: TimelineStep[] }) {
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [manualSelection, setManualSelection] = useState<ManualSelection | null>(null);
  const signature = useMemo(() => timelineSignature(date, timeline), [date, timeline]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const automatic = useMemo(() => {
    void clockTick;
    return automaticStep(date, timeline);
  }, [date, timeline, clockTick]);

  const selectedManualStep = manualSelection?.signature === signature ? manualSelection.step : null;
  const autoFollow = selectedManualStep === null;
  const step = autoFollow
    ? automatic.step
    : Math.min(Math.max(selectedManualStep, 0), Math.max(0, timeline.length - 1));
  const mode = automatic.mode;

  const current = timeline[step];
  if (!current) return null;
  const following = timeline[step + 1] ?? null;
  const progress = Math.round(((step + 1) / timeline.length) * 100);
  const header = mode === "today" ? "Сейчас / дальше" : mode === "future" ? "Начало дня" : "День завершён";
  const timeLabel = mode === "today" && autoFollow ? "сейчас" : mode === "future" ? "старт" : mode === "past" ? "финал" : "выбрано";

  const selectManualStep = (nextStep: number) => {
    setManualSelection({ signature, step: Math.min(Math.max(nextStep, 0), timeline.length - 1) });
  };

  return (
    <section className="page-section now-block" aria-live="polite">
      <div className="section-heading"><div><span>ориентир</span><h2>{header}</h2></div><strong className="progress-label">{progress}%</strong></div>
      <div className="progress-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      <article className="now-step-card">
        <div className="now-step-time"><span>{timeLabel}</span><strong>{current.time}</strong></div>
        <div className="now-step-main"><h3>{current.title}</h3><p>{current.detail}</p></div>
        {following && <div className="next-step"><span>дальше · {following.time}</span><strong>{following.title}</strong></div>}
        <div className="step-controls">
          <button type="button" onClick={() => selectManualStep(step - 1)} disabled={step === 0}><ArrowLeft size={17} /> Раньше</button>
          <span>{step + 1} / {timeline.length}</span>
          <button type="button" onClick={() => selectManualStep(step + 1)} disabled={step === timeline.length - 1}>Дальше <ArrowRight size={17} /></button>
        </div>
        {!autoFollow && mode === "today" && <button type="button" className="return-now" onClick={() => setManualSelection(null)}><LocateFixed size={15} /> К текущему времени</button>}
      </article>
    </section>
  );
}
