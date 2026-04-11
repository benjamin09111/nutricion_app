"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type DashboardShellContextValue = {
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  isSidebarToggleHighlighted: boolean;
  flashSidebarToggle: () => void;
};

const DashboardShellContext = createContext<DashboardShellContextValue | null>(
  null,
);

const STORAGE_KEY = "nutri_dashboard_sidebar_collapsed";

export function DashboardShellProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState(false);
  const [isSidebarToggleHighlighted, setIsSidebarToggleHighlighted] =
    useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (storedValue === "true") {
      setIsSidebarCollapsedState(true);
    }
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    }
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed(!isSidebarCollapsed);
  }, [isSidebarCollapsed, setSidebarCollapsed]);

  const flashSidebarToggle = useCallback(() => {
    setIsSidebarToggleHighlighted(true);
    window.setTimeout(() => {
      setIsSidebarToggleHighlighted(false);
    }, 2200);
  }, []);

  const value = useMemo(
    () => ({
      isSidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebarCollapsed,
      isSidebarToggleHighlighted,
      flashSidebarToggle,
    }),
    [
      flashSidebarToggle,
      isSidebarCollapsed,
      isSidebarToggleHighlighted,
      setSidebarCollapsed,
      toggleSidebarCollapsed,
    ],
  );

  return (
    <DashboardShellContext.Provider value={value}>
      {children}
    </DashboardShellContext.Provider>
  );
}

export function useDashboardShell() {
  const context = useContext(DashboardShellContext);
  if (!context) {
    throw new Error(
      "useDashboardShell must be used within a DashboardShellProvider",
    );
  }
  return context;
}
