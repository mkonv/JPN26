"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";

type TimelineStep = { time: string; title: string; detail: string };

function currentJapanStep(date: string, timeline: TimelineStep[]) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  if (`${part("year")}-${part("month")}-${part("day")}` !== date) return 0;
  const minutes = Number(part("hour")) * 60 + Number(part("minute"));
  let nearest = 0;
  timeline.forEach((item, index) => {
    if (!/^\d{2}:\d{2}$/.test(item.time)) return;
    const [hours, itemMinutes] = item.time.split(":").map(Number);
    if (hours * 60 + itemMinutes <= minutes) nearest = index;
  });
  return nearest;
}

export function NowStepper({ date, timeline }: { date: string; timeline: TimelineStep[] }) {
  const [step, setStep] = useState(() => currentJapanStep(date, timeline));
  const current = timeline[step];
  const following = timeline[step + 1] ?? null;
  const progress = Math.round(((step + 1) / timeline.length) * 100);

  return (
    <section className="page-section now-block" aria-live="polite">
      <div className="section-heading"><div><span>ориентир</span><h2>Сейчас / дальше</h2></div><strong className="progress-label">{progress}%</strong></div>
      <div className="progress-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      <article className="now-step-card">
        <div className="now-step-time"><span>сейчас</span><strong>{current.time}</strong></div>
        <div className="now-step-main"><h3>{current.title}</h3><p>{current.detail}</p></div>
        {following && <div className="next-step"><span>дальше · {following.time}</span><strong>{following.title}</strong></div>}
        <div className="step-controls">
          <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}><ArrowLeft size={17} /> Раньше</button>
          <span>{step + 1} / {timeline.length}</span>
          <button type="button" onClick={() => setStep((value) => Math.min(timeline.length - 1, value + 1))} disabled={step === timeline.length - 1}>Дальше <ArrowRight size={17} /></button>
        </div>
      </article>
    </section>
  );
}
