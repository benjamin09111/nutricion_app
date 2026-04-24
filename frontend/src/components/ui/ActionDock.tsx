"use client";

import React, { useEffect, useState } from "react";
import { LucideIcon, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export interface ActionDockItem {
  id: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "indigo" | "emerald" | "amber" | "rose" | "slate";
  isSeparator?: boolean;
  disabled?: boolean;
}

interface ActionDockProps {
  items: ActionDockItem[];
  className?: string;
}

export function ActionDock({ items, className }: ActionDockProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 1440px)");
    setIsCollapsed(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsCollapsed(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div
      className={cn(
        "fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50 animate-in slide-in-from-right duration-500",
        className,
      )}
    >
      <div
        className={cn(
          "backdrop-blur-xl border rounded-4xl shadow-2xl transition-all duration-200",
          isDarkMode
            ? "border-emerald-400/12 bg-slate-950/70 shadow-black/30"
            : "bg-white/80 border-slate-200",
          isCollapsed ? "p-1.5" : "p-2",
        )}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed((current) => !current)}
          aria-label={isCollapsed ? "Expandir acciones" : "Minimizar acciones"}
          title={isCollapsed ? "Expandir acciones" : "Minimizar acciones"}
          className={cn(
            "group flex items-center justify-center rounded-full border text-slate-600 shadow-sm transition-all",
            isDarkMode
              ? "border-emerald-400/12 bg-slate-900/80 text-emerald-100 hover:bg-emerald-500/10 hover:text-emerald-50"
              : "border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-900",
            isCollapsed ? "h-11 w-11" : "mb-2 h-10 w-10",
          )}
        >
          {isCollapsed ? (
            <PanelRightOpen className="h-5 w-5 transition-transform group-hover:scale-110" />
          ) : (
            <PanelRightClose className="h-5 w-5 transition-transform group-hover:scale-110" />
          )}
        </button>

        {!isCollapsed && (
          <div className="flex flex-col gap-2">
            {items.map((item, index) => {
              if (item.isSeparator) {
                return (
                  <div
                    key={`sep-${index}`}
                    className={cn("mx-2 my-1 h-px", isDarkMode ? "bg-emerald-400/10" : "bg-slate-100")}
                  />
                );
              }

              const variantStyles = {
                indigo: isDarkMode ? "bg-indigo-500/12 text-indigo-100 hover:bg-indigo-500/18" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
                emerald: isDarkMode ? "bg-emerald-500/12 text-emerald-50 hover:bg-emerald-500/18" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
                amber: isDarkMode ? "bg-amber-500/12 text-amber-50 hover:bg-amber-500/18" : "bg-amber-50 text-amber-600 hover:bg-amber-100",
                rose: isDarkMode ? "bg-rose-500/12 text-rose-50 hover:bg-rose-500/18" : "bg-rose-50 text-rose-600 hover:bg-rose-100",
                slate: isDarkMode ? "bg-slate-800/80 text-emerald-50 hover:bg-slate-700/80" : "bg-slate-50 text-slate-600 hover:bg-slate-100",
              };

              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={cn(
                    "p-4 rounded-full transition-all group relative",
                    variantStyles[item.variant || "slate"],
                    item.disabled
                      ? "cursor-not-allowed opacity-45 hover:bg-slate-50"
                      : "cursor-pointer",
                  )}
                >
                  <Icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
                  <span className={cn("absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest whitespace-nowrap z-[60]", isDarkMode ? "bg-slate-950 text-emerald-50" : "bg-slate-900 text-white")}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
