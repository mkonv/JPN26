"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { withBasePath } from "@/app/site-path";

export function ServiceWorkerRegistration() {
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let cancelled = false;
    const hadController = Boolean(navigator.serviceWorker.controller);
    let removeUpdateListener: (() => void) | undefined;
    const announce = (name: string) => window.dispatchEvent(new CustomEvent(name));

    navigator.serviceWorker.register(withBasePath("/sw.js"), {
      scope: withBasePath("/"),
      updateViaCache: "none",
    }).then((registration) => {
      if (cancelled) return;
      announce("japan-sw-ready");
      const onUpdateFound = () => {
        const installing = registration.installing;
        if (!installing) return;
        const onStateChange = () => {
          if (installing.state === "installed") announce("japan-sw-update");
        };
        installing.addEventListener("statechange", onStateChange);
        removeUpdateListener = () => installing.removeEventListener("statechange", onStateChange);
      };
      registration.addEventListener("updatefound", onUpdateFound);
      const priorCleanup = removeUpdateListener;
      removeUpdateListener = () => {
        priorCleanup?.();
        registration.removeEventListener("updatefound", onUpdateFound);
      };
      registration.update().catch(() => undefined);
    }).catch(() => announce("japan-sw-error"));

    const onControllerChange = () => {
      announce("japan-sw-ready");
      if (hadController) setUpdated(true);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      cancelled = true;
      removeUpdateListener?.();
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);
  if (!updated) return null;
  return (
    <div className="update-notice" role="status">
      <div><strong>Маршрут обновлён</strong><span>Новая офлайн-версия уже сохранена.</span></div>
      <button type="button" onClick={() => window.location.reload()}><RefreshCw size={15} /> Открыть</button>
    </div>
  );
}
