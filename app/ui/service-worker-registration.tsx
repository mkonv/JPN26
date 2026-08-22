"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { withBasePath } from "@/app/site-path";

const UPDATED_FLAG = "japan-sw-updated";

export function ServiceWorkerRegistration() {
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    let updateNoticeTimer: number | undefined;
    if (sessionStorage.getItem(UPDATED_FLAG) === "1") {
      sessionStorage.removeItem(UPDATED_FLAG);
      updateNoticeTimer = window.setTimeout(() => setUpdated(true), 0);
    }

    if (!("serviceWorker" in navigator)) {
      return () => {
        if (updateNoticeTimer !== undefined) window.clearTimeout(updateNoticeTimer);
      };
    }

    let cancelled = false;
    const hadController = Boolean(navigator.serviceWorker.controller);
    const announce = (name: string) => window.dispatchEvent(new CustomEvent(name));

    const onControllerChange = () => {
      announce("japan-sw-ready");
      if (!hadController) return;
      sessionStorage.setItem(UPDATED_FLAG, "1");
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    let registrationRef: ServiceWorkerRegistration | undefined;
    const checkForUpdate = () => registrationRef?.update().catch(() => undefined);

    navigator.serviceWorker.register(withBasePath("/sw.js"), {
      scope: withBasePath("/"),
      updateViaCache: "none",
    }).then((registration) => {
      if (cancelled) return;
      registrationRef = registration;
      announce("japan-sw-ready");
      checkForUpdate();
    }).catch(() => announce("japan-sw-error"));

    const onVisible = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (updateNoticeTimer !== undefined) window.clearTimeout(updateNoticeTimer);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!updated) return null;
  return (
    <div className="update-notice" role="status">
      <div><strong>Маршрут обновлён</strong><span>Открыта свежая офлайн-версия.</span></div>
      <button type="button" onClick={() => setUpdated(false)} aria-label="Закрыть уведомление"><X size={15} /> Закрыть</button>
    </div>
  );
}
