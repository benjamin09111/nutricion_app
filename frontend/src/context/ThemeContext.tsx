"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      setThemeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const isDashboard = pathname?.startsWith("/dashboard");
    const activeTheme = isDashboard ? theme : "light";

    const root = document.documentElement;
    root.classList.toggle("theme-dark", activeTheme === "dark");
    root.classList.toggle("theme-light", activeTheme === "light");
    root.dataset.theme = activeTheme;
    root.style.colorScheme = activeTheme;

    if (isDashboard) {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme, pathname]);

  const value = useMemo(
    () => ({
      theme,
      isDarkMode: theme === "dark",
      setTheme: (nextTheme: Theme) => setThemeState(nextTheme),
      toggleTheme: () =>
        setThemeState((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme],
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
