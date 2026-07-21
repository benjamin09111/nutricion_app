"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  isDarkMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "nutri_theme_preference";

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    window.localStorage.setItem(STORAGE_KEY, "light");
    const root = document.documentElement;
    root.classList.remove("theme-dark");
    root.classList.add("theme-light");
    root.dataset.theme = "light";
    root.style.colorScheme = "light";
  }, []);

  const value = useMemo(
    () => ({
      theme: "light" as Theme,
      isDarkMode: false,
      setTheme: () => {},
      toggleTheme: () => {},
    }),
    [],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
