"use client";

import { Check, CloudDownload, RefreshCw, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import trip from "@/data/trip.json";
import { withBasePath } from "@/app/site-path";

const routes = [
  "/", "/day/", "/todo/", "/china/", "/food/", "/plan-b/", "/transport/", "/shopping/", "/pocket/",
  ...trip.days.map((day) => `/day/${day.id}/`),
].map(withBasePath);

export function OfflinePanel() {
  const [state, setState] = useState<"idle" | "saving" | "ready" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      setOnline(navigator.onLine);
      setLastSaved(localStorage.getItem("japan-offline-saved"));
    });
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  async function saveOffline() {
    setState("saving");
    try {
      if (!("serviceWorker" in navigator)) throw new Error("unsupported");
      const registration = await navigator.serviceWorker.ready;
      const responses = await Promise.all(routes.map((route) => fetch(route, { cache: "reload" })));
      const assetUrls = new Set<string>();
      for (const response of responses) {
        const html = await response.clone().text();
        const document = new DOMParser().parseFromString(html, "text/html");
        document.querySelectorAll<HTMLScriptElement>("script[src]").forEach((node) => assetUrls.add(node.src));
        document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href], link[rel="preload"][href]').forEach((node) => assetUrls.add(node.href));
      }
      await Promise.all([...assetUrls].map((url) => fetch(url, { cache: "reload" }).catch(() => undefined)));
      registration.active?.postMessage({ type: "CACHE_ROUTES", routes });
      if (navigator.storage?.persist) await navigator.storage.persist();
      const stamp = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date());
      localStorage.setItem("japan-offline-saved", stamp);
      setLastSaved(stamp);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  return (
    <article className="offline-card">
      <div className="offline-head">
        <div className={`offline-symbol ${state === "ready" || lastSaved ? "ready" : ""}`}>
          {state === "ready" || lastSaved ? <Check size={22} /> : <CloudDownload size={22} />}
        </div>
        <div><strong>{lastSaved ? "Маршрут сохранён" : "Подготовить офлайн-копию"}</strong><span>{online ? "Сеть доступна" : "Сейчас вы офлайн"}{lastSaved ? ` · ${lastSaved}` : ""}</span></div>
      </div>
      <p>Кнопка загрузит все 12 дней, Китай, гастрономию, To Do и справочники на этот iPhone. Официальные сайты мест всё равно открываются только с сетью.</p>
      <button className="primary-button" onClick={saveOffline} disabled={state === "saving" || !online}>
        {state === "saving" ? <RefreshCw className="spin" size={18} /> : <CloudDownload size={18} />}
        {state === "saving" ? "Сохраняю все страницы…" : lastSaved ? "Обновить офлайн-копию" : "Сохранить весь маршрут"}
      </button>
      {state === "error" && <div className="inline-error">Не удалось сохранить. Откройте сайт в Safari при стабильной сети и повторите.</div>}
      <details className="ios-help">
        <summary><Smartphone size={17} /> Добавить на экран «Домой»</summary>
        <ol><li>Откройте сайт в Safari.</li><li>Нажмите «Поделиться».</li><li>Выберите «На экран Домой».</li><li>Запустите и один раз нажмите «Сохранить весь маршрут».</li></ol>
      </details>
    </article>
  );
}
