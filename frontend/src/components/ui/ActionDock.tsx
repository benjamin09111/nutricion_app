"use client";

import React, { useEffect, useState } from "react";
import { LucideIcon, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";

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
          "bg-white/80 backdrop-blur-xl border border-slate-200 rounded-4xl shadow-2xl transition-all duration-200",
          isCollapsed ? "p-1.5" : "p-2",
        )}
      >
        <button
          type="button"
          onClick={() => setIsCollapsed((current) => !current)}
          aria-label={isCollapsed ? "Expandir acciones" : "Minimizar acciones"}
          title={isCollapsed ? "Expandir acciones" : "Minimizar acciones"}
          className={cn(
            "group flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900",
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
                    className="h-px bg-slate-100 mx-2 my-1"
                  />
                );
              }

              const variantStyles = {
                indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
                emerald: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
                amber: "bg-amber-50 text-amber-600 hover:bg-amber-100",
                rose: "bg-rose-50 text-rose-600 hover:bg-rose-100",
                slate: "bg-slate-50 text-slate-600 hover:bg-slate-100",
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
                  <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest whitespace-nowrap z-[60]">
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
