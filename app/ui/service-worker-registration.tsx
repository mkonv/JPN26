"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { withBasePath } from "@/app/site-path";

export function ServiceWorkerRegistration() {
  const [updated, setUpdated] = useState(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    let removeRegistrationListener: (() => void) | undefined;
    let removeInstallingListener: (() => void) | undefined;
    const hadController = Boolean(navigator.serviceWorker.controller);
    const announce = (name: string) => window.dispatchEvent(new CustomEvent(name));

    navigator.serviceWorker.register(withBasePath("/sw.js"), {
      scope: withBasePath("/"), updateViaCache: "none",
    }).then((registration) => {
      if (cancelled) return;
      announce("japan-sw-ready");
      const onUpdateFound = () => {
        removeInstallingListener?.();
        const installing = registration.installing;
        if (!installing) return;
        const onStateChange = () => {
          if (installing.state === "installed") announce("japan-sw-update");
        };
        installing.addEventListener("statechange", onStateChange);
        removeInstallingListener = () => installing.removeEventListener("statechange", onStateChange);
      };
      registration.addEventListener("updatefound", onUpdateFound);
      removeRegistrationListener = () => registration.removeEventListener("updatefound", onUpdateFound);
      registration.update().catch(() => undefined);
    }).catch(() => announce("japan-sw-error"));

    const onControllerChange = () => {
      announce("japan-sw-ready");
      if (hadController) setUpdated(true);
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    return () => {
      cancelled = true;
      removeInstallingListener?.();
      removeRegistrationListener?.();
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
