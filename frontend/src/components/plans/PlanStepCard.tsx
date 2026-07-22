import React from "react";
import { cn } from "@/lib/utils";

interface PlanStepCardProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function PlanStepCard({
  icon,
  title,
  subtitle,
  children,
  className,
}: PlanStepCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-2.5 mb-1">
        {icon && (
          <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            {icon}
          </span>
        )}
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
