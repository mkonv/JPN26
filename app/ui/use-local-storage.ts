"use client";

import { useCallback, useSyncExternalStore } from "react";

const LOCAL_CHANGE_EVENT = "japan-local-storage-change";

export function useLocalStorageValue(key: string, fallback = "") {
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) notify();
    };
    const onLocalChange = (event: Event) => {
      if ((event as CustomEvent<{ key: string }>).detail?.key === key) notify();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(LOCAL_CHANGE_EVENT, onLocalChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LOCAL_CHANGE_EVENT, onLocalChange);
    };
  }, [key]);

  const getSnapshot = useCallback(() => localStorage.getItem(key) ?? fallback, [key, fallback]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback((next: string | null) => {
    if (next === null) localStorage.removeItem(key);
    else localStorage.setItem(key, next);
    window.dispatchEvent(new CustomEvent(LOCAL_CHANGE_EVENT, { detail: { key } }));
  }, [key]);

  return [value, setValue] as const;
}
