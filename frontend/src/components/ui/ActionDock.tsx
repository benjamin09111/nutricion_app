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
        "fixed z-50 transition-all duration-300",
        // Mobile (< 768px): Bottom floating navbar
        "bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-2 right-2 sm:left-4 sm:right-4 max-w-[calc(100vw-1rem)] mx-auto",
        // Desktop (>= 768px): Vertical dock on the right
        "md:bottom-auto md:left-auto md:right-4 md:top-1/2 md:-translate-y-1/2 md:max-w-none md:mx-0",
        "xl:right-8",
        className,
      )}
    >
      <div
        className={cn(
          "backdrop-blur-xl border shadow-2xl transition-all duration-200",
          "rounded-2xl p-1 sm:p-2 md:rounded-4xl",
          isDarkMode
            ? "border-emerald-400/12 bg-slate-950/90 shadow-black/40"
            : "bg-white/95 border-slate-200/90 shadow-slate-900/15",
        )}
      >
        <div className="flex flex-row md:flex-col items-center justify-around md:justify-start gap-1 sm:gap-1.5 md:gap-2 overflow-x-auto no-scrollbar py-0.5 px-0.5 md:py-0 md:px-0">
          {items.map((item, index) => {
            if (item.isSeparator) {
              return (
                <div
                  key={`sep-${index}`}
                  className={cn(
                    "shrink-0",
                    "my-1 h-6 w-px mx-0.5",
                    "md:my-1 md:h-px md:w-auto md:mx-2",
                    isDarkMode ? "bg-emerald-400/10" : "bg-slate-200"
                  )}
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
                  "group relative rounded-full p-2.5 sm:p-3 md:p-4 transition-all shrink-0 flex items-center justify-center",
                  variantStyles[item.variant || "slate"],
                  item.disabled ? "cursor-not-allowed opacity-45 hover:bg-slate-50" : "cursor-pointer active:scale-95",
                )}
                title={item.description || item.label}
              >
                <Icon className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:scale-110 shrink-0" />

                {/* Tooltip para escritorios */}
                <span
                  className={cn(
                    "hidden md:block absolute right-full top-1/2 mr-4 -translate-y-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest opacity-0 transition-opacity pointer-events-none group-hover:opacity-100 z-[60]",
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
