"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanAccordionSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function PlanAccordionSection({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  children,
  className,
}: PlanAccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-white", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <span className="block text-sm font-semibold text-slate-800">{title}</span>
            {subtitle && (
              <span className="block text-xs text-slate-500 mt-0.5">{subtitle}</span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-100 pt-4">{children}</div>}
    </div>
  );
}
