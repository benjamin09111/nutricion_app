"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

export type FontPreference = "default" | "formal";

type FontContextValue = {
  fontPreference: FontPreference;
  isFormalFont: boolean;
  setFontPreference: (font: FontPreference) => void;
};

const STORAGE_KEY = "nutri_font_preference";

const FontContext = createContext<FontContextValue | null>(null);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [fontPreference, setFontPreferenceState] = useState<FontPreference>(() => {
    if (typeof window === "undefined") {
      return "default";
    }

    const storedPreference = window.localStorage.getItem(STORAGE_KEY);
    return storedPreference === "formal" ? "formal" : "default";
  });

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const body = document.body;
    const isFormal = fontPreference === "formal";

    root.dataset.font = fontPreference;
    body.style.fontFamily = isFormal ? 'Helvetica, Arial, sans-serif' : '"Poppins", sans-serif';
    window.localStorage.setItem(STORAGE_KEY, fontPreference);
  }, [fontPreference]);

  const value = useMemo(
    () => ({
      fontPreference,
      isFormalFont: fontPreference === "formal",
      setFontPreference: (nextFont: FontPreference) => setFontPreferenceState(nextFont),
    }),
    [fontPreference],
  );

  return <FontContext.Provider value={value}>{children}</FontContext.Provider>;
}

export function useFont() {
  const context = useContext(FontContext);

  if (!context) {
    throw new Error("useFont must be used within a FontProvider");
  }

  return context;
}
