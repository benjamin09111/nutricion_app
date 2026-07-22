"use client";

import { useEffect, useCallback } from "react";

export function usePlanDraft<T extends Record<string, unknown>>(
  key: string,
  initialState: T,
  onLoad?: (data: T) => void,
) {
  useEffect(() => {
    if (!onLoad) return;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      onLoad(parsed as T);
    } catch {
      // corrupted draft, ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const persist = useCallback(
    (data: T) => {
      localStorage.setItem(key, JSON.stringify(data));
    },
    [key],
  );

  const clear = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return { persist, clear };
}
