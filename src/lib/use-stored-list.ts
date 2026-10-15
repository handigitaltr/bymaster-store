"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Favori ve karşılaştırma listeleri yalnızca tarayıcıda (localStorage) tutulur; sunucuya kişisel veri gitmez.

const listeners = new Set<() => void>();

function readRaw(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}

function writeRaw(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // depolama kapalıysa (gizli mod vb.) sessizce yok say
  }
  listeners.forEach((listener) => listener());
}

export function useStoredList(key: string, max = 50) {
  const subscribe = useCallback(
    (callback: () => void) => {
      listeners.add(callback);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) callback();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(callback);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => "[]");
  const list = useMemo(() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, max) : [];
    } catch {
      return [];
    }
  }, [raw, max]);

  const toggle = useCallback(
    (id: string) => {
      const next = list.includes(id) ? list.filter((item) => item !== id) : [id, ...list].slice(0, max);
      writeRaw(key, JSON.stringify(next));
      return !list.includes(id);
    },
    [key, list, max],
  );

  const remove = useCallback((id: string) => writeRaw(key, JSON.stringify(list.filter((item) => item !== id))), [key, list]);
  const clear = useCallback(() => writeRaw(key, "[]"), [key]);

  return { list, has: (id: string) => list.includes(id), toggle, remove, clear };
}

export const FAVORITES_KEY = "bm:favoriler";
export const COMPARE_KEY = "bm:karsilastir";
export const COMPARE_MAX = 4;
