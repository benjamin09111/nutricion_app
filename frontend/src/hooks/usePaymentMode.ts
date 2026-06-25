"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "nutrinet_payment_mode";

export type PaymentMode = "mock" | "real";

function getInitialMode(): PaymentMode {
  if (typeof window === "undefined") return "mock";
  return (localStorage.getItem(STORAGE_KEY) as PaymentMode) || "mock";
}

export function usePaymentMode() {
  const [mode, setModeState] = useState<PaymentMode>(getInitialMode);

  const setMode = useCallback((next: PaymentMode) => {
    localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === "mock" ? "real" : "mock");
  }, [mode, setMode]);

  return { mode, setMode, toggle };
}
