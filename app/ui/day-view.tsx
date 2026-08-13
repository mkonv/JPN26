"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, Compass, ExternalLink, Gauge, MapPinned, RotateCcw, ShoppingBag, Sunrise, Ticket, TrainFront, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import trip from "@/data/trip.json";
import enrichment from "@/data/travel-enrichment.json";

type Day = (typeof trip.days)[number];
type TimelineItem = Day["timeline"][number];

const kindIcon: Record<string, React.ComponentType<{ size?: number }>> = {
  anchor: Ticket,
  move: TrainFront,
  shopping: ShoppingBag,
  decision: AlertTriangle,
  task: Check,
  flex: MapPinned,
  food: Clock3,
  return: RotateCcw,
};

export function DayView({ day, previous, next }: { day: Day; previous: Day | null; next: Day | null }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const now = new Date();
    if (now.toISOString().slice(0, 10) !== day.date) return;
    const minutes = now.getHours() * 60 + now.getMinutes();
    let nearest = 0;
    day.timeline.forEach((item, index) => {
      if (item.time === "TBD") return;
      const [h, m] = item.time.split(":").map(Number);
      if (h * 60 + m <= minutes) nearest = index;
    });
    queueMicrotask(() => setStep(nearest));
  }, [day]);

  const current = day.timeline[step];
  const following = day.timeline[step + 1] ?? null;
  const progress = Math.round(((step + 1) / day.timeline.length) * 100);
  const alternate = "alternate" in day ? day.alternate : undefined;
  const shopping = "shopping" in day ? day.shopping : undefined;
  const decision = "decision" in day ? day.decision : undefined;
  const secrets = "secrets" in day ? day.secrets : undefined;
  const enriched = enrichment.dayEnrichment[day.id as keyof typeof enrichment.dayEnrichment];

  const dayColor = useMemo(() => {
    if (day.city.includes("Киото")) return "moss";
    if (day.city.includes("Хаконе")) return "lake";
    if (day.city.includes("Токио") || day.city.includes("Fuji")) return "ink";
    return "coral";
  }, [day.city]);

  return (
    <>
      <header className={`day-detail-hero ${dayColor}`}>
        <div className="day-detail-top"><span>день {day.number} из 12</span><span>{day.city}</span></div>
        <p>{day.dateLabel}</p>
        <h1>{day.title}</h1>
        <div className="day-detail-meta"><span><Gauge size={15} /> {day.load}</span><span><MapPinned size={15} /> {day.distance}</span><span><Sunrise size={15} /> {day.wake}</span></div>
        <div className="hero-anchors">
          {day.anchors.map((anchor) => <div key={`${anchor.time}-${anchor.label}`}><span>{anchor.time}</span><strong>{anchor.label}</strong></div>)}
        </div>
      </header>

      <section className="page-section first-section">
        <div className="day-principle"><span>принцип дня</span><p>{day.principle}</p></div>
      </section>

      <nav className="parallel-jump" aria-label="Параллельные треки дня">
        <a href="#route"><Clock3 size={18} /><span><small>по умолчанию</small><strong>Маршрут</strong></span></a>
        <a href="#alternatives"><Compass size={18} /><span><small>если быстрее</small><strong>Куда свернуть</strong></span></a>
        <a href="#food"><UtensilsCrossed size={18} /><span><small>2–3 выбора</small><strong>Где поесть</strong></span></a>
        {shopping && <a href="#shopping"><ShoppingBag size={18} /><span><small>окно дня</small><strong>Шопинг</strong></span></a>}
      </nav>

      <section className="page-section now-block">
        <div className="section-heading"><div><span>ориентир</span><h2>Сейчас / дальше</h2></div><strong className="progress-label">{progress}%</strong></div>
        <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
        <article className="now-step-card">
          <div className="now-step-time"><span>сейчас</span><strong>{current.time}</strong></div>
          <div className="now-step-main"><h3>{current.title}</h3><p>{current.detail}</p></div>
          {following && <div className="next-step"><span>дальше · {following.time}</span><strong>{following.title}</strong></div>}
          <div className="step-controls">
            <button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}><ArrowLeft size={17} /> Раньше</button>
            <span>{step + 1} / {day.timeline.length}</span>
            <button onClick={() => setStep((value) => Math.min(day.timeline.length - 1, value + 1))} disabled={step === day.timeline.length - 1}>Дальше <ArrowRight size={17} /></button>
          </div>
        </article>
      </section>

      {decision && (
        <section className="page-section decision-section">
          <div className="section-heading"><div><span>если что-то пошло не так</span><h2>{decision.title}</h2></div></div>
          <article className="decision-card">
            <div className="decision-trigger"><AlertTriangle size={20} /><p><span>Триггер</span>{decision.trigger}</p></div>
            <dl>
              <div><dt>Сохраняем</dt><dd>{decision.protect}</dd></div>
              <div><dt>Сокращаем</dt><dd>{decision.cut}</dd></div>
              <div><dt>Действуем</dt><dd>{decision.fallback}</dd></div>
            </dl>
          </article>
        </section>
      )}

      {alternate && (
        <section className="page-section alternate-section">
          <div className="section-heading"><div><span>альтернативный день</span><h2>{alternate.title}</h2></div></div>
          {alternate.corrected && <div className="correction-note"><Check size={17} /> {alternate.note}</div>}
          <div className="alternate-timeline">
            {alternate.timeline.map((item) => <article key={`${item.time}-${item.title}`}><time>{item.time}</time><div><strong>{item.title}</strong><p>{item.detail}</p></div></article>)}
          </div>
        </section>
      )}

      <section className="page-section" id="route">
        <div className="section-heading"><div><span>полный день</span><h2>Маршрут по времени</h2></div></div>
        <div className="route-timeline">
          {day.timeline.map((item: TimelineItem, index) => {
            const Icon = kindIcon[item.kind] ?? MapPinned;
            return (
              <article className={`route-item ${item.kind} ${index === step ? "current" : ""}`} key={`${item.time}-${item.title}`}>
                <time>{item.time}</time>
                <div className="route-marker"><Icon size={14} /></div>
                <div><h3>{item.title}</h3><p>{item.detail}</p></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="page-section discovery-section" id="alternatives">
        <div className="section-heading"><div><span>параллельный трек</span><h2>Если освободилось время</h2></div></div>
        <p className="parallel-intro">Это не новый обязательный список. Выберите только одну точку, когда текущая закончилась раньше или сразу не понравилась.</p>
        <div className="alternative-cards">
          {enriched.alternatives.map((item, index) => (
            <details className="alternative-card" key={item.name}>
              <summary>
                <span className="alternative-icon"><Compass size={17} /></span>
                <span className="alternative-copy"><small>{index === 0 ? "сначала проверить" : item.when}</small><strong>{item.name}</strong><em>{item.delta}</em></span>
                <ChevronDown size={18} />
              </summary>
              <div className="alternative-detail">
                {index === 0 && <p className="alternative-trigger"><strong>Когда:</strong> {item.when}</p>}
                <p><strong>Как встроить:</strong> {item.swap}</p>
                <a href={item.url} target="_blank" rel="noreferrer">Открыть место онлайн <ExternalLink size={15} /></a>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="page-section food-section" id="food">
        <div className="section-heading"><div><span>гастрономическое путешествие</span><h2>Еда по маршруту</h2></div><Link href="/food">Паспорт блюд <ArrowRight size={16} /></Link></div>
        <p className="parallel-intro">В строке уже виден базовый выбор. Нажмите на приём пищи только если хотите сравнить все варианты.</p>
        <div className="meal-groups">
          {enriched.meals.map((meal) => {
            const best = meal.options.find((option) => option.pick) ?? meal.options[0];
            return (
              <details className="meal-group" key={`${meal.time}-${meal.label}`}>
                <summary>
                  <time>{meal.time}</time>
                  <span><small>{meal.label}</small><strong>{best.name}</strong><em>{meal.options.length === 1 ? "фиксировано" : `Открыть ${meal.options.length} варианта`}</em></span>
                  <ChevronDown size={18} />
                </summary>
                <div className="meal-detail">
                  <p className="meal-note">{meal.note}</p>
                  <div className="restaurant-cards">
                    {meal.options.map((option) => (
                      <article className={option.pick ? "recommended" : ""} key={option.name}>
                        <div className="restaurant-top"><span>{option.pick ? "базовый выбор" : option.dish}</span><strong>{option.score === "включено" ? "включено" : option.score.startsWith("Tabelog") ? option.score : `Tabelog ${option.score}`}</strong></div>
                        <h3>{option.name}</h3>
                        <p><b>{option.dish}.</b> {option.why}</p>
                        <div className="restaurant-route"><MapPinned size={15} /><span>{option.route}</span></div>
                        <a href={option.url} target="_blank" rel="noreferrer">{option.url.includes("tabelog") ? "Карточка Tabelog" : "Официальный сайт"} <ExternalLink size={14} /></a>
                      </article>
                    ))}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
        <div className="tabelog-note">{enrichment.meta.tabelogNote}</div>
      </section>

      {shopping && (
        <section className="page-section shopping-section" id="shopping">
          <div className="section-heading"><div><span>параллельный трек</span><h2>Шопинг без перегруза</h2></div></div>
          <article className="shopping-window"><ShoppingBag size={20} /><div><span>окно</span><strong>{shopping.window}</strong><p>{shopping.goal}</p></div></article>
          {"presets" in shopping && shopping.presets && (
            <div className="preset-cards">
              {shopping.presets.map((preset) => <article key={preset.name}><div><strong>{preset.name}</strong><span>{preset.minutes} мин</span></div><p>{preset.stops.join(" → ")}</p></article>)}
            </div>
          )}
          <div className="stop-chips">{shopping.stops.map((stop) => <span key={stop}>{stop}</span>)}</div>
          <div className="shopping-rule"><strong>Стоп-правило</strong><p>{shopping.rule}</p></div>
        </section>
      )}

      {secrets && secrets.length > 0 && (
        <section className="page-section">
          <div className="section-heading"><div><span>документы</span><h2>Коды этого дня</h2></div></div>
          {secrets.map((secret) => <SecretReveal label={secret.label} value={secret.value} key={secret.label} />)}
        </section>
      )}

      {day.links.length > 0 && (
        <section className="page-section online-section">
          <div className="section-heading"><div><span>нужна сеть</span><h2>Официальные ссылки</h2></div></div>
          <div className="official-links">
            {day.links.map((link) => <a href={link.url} target="_blank" rel="noreferrer" key={link.url}><span>{link.label}</span><small>онлайн</small><ExternalLink size={16} /></a>)}
          </div>
        </section>
      )}

      <nav className="day-switcher" aria-label="Соседние дни">
        {previous ? <Link href={`/day/${previous.id}`}><ArrowLeft size={17} /><span><small>день {previous.number}</small>{previous.title}</span></Link> : <span />}
        {next ? <Link href={`/day/${next.id}`} className="next"><span><small>день {next.number}</small>{next.title}</span><ArrowRight size={17} /></Link> : <span />}
      </nav>
    </>
  );
}

export function SecretReveal({ label, value }: { label: string; value: string }) {
  const storageKey = `japan-private-code:${label}`;
  const [shown, setShown] = useState(false);
  const [storedValue, setStoredValue] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const localValue = localStorage.getItem(storageKey) ?? value;
    setStoredValue(localValue);
    setDraft(localValue);
  }, [storageKey, value]);

  function saveCode() {
    const next = draft.trim();
    if (next) localStorage.setItem(storageKey, next);
    else localStorage.removeItem(storageKey);
    setStoredValue(next);
    setEditing(false);
    setShown(Boolean(next));
  }

  if (editing || !storedValue) {
    return (
      <div className="secret-card secret-editor">
        <Ticket size={19} />
        <div>
          <span>{label}</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Введите код на этом устройстве"
            autoComplete="off"
            spellCheck={false}
            aria-label={label}
          />
        </div>
        <button type="button" className="secret-action" onClick={saveCode}>сохранить</button>
      </div>
    );
  }

  return (
    <button className="secret-card" onClick={() => setShown((current) => !current)} aria-expanded={shown}>
      <Ticket size={19} />
      <div><span>{label}</span><strong>{shown ? storedValue : "••••••••••"}</strong></div>
      <span className="secret-action">{shown ? "скрыть" : "показать"}</span>
    </button>
  );
}
