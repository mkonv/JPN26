"use client";

import { Check, CloudDownload, RefreshCw, ShieldCheck, Smartphone } from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

type WorkerStatus = {
  type: "PWA_STATUS";
  ok: boolean;
  ready: boolean;
  buildId: string;
  version: string;
  cached: number;
  total: number;
  missing: string[];
  error?: string;
};

function subscribeOnline(notify: () => void) {
  window.addEventListener("online", notify);
  window.addEventListener("offline", notify);
  return () => {
    window.removeEventListener("online", notify);
    window.removeEventListener("offline", notify);
  };
}

function sendMessage(registration: ServiceWorkerRegistration, message: { type: string }, timeoutMs = 90000) {
  return new Promise<WorkerStatus>((resolve, reject) => {
    const worker = registration.active;
    if (!worker) return reject(new Error("Офлайн-модуль ещё не активен"));
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => {
      channel.port1.close();
      reject(new Error("Офлайн-модуль не ответил вовремя"));
    }, timeoutMs);
    channel.port1.onmessage = (event: MessageEvent<WorkerStatus>) => {
      window.clearTimeout(timeout);
      channel.port1.close();
      resolve(event.data);
    };
    worker.postMessage(message, [channel.port2]);
  });
}

function readyRegistration(timeoutMs = 15000) {
  return new Promise<ServiceWorkerRegistration>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Офлайн-модуль не запустился вовремя")), timeoutMs);
    navigator.serviceWorker.ready.then(
      (registration) => {
        window.clearTimeout(timeout);
        resolve(registration);
      },
      (reason) => {
        window.clearTimeout(timeout);
        reject(reason);
      },
    );
  });
}

export function OfflinePanel() {
  const [state, setState] = useState<"checking" | "idle" | "saving" | "ready" | "error">("checking");
  const [status, setStatus] = useState<WorkerStatus | null>(null);
  const [persistent, setPersistent] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

  const checkStatus = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      setState("error");
      setError("Этот браузер не поддерживает офлайн-режим сайта.");
      return;
    }
    try {
      const registration = await readyRegistration();
      const result = await sendMessage(registration, { type: "GET_STATUS" }, 15000);
      const isPersistent = navigator.storage?.persisted ? await navigator.storage.persisted() : null;
      setStatus(result);
      setPersistent(isPersistent);
      setState(result.ready ? "ready" : "idle");
      setError(result.error ?? "");
    } catch (reason) {
      setState("idle");
      setError(reason instanceof Error ? reason.message : "Проверка пока недоступна");
    }
  }, []);

  useEffect(() => {
    const refresh = () => checkStatus();
    window.addEventListener("japan-sw-ready", refresh);
    window.addEventListener("japan-sw-update", refresh);
    const initialCheck = window.setTimeout(refresh, 0);
    return () => {
      window.clearTimeout(initialCheck);
      window.removeEventListener("japan-sw-ready", refresh);
      window.removeEventListener("japan-sw-update", refresh);
    };
  }, [checkStatus]);

  async function saveOffline() {
    setState("saving");
    setError("");
    try {
      if (!("serviceWorker" in navigator)) throw new Error("unsupported");
      const registration = await readyRegistration(20000);
      const result = await sendMessage(registration, { type: "CACHE_ALL" });
      const isPersistent = navigator.storage?.persist ? await navigator.storage.persist() : null;
      setStatus(result);
      setPersistent(isPersistent);
      setState(result.ready ? "ready" : "error");
      if (!result.ready) setError(result.error ?? `Не сохранено ресурсов: ${result.missing.length}`);
    } catch (reason) {
      setState("error");
      setError(reason instanceof Error ? reason.message : "Не удалось сохранить офлайн-копию");
    }
  }

  const ready = state === "ready" && status?.ready;
  const statusLine = state === "checking"
    ? "Проверяю сохранённую копию…"
    : ready
      ? `${status.cached} из ${status.total} ресурсов · версия ${status.version}`
      : online ? "Сеть доступна · копия ещё не подтверждена" : "Сейчас вы офлайн";

  return (
    <article className="offline-card">
      <div className="offline-head">
        <div className={`offline-symbol ${ready ? "ready" : ""}`}>
          {ready ? <Check size={22} /> : <CloudDownload size={22} />}
        </div>
        <div><strong>{ready ? "Офлайн-копия готова" : "Подготовить офлайн-копию"}</strong><span>{statusLine}</span></div>
      </div>
      <p>Сайт проверит все 12 дней, Китай, гастрономию, подготовку и справочники на этом iPhone. Внешние сайты мест всё равно открываются только при наличии сети.</p>
      <button className="primary-button" onClick={saveOffline} disabled={state === "saving" || (!online && !ready)}>
        {state === "saving" ? <RefreshCw className="spin" size={18} /> : <CloudDownload size={18} />}
        {state === "saving" ? "Проверяю и сохраняю…" : ready ? "Проверить и обновить копию" : "Сохранить весь маршрут"}
      </button>
      {state === "error" && <div className="inline-error">{error || "Не удалось сохранить. Откройте сайт в Safari при стабильной сети и повторите."}</div>}
      {ready && (
        <div className={`storage-note ${persistent ? "persistent" : ""}`}>
          <ShieldCheck size={16} />
          <span>{persistent ? "iPhone подтвердил постоянное хранение копии." : "Копия проверена; iPhone может освободить её только при очистке данных или нехватке места."}</span>
        </div>
      )}
      <details className="ios-help">
        <summary><Smartphone size={17} /> Добавить на экран «Домой»</summary>
        <ol><li>Откройте сайт в Safari.</li><li>Нажмите «Поделиться».</li><li>Выберите «На экран Домой».</li><li>Запустите приложение и проверьте зелёный статус офлайн-копии.</li></ol>
      </details>
    </article>
  );
}
