"use client";

import { useEffect } from "react";
import { withBasePath } from "@/app/site-path";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(withBasePath("/sw.js"), { scope: withBasePath("/") }).catch(() => undefined);
    }
    const offlineNavigation = (event: MouseEvent) => {
      if (navigator.onLine || event.defaultPrevented || event.button !== 0) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.target || new URL(link.href).origin !== window.location.origin) return;
      event.preventDefault();
      window.location.assign(link.href);
    };
    document.addEventListener("click", offlineNavigation, true);
    return () => document.removeEventListener("click", offlineNavigation, true);
  }, []);
  return null;
}
