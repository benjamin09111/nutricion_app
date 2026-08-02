"use client";

import { cn } from "@/lib/utils";

interface UsageLimitBadgeProps {
  label: string;
  usage: number;
  limit?: number | null;
  className?: string;
}

export function UsageLimitBadge({
  label,
  usage,
  limit,
  className,
}: UsageLimitBadgeProps) {
  const isUnlimited = typeof limit === "number" && limit < 0;
  const maxLimit = isUnlimited || limit === undefined || limit === null ? null : Number(limit);
  const isAtLimit = maxLimit !== null && usage >= maxLimit;
  const ratio = maxLimit !== null && maxLimit > 0 ? Math.min(100, Math.round((usage / maxLimit) * 100)) : 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2 shadow-xs shrink-0",
        className,
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-extrabold text-slate-400 uppercase text-[10px] tracking-wider">{label}</span>
          <span className={cn("font-black text-xs", isAtLimit ? "text-rose-600" : "text-slate-900")}>
            {usage} / {maxLimit === null ? "∞" : maxLimit}
          </span>
        </div>
        {maxLimit !== null && maxLimit > 0 && (
          <div className="h-1.5 w-28 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isAtLimit ? "bg-rose-500" : "bg-gradient-to-r from-indigo-500 to-emerald-500",
              )}
              style={{ width: `${ratio}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
