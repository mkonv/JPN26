import { ArrowRight, CheckCircle2, MapPinned, Plane, TicketCheck, UtensilsCrossed } from "lucide-react";
import trip from "@/data/trip.json";
import enrichment from "@/data/travel-enrichment.json";
import { OfflinePanel } from "./ui/offline-panel";
import { ToriiMark } from "./ui/japanese-mark";
import { SiteLink } from "./ui/site-link";

const statusLabels = {
  action: "сделать",
  verify: "проверить",
  watch: "по ситуации",
  done: "готово",
} as const;

export default function HomePage() {
  const openTasks = trip.bookingTasks.filter((task) => task.status !== "done").slice(0, 4);
  const fixedAnchors = [
    { date: "23.09", time: "09:00", title: "Himeji Castle" },
    { date: "24.09", time: "13:30", title: "Peace Museum" },
    { date: "26.09", time: "11:20", title: "Katsura" },
    { date: "01.10", time: "16:00", title: "Nakamuraza" },
  ];

  return (
    <>
      <section className="home-hero">
        <div className="hero-japanese" aria-hidden="true"><ToriiMark /><span>NIPPON · 2026</span></div>
        <div className="hero-kicker"><MapPinned size={15} /> маршрут в кармане</div>
        <h1>Япония<br /><em>19.09—03.10</em></h1>
        <p>15 календарных дней · Пекин → Япония → Чэнду</p>
        <div className="hero-proof">
          <span><TicketCheck size={16} /> 4 якоря подтверждены</span>
          <span><Plane size={16} /> 4 рейса внесены</span>
        </div>
      </section>

      <section className="page-section journey-section">
        <div className="section-heading"><div><span>от двери до двери</span><h2>Вся поездка</h2></div><SiteLink href="/china">Китай подробно <ArrowRight size={16} /></SiteLink></div>
        <div className="journey-strip">
          <div className="china"><span>19–21.09</span><strong>Пекин</strong><small>HU7986 → HU473</small></div>
          <div className="japan"><span>21.09–02.10</span><strong>Япония</strong><small>12 дней</small></div>
          <div className="china"><span>02–03.10</span><strong>Чэнду</strong><small>3U3962 → 3U3887</small></div>
        </div>
        <div className="guide-cards">
          <SiteLink href="/china" className="guide-card china-guide"><Plane size={21} /><div><small>две остановки</small><strong>Китай: рейсы и план</strong><span>Отели, транзит, багаж, панды</span></div><ArrowRight size={17} /></SiteLink>
          <SiteLink href="/food" className="guide-card food-guide"><UtensilsCrossed size={21} /><div><small>параллельный трек</small><strong>Гастрономия</strong><span>{enrichment.foodPassport.filter((item) => item.level === "must").length} главных блюд + Tabelog</span></div><ArrowRight size={17} /></SiteLink>
        </div>
      </section>

      <section className="page-section first-section">
        <div className="section-heading">
          <div><span>до поездки</span><h2>Ближайшие действия</h2></div>
          <SiteLink href="/todo">Все задачи <ArrowRight size={16} /></SiteLink>
        </div>
        <div className="task-peek-list">
          {openTasks.map((task) => (
            <SiteLink href={`/todo#${task.id}`} className="task-peek" key={task.id}>
              <span className={`status-dot ${task.status}`} />
              <div>
                <small>{task.deadline}</small>
                <strong>{task.title}</strong>
              </div>
              <span className={`mini-status ${task.status}`}>{statusLabels[task.status as keyof typeof statusLabels] ?? task.status}</span>
            </SiteLink>
          ))}
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading">
          <div><span>офлайн</span><h2>Сохранить на iPhone</h2></div>
        </div>
        <OfflinePanel />
      </section>

      <section className="page-section">
        <div className="section-heading">
          <div><span>12 дней в Японии</span><h2>Маршрут</h2></div>
          <SiteLink href="/day">Обзор <ArrowRight size={16} /></SiteLink>
        </div>
        <div className="city-ribbon" aria-label="Города поездки">
          {trip.cityRanges.map((range) => (
            <div className={`city-segment ${range.color}`} key={range.city}>
              <strong>{range.label}</strong><span>{range.dates}</span>
            </div>
          ))}
        </div>
        <div className="day-cards compact-days">
          {trip.days.map((day) => (
            <SiteLink href={`/day/${day.id}`} className="day-row" key={day.id}>
              <div className="day-number"><span>{day.number}</span><small>{day.dateLabel.slice(0, 2)}</small></div>
              <div className="day-row-copy"><small>{day.city}</small><strong>{day.title}</strong><span>{day.anchors.map((anchor) => `${anchor.time} ${anchor.label}`).join(" · ")}</span></div>
              <ArrowRight size={17} />
            </SiteLink>
          ))}
        </div>
      </section>

      <section className="page-section dark-section">
        <div className="section-heading light-heading">
          <div><span>не двигаем</span><h2>Четыре жёстких якоря</h2></div>
        </div>
        <div className="anchor-grid">
          {fixedAnchors.map((anchor) => (
            <article key={anchor.title}>
              <div><span>{anchor.date}</span><strong>{anchor.time}</strong></div>
              <p>{anchor.title}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section">
        <div className="section-heading"><div><span>логика</span><h2>Как пользоваться в поездке</h2></div></div>
        <ol className="usage-list">
          <li><span>1</span><div><strong>Откройте сегодняшний день</strong><p>Вверху сразу видны якоря и принцип дня.</p></div></li>
          <li><span>2</span><div><strong>Смотрите «сейчас / дальше»</strong><p>Переключатель меняет только текущий шаг, а не уводит на новую страницу.</p></div></li>
          <li><span>3</span><div><strong>Освободилось время — «Куда свернуть»</strong><p>Выберите одну ближайшую альтернативу, а не добавляйте все три.</p></div></li>
          <li><span>4</span><div><strong>На еде виден базовый выбор</strong><p>Откройте сравнение только для очереди, бюджета или другого блюда.</p></div></li>
          <li><span>5</span><div><strong>При задержке — блок решения</strong><p>Он прямо говорит, что защищать и что убрать первым.</p></div></li>
        </ol>
      </section>

      <div className="home-endnote"><CheckCircle2 size={17} /> Проверено {trip.meta.sourceChecked}</div>
    </>
  );
}
