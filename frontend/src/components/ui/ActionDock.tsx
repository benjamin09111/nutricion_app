"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export interface ActionDockItem {
  id: string;
  icon: LucideIcon;
  label: string;
  description?: string;
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
  const { isDarkMode } = useTheme();

  return (
    <div
      className={cn(
        "fixed right-4 top-24 z-50 flex flex-col gap-3 animate-in slide-in-from-right duration-500 xl:right-8 xl:top-1/2 xl:-translate-y-1/2",
        className,
      )}
    >
      <div
        className={cn(
          "backdrop-blur-xl border rounded-4xl p-2 shadow-2xl transition-all duration-200",
          isDarkMode
            ? "border-emerald-400/12 bg-slate-950/70 shadow-black/30"
            : "bg-white/80 border-slate-200",
        )}
      >
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
              indigo: isDarkMode
                ? "bg-indigo-500/12 text-indigo-100 hover:bg-indigo-500/18"
                : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
              emerald: isDarkMode
                ? "bg-emerald-500/12 text-emerald-50 hover:bg-emerald-500/18"
                : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
              amber: isDarkMode
                ? "bg-amber-500/12 text-amber-50 hover:bg-amber-500/18"
                : "bg-amber-50 text-amber-600 hover:bg-amber-100",
              rose: isDarkMode
                ? "bg-rose-500/12 text-rose-50 hover:bg-rose-500/18"
                : "bg-rose-50 text-rose-600 hover:bg-rose-100",
              slate: isDarkMode
                ? "bg-slate-800/80 text-emerald-50 hover:bg-slate-700/80"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100",
            };

            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                disabled={item.disabled}
                className={cn(
                  "group relative rounded-full p-4 transition-all",
                  variantStyles[item.variant || "slate"],
                  item.disabled ? "cursor-not-allowed opacity-45 hover:bg-slate-50" : "cursor-pointer",
                )}
              >
                <Icon className="h-6 w-6 transition-transform group-hover:scale-110" />
                <span
                  className={cn(
                    "absolute right-full top-1/2 mr-4 -translate-y-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 z-[60]",
                    isDarkMode ? "bg-slate-950 text-emerald-50" : "bg-slate-900 text-white",
                  )}
                >
                  {item.description || item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
