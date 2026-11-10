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
        "inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/80 px-3 py-1.5 shadow-xs shrink-0",
        className,
      )}
    >
      <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">{label}</span>
      <span className={cn("font-extrabold text-xs", isAtLimit ? "text-rose-600" : "text-slate-800")}>
        {usage} / {maxLimit === null ? "∞" : maxLimit}
      </span>
      {maxLimit !== null && maxLimit > 0 && (
        <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden ml-1">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              isAtLimit ? "bg-rose-500" : "bg-[#7c3aed]",
            )}
            style={{ width: `${ratio}%` }}
          />
        </div>
      )}
    </div>
  );
}
